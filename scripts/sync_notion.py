#!/usr/bin/env python3
"""Export public Top Gun fanfiction from one shared Notion database.

Read-only in Notion. This script never prints article bodies or credentials.
Work membership is resolved by the linked '我的作品' page's 作品識別碼.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'chapters.json'
IMAGE_DIR = ROOT / 'assets' / 'notion'
API = 'https://api.notion.com/v1/'
API_VERSION = '2022-06-28'
ALLOWED_WORKS = {'song_maketh_wingman', 'top_gun_random_writings'}
ALLOWED_RANDOM_GROUPS = {'IceMav合集', 'RooHang合集', 'IceMav和RooHang合集'}
MAX_MEDIA_BYTES = 10 * 1024 * 1024
TOKEN = os.environ.get('NOTION_TOKEN', '').strip()
DATABASE_ID = os.environ.get('NOTION_DATABASE_ID', '').strip()
page_cache: dict[str, str] = {}


def request(method: str, path: str, data: Any = None) -> dict:
    url = API + path.lstrip('/')
    body = json.dumps(data, ensure_ascii=False).encode('utf-8') if data is not None else None
    headers = {'Authorization': 'Bearer ' + TOKEN, 'Notion-Version': API_VERSION, 'Content-Type': 'application/json'}
    for attempt in range(6):
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=45) as res:
                return json.load(res)
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 5:
                try:
                    seconds = min(20, max(1, int(exc.headers.get('Retry-After', '2'))))
                except ValueError:
                    seconds = 2
                time.sleep(seconds)
                continue
            message = exc.read(800).decode('utf-8', 'replace')
            raise RuntimeError(f'Notion API HTTP {exc.code} at /{path.split("?")[0]}. Check IDs, integration permissions and sharing. {message}') from None
        except urllib.error.URLError as exc:
            if attempt < 5:
                time.sleep(1 + attempt)
                continue
            raise RuntimeError('Notion network request failed: ' + str(exc.reason)) from None
    raise RuntimeError('Notion request failed after retries')


def get_records(database_id: str) -> list[dict]:
    pages: list[dict] = []
    cursor = None
    while True:
        data = {'page_size': 100}
        if cursor:
            data['start_cursor'] = cursor
        response = request('POST', f'databases/{database_id}/query', data)
        pages += response.get('results', [])
        if not response.get('has_more'):
            break
        cursor = response.get('next_cursor')
        if not cursor:
            raise RuntimeError('Notion pagination cursor missing')
    return pages


def get_blocks(block_id: str) -> list[dict]:
    blocks: list[dict] = []
    cursor = None
    while True:
        params = {'page_size': '100'}
        if cursor:
            params['start_cursor'] = cursor
        path = f'blocks/{block_id}/children?' + urllib.parse.urlencode(params)
        response = request('GET', path)
        blocks.extend(response.get('results', []))
        if not response.get('has_more'):
            break
        cursor = response.get('next_cursor')
        if not cursor:
            raise RuntimeError('Block pagination cursor missing')
    return blocks


def prop(props: dict, *names: str) -> dict:
    for n in names:
        if n in props:
            return props[n]
    return {}


def prop_text(p: dict) -> str:
    kind = p.get('type')
    if kind in ('title', 'rich_text'):
        return ''.join(x.get('plain_text', '') for x in p.get(kind) or [])
    if kind in ('select', 'status'):
        return (p.get(kind) or {}).get('name', '')
    if kind == 'formula':
        f = p.get('formula') or {}
        return str(f.get(f.get('type', ''), '') or '')
    if kind == 'number':
        return str(p['number']) if p.get('number') is not None else ''
    return ''


def title_for(page: dict) -> str:
    props = page.get('properties') or {}
    preferred = prop(props, '文章名稱', 'Name', '名稱')
    if preferred.get('type') == 'title':
        return prop_text(preferred).strip()
    for item in props.values():
        if item.get('type') == 'title':
            return prop_text(item).strip()
    return ''


def is_public(props: dict) -> bool:
    status = prop_text(prop(props, '發布狀態', '發佈狀態')).strip()
    public = prop(props, '網站公開')
    return status in ('已發布', '已發佈') and public.get('type') == 'checkbox' and public.get('checkbox') is True


def resolve_work_slug(page_id: str) -> str:
    normalized = page_id.replace('-', '').lower()
    if normalized not in page_cache:
        try:
            p = request('GET', 'pages/' + page_id)
        except RuntimeError as exc:
            # Unrelated works may not be shared with this Integration.
            # Never treat inaccessible pages as target works.
            if 'HTTP 404' in str(exc):
                page_cache[normalized] = ''
                return ''
            raise
        properties = p.get('properties') or {}
        page_cache[normalized] = prop_text(prop(properties, '作品識別碼')).strip()
    return page_cache[normalized]


def work_for(page: dict) -> str:
    props = page.get('properties') or {}
    relation = prop(props, '所屬作品')
    if relation.get('type') != 'relation':
        return ''
    for connected in relation.get('relation', []):
        work_id = connected.get('id')
        if work_id:
            slug = resolve_work_slug(work_id)
            if slug in ALLOWED_WORKS:
                return slug
    return ''


def rich_runs(items: list[dict]) -> list[dict]:
    out = []
    for item in items or []:
        text = item.get('plain_text') or ''
        anno = item.get('annotations') or {}
        href = item.get('href')
        if not href and item.get('type') == 'text':
            href = ((item.get('text') or {}).get('link') or {}).get('url')
        out.append({'text': text, 'href': href if isinstance(href, str) else None,
                    'bold': bool(anno.get('bold')), 'italic': bool(anno.get('italic')),
                    'underline': bool(anno.get('underline')), 'strikethrough': bool(anno.get('strikethrough')),
                    'code': bool(anno.get('code'))})
    return out


def download_notion_image(block: dict) -> str | None:
    original = ((block.get('image') or {}).get('file') or {}).get('url')
    if not original:
        return None
    # These are short-lived Notion image URLs; publish a local copy instead.
    block_id = re.sub(r'[^a-f0-9]', '', block.get('id', '').lower())
    if len(block_id) != 32:
        return None
    try:
        req = urllib.request.Request(original, headers={'User-Agent': 'TopGunArchive/1.0'})
        with urllib.request.urlopen(req, timeout=45) as resp:
            mime = resp.headers.get('Content-Type', '').split(';')[0].strip().lower()
            ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif'}.get(mime)
            if not ext:
                raise RuntimeError('Unsupported Notion image type: ' + mime)
            content = resp.read(MAX_MEDIA_BYTES + 1)
        if len(content) > MAX_MEDIA_BYTES:
            raise RuntimeError('Notion image exceeds the 10 MB limit')
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        path = IMAGE_DIR / f'{block_id}.{ext}'
        if not path.exists() or path.read_bytes() != content:
            path.write_bytes(content)
        return './assets/notion/' + path.name
    except Exception as exc:
        raise RuntimeError('Failed to retrieve an image from a public Notion article: ' + str(exc)) from None


def normalized_block(block: dict, depth: int = 0) -> dict:
    if depth > 12:
        return {'type': 'paragraph', 'runs': [{'text': '[Nested content omitted]', 'href': None}]}
    kind = block.get('type', 'paragraph')
    spec = block.get(kind) or {}
    result: dict = {'type': kind}
    result['runs'] = rich_runs(spec.get('rich_text') or spec.get('title') or [])
    if kind == 'to_do':
        result['checked'] = bool(spec.get('checked'))
    if kind == 'table_row':
        result['cells'] = [rich_runs(x) for x in spec.get('cells', [])]
    if kind == 'image':
        if spec.get('type') == 'file':
            result['url'] = download_notion_image(block)
        elif spec.get('type') == 'external':
            result['url'] = (spec.get('external') or {}).get('url')
        result['caption'] = ''.join(x.get('plain_text', '') for x in spec.get('caption', []))
    if kind in ('bookmark', 'embed', 'link_preview', 'video'):
        url = spec.get('url') or (spec.get('external') or {}).get('url')
        if isinstance(url, str) and url.startswith(('http://', 'https://')):
            result = {'type': 'paragraph', 'runs': [{'text': url, 'href': url}]}
    if block.get('has_children'):
        result['children'] = [normalized_block(b, depth + 1) for b in get_blocks(block['id'])]
    return result


def export() -> None:
    if not TOKEN or not DATABASE_ID:
        raise RuntimeError('Please set NOTION_TOKEN and NOTION_DATABASE_ID in GitHub Actions Secrets')
    records = get_records(DATABASE_ID)
    public_candidates = [p for p in records if is_public(p.get('properties') or {})]
    collected = []
    seen = set()
    ignored_group = 0
    for page in public_candidates:
        work = work_for(page)
        if not work:
            continue
        props = page.get('properties') or {}
        title = title_for(page)
        slug = prop_text(prop(props, '網站章節識別碼')).strip()
        order_prop = prop(props, '章節順序')
        num = order_prop.get('number') if order_prop.get('type') == 'number' else None
        group = prop_text(prop(props, '故事篇章')).strip()
        if work == 'top_gun_random_writings' and group not in ALLOWED_RANDOM_GROUPS:
            ignored_group += 1
            continue
        if not title or not slug or not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', slug):
            raise RuntimeError('A published Top Gun article is missing its title or has an invalid 網站章節識別碼')
        if not isinstance(num, (int, float)) or isinstance(num, bool):
            raise RuntimeError('A published Top Gun article is missing numeric 章節順序')
        key = (work, slug)
        if key in seen:
            raise RuntimeError('Duplicate public article slug inside a Top Gun series: ' + slug)
        seen.add(key)
        cp_prop = prop(props, 'CP / 配對', 'CP／配對', 'CP')
        cps = [p.get('name', '') for p in cp_prop.get('multi_select', [])] if cp_prop.get('type') == 'multi_select' else []
        if cp_prop.get('type') == 'select':
            cps = [prop_text(cp_prop)] if prop_text(cp_prop) else []
        rating = prop_text(prop(props, '閱讀分級')).strip() or '一般'
        chapter_type = prop_text(prop(props, '章節類型')).strip() or '短篇'
        content_blocks = [normalized_block(b) for b in get_blocks(page['id'])]
        collected.append({'work': work, 'slug': slug, 'title': title, 'chapterNumber': int(num),
                          'storyArc': group, 'cp': cps, 'ageRating': rating, 'chapterType': chapter_type,
                          'blocks': content_blocks})
    collected.sort(key=lambda x:(x['work'], x['chapterNumber'], x['slug']))
    result = {'site': 'TOP GUN — STORIES BEYOND THE SKY', 'chapters': collected}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if not OUT.exists() or OUT.read_text(encoding='utf-8') != content:
        OUT.write_text(content, encoding='utf-8')
    counts = {name: sum(ch['work'] == name for ch in collected) for name in sorted(ALLOWED_WORKS)}
    print(f'Notion database records: {len(records)}')
    print(f'Eligible published records across database: {len(public_candidates)}')
    print(f'Exported Top Gun public articles: {len(collected)}')
    print(f'Per series: {counts}')
    if ignored_group:
        print(f'Excluded random-series records outside the three approved collections: {ignored_group}')
    print('Draft and website-private articles were NOT exported; no article bodies printed to logs.')


if __name__ == '__main__':
    try:
        export()
    except Exception as exc:
        print('Sync failed: ' + str(exc), file=sys.stderr)
        sys.exit(1)
