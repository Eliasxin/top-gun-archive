
(() => {
  'use strict';

  const CONFIG = Object.freeze(window.TOP_GUN_CONFIG || {});

  const EXTERNAL_URLS = Object.freeze({
    where_wake_turbulence_ends:
      CONFIG.turbulenceUrl || 'https://turbulence-eim.pages.dev/',
    globetrotting:
      CONFIG.globetrottingUrl || 'https://globetrotting.pages.dev/'
  });

  const WORKS = [
    {
      id: 'song_maketh_wingman',
      number: '01',
      title: 'Song Maketh Wingman',
      subtitle: '歌曲短篇系列',
      description: '讓音樂成為領航員。在熟悉的旋律裡，看見不同的相遇與告別。',
      image: './assets/card-wingman.webp?v=2',
      kind: 'series',
      state: 'SHORT STORIES'
    },
    {
      id: 'top_gun_random_writings',
      number: '02',
      title: '隨寫系列',
      subtitle: '三組獨立合集',
      description: '不同時間裡的小片段，保留那些一閃而過的日常與心動。',
      image: './assets/card-random.webp?v=2',
      kind: 'series',
      state: 'THREE COLLECTIONS'
    },
    {
      id: 'where_wake_turbulence_ends',
      number: '03',
      title: 'Where Wake Turbulence Ends',
      subtitle: '獨立長篇',
      description: '有些人從相遇的那一刻起，就注定會在彼此的生命裡留下痕跡。從年少時共同仰望的天空，到長大後各自飛行的航線。關於錯過、等待，以及再次靠近。',
      image: './assets/card-turbulence.webp?v=2',
      kind: 'external',
      state: 'EXTERNAL WEBSITE'
    },
    {
      id: 'globetrotting',
      number: '04',
      title: '時空交錯的旅行',
      subtitle: '獨立長篇',
      description: '跨越距離與時空的相遇，保留自己的故事入口與閱讀脈絡。',
      image: './assets/card-globetrotting.webp?v=2',
      kind: 'external',
      state: 'INDEPENDENT WEBSITE'
    }
  ];

  const GROUPS = [
    {
      id: 'IceMav合集',
      title: 'IceMav 合集',
      detail: 'Iceman × Maverick'
    },
    {
      id: 'RooHang合集',
      title: 'RooHang 合集',
      detail: 'Rooster × Hangman'
    },
    {
      id: 'IceMav和RooHang合集',
      title: 'IceMav 和 RooHang 合集',
      detail: '多配對短篇；以文章實際標示為準'
    }
  ];

  const els = {
    home: document.getElementById('homeView'),
    sub: document.getElementById('subView'),
    grid: document.getElementById('archiveGrid'),
    nav: document.getElementById('mainNav'),
    menu: document.getElementById('menuToggle'),
    age: document.getElementById('ageDialog'),
    ageCancel: document.getElementById('ageCancel'),
    ageContinue: document.getElementById('ageContinue')
  };

  const state = {
    chapters: [],
    ready: false,
    error: false,
    ageGranted: false,
    pendingReader: null
  };

  try {
    state.ageGranted =
      sessionStorage.getItem('topgun-age-agreed') === 'yes';
  } catch (_) {}

  const byId = id => WORKS.find(w => w.id === id);

  const cpLabel = ch =>
    (Array.isArray(ch.cp) ? ch.cp : []).join('、') ||
    '未標示 CP';

  const isAdult = ch =>
    /18\+|r18|成人|限制|explicit/i.test(ch.ageRating || '');

  const escapeHtml = value =>
    String(value == null ? '' : value).replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c]
    );

  function safeHttp(url) {
    if (typeof url !== 'string') return null;

    const value = url.trim();

    if (!/^https?:\/\//i.test(value)) return null;

    try {
      const parsed = new URL(value);

      return ['https:', 'http:'].includes(parsed.protocol)
        ? parsed.href
        : null;
    } catch (_) {
      return null;
    }
  }

  const workUrl = work =>
    safeHttp(EXTERNAL_URLS[work.id]);

  const storiesFor = id =>
    state.chapters
      .filter(ch => ch.work === id)
      .sort((a, b) =>
        (a.chapterNumber ?? 999999) -
        (b.chapterNumber ?? 999999) ||
        a.title.localeCompare(b.title)
      );

  const pageTitle = value => {
    document.title = value + ' | TOP GUN · SAKURAI_TK';
  };

  function routeTo(hash) {
    if (location.hash === hash) {
      route();
    } else {
      location.hash = hash;
    }
  }

  function scrollTop() {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  function updateNav(view) {
    const map = {
      home: 'home',
      archive: 'archive',
      song_maketh_wingman: 'wingman',
      top_gun_random_writings: 'random'
    };

    els.nav.querySelectorAll('a').forEach(a => {
      a.classList.toggle(
        'active',
        a.dataset.nav === map[view]
      );
    });
  }

  function renderCards() {
    els.grid.replaceChildren(
      ...WORKS.map(work => {
        const count = work.kind === 'series'
          ? storiesFor(work.id).length
          : null;

        const external = work.kind === 'external'
          ? workUrl(work)
          : null;

        const a = document.createElement('a');
        a.className = 'archive-card';

        a.href = external || '#series/' + work.id;

        if (external) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.setAttribute(
            'aria-label',
            '前往 ' + work.title + ' 獨立網站（新分頁）'
          );
        }

        const badge = count === null
          ? work.state
          : count
            ? `${count} 篇已公開`
            : '等待公開';

        a.innerHTML = `
          <div class="card-media">
            <img
              src="${escapeHtml(work.image)}"
              loading="lazy"
              alt=""
            >
            <span class="card-num">${work.number}</span>
          </div>

          <div class="card-body">
            <h3 class="card-title">
              ${escapeHtml(work.title)}
            </h3>

            <div class="card-line"></div>

            <p class="card-copy">
              ${escapeHtml(work.description)}
            </p>

            <div class="card-meta">
              <span class="card-chip">
                ${escapeHtml(work.subtitle)}
              </span>

              ${external
                ? '<span class="card-chip special">直接前往網站</span>'
                : ''}
            </div>

            <div class="card-foot">
              <span>${escapeHtml(badge)}</span>
              <strong>↗</strong>
            </div>
          </div>
        `;

        return a;
      })
    );
  }

  function subFrame(
    crumb,
    title,
    text,
    image,
    kicker = 'FLIGHT ARCHIVE'
  ) {
    return `
      <div class="crumbs">
        <a href="#home">首頁</a>
        <span>/</span>
        <a href="#archive">作品檔案</a>
        <span>/</span>
        <span>${escapeHtml(crumb)}</span>
      </div>

      <header class="sub-hero">
        <div>
          <p class="section-kicker">
            <span class="gold-square"></span>
            ${escapeHtml(kicker)}
          </p>

          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(text)}</p>
        </div>

        <img src="${escapeHtml(image)}" alt="">
      </header>
    `;
  }

  function showSeries(id) {
    const work = byId(id);

    if (!work || work.kind !== 'series') {
      return showMissing();
    }

    pageTitle(work.title);

    const current = storiesFor(id);

    const categories =
      id === 'top_gun_random_writings'
        ? `
          <div class="series-categories">
            ${GROUPS.map(group => `
              <div>
                <strong>${escapeHtml(group.title)}</strong>
                <span>${escapeHtml(group.detail)}</span>
              </div>
            `).join('')}
          </div>
        `
        : '';

    els.sub.innerHTML =
      subFrame(
        work.title,
        work.title,
        work.description,
        work.image,
        'SERIES FILE / ' + work.number
      ) +
      categories +
      `
        <div class="list-header">
          <h2>公開故事目錄</h2>
          <span class="feature-label">
            ${current.length} PUBLIC STORIES
          </span>
        </div>

        <div class="filter-row">
          <input
            id="storySearch"
            type="search"
            placeholder="搜尋故事標題或配對"
            aria-label="搜尋作品"
          >

          <select id="cpFilter" aria-label="篩選配對">
            <option value="all">全部 CP</option>
          </select>

          ${id === 'top_gun_random_writings'
            ? `
              <select
                id="groupFilter"
                aria-label="篩選合集"
              >
                <option value="all">全部合集</option>
              </select>
            `
            : ''}

          <select
            id="ratingFilter"
            aria-label="篩選閱讀分級"
          >
            <option value="all">全部分級</option>
            <option value="general">一般</option>
            <option value="adult">18+</option>
          </select>
        </div>

        <div id="storyList" aria-live="polite"></div>
      `;

    const search = document.getElementById('storySearch');
    const cp = document.getElementById('cpFilter');
    const group = document.getElementById('groupFilter');
    const rating = document.getElementById('ratingFilter');

    const cps = [
      ...new Set(current.flatMap(ch => ch.cp || []))
    ].sort();

    cps.forEach(value => {
      const option = document.createElement('option');

      option.value = value;
      option.textContent = value;

      cp.append(option);
    });

    if (group) {
      GROUPS.forEach(g => {
        const option = document.createElement('option');

        option.value = g.id;
        option.textContent = g.title;

        group.append(option);
      });
    }

    function refresh() {
      const query = search.value.trim().toLocaleLowerCase();
      const selectedCp = cp.value;
      const selectedGroup = group ? group.value : 'all';
      const selectedRating = rating.value;

      const filtered = current.filter(ch => {
        const matchSearch =
          !query ||
          `${ch.title} ${cpLabel(ch)} ${ch.storyArc || ''}`
            .toLocaleLowerCase()
            .includes(query);

        const matchCp =
          selectedCp === 'all' ||
          (ch.cp || []).includes(selectedCp);

        const matchGroup =
          selectedGroup === 'all' ||
          ch.storyArc === selectedGroup;

        const matchRating =
          selectedRating === 'all' ||
          (selectedRating === 'adult') === isAdult(ch);

        return matchSearch &&
          matchCp &&
          matchGroup &&
          matchRating;
      });

      const target = document.getElementById('storyList');
      target.replaceChildren();

      if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';

        empty.innerHTML = current.length
          ? `
            <strong>目前沒有符合條件的文章</strong>
            請調整搜尋關鍵字或篩選條件。
          `
          : state.error
            ? `
              <strong>暫時無法載入故事</strong>
              請檢查 data/chapters.json 是否已部署。
            `
            : `
              <strong>這個系列目前尚無公開文章</strong>
              Notion 草稿不會顯示。
            `;

        target.append(empty);
        return;
      }

      const buckets =
        id === 'top_gun_random_writings'
          ? [
              ...GROUPS.map(g => ({
                id: g.id,
                title: g.title
              })),
              {
                id: '',
                title: '其他'
              }
            ].filter(g =>
              filtered.some(ch =>
                (ch.storyArc || '') === g.id
              )
            )
          : [{ id: null, title: null }];

      for (const bucket of buckets) {
        const articles =
          id === 'top_gun_random_writings'
            ? filtered.filter(ch =>
                (ch.storyArc || '') === bucket.id
              )
            : filtered;

        if (bucket.title) {
          const heading = document.createElement('h3');

          heading.className = 'group-title';
          heading.textContent =
            `${bucket.title} · ${articles.length} 篇`;

          target.append(heading);
        }

        const list = document.createElement('div');
        list.className = 'story-list';

        list.append(...articles.map(entryNode));
        target.append(list);
      }

      const summary = document.createElement('p');

      summary.className = 'archive-search-summary';
      summary.textContent =
        `顯示 ${filtered.length} / ${current.length} 篇已公開文章`;

      target.append(summary);
    }

    search.addEventListener('input', refresh);
    cp.addEventListener('change', refresh);
    rating.addEventListener('change', refresh);

    if (group) {
      group.addEventListener('change', refresh);
    }

    refresh();
  }

  function entryNode(ch) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'story-entry';

    button.setAttribute(
      'aria-label',
      `閱讀 ${ch.title}`
    );

    button.innerHTML = `
      <span class="story-no">
        ${String(ch.chapterNumber ?? '—').padStart(2, '0')}
      </span>

      <span class="story-main">
        <strong>${escapeHtml(ch.title)}</strong>
        <small>${escapeHtml(cpLabel(ch))}</small>

        <span class="story-pills">
          <span class="pill">
            ${escapeHtml(ch.chapterType || '短篇')}
          </span>

          ${isAdult(ch)
            ? '<span class="pill adult">18+</span>'
            : ''}
        </span>
      </span>

      <span class="card-arrow" aria-hidden="true">↗</span>
    `;

    button.addEventListener('click', () => openReader(ch));

    return button;
  }

  function showExternal(id) {
    const work = byId(id);

    if (!work || work.kind !== 'external') {
      return showMissing();
    }

    const external = workUrl(work);

    if (external) {
      window.location.replace(external);
      return;
    }

    pageTitle(work.title);

    els.sub.innerHTML =
      subFrame(
        work.title,
        work.title,
        work.description,
        work.image,
        'INDEPENDENT WORK'
      ) +
      `
        <div class="info-card" style="margin-top:35px">
          獨立網站網址尚未設定。
          <a class="btn-link" href="#archive">
            返回作品目錄
          </a>
        </div>
      `;
  }

  function showSearch() {
    pageTitle('搜尋文章');

    const current = state.chapters;

    els.sub.innerHTML = `
      <div class="crumbs">
        <a href="#home">首頁</a>
        <span>/</span>
        搜尋文章
      </div>

      <header class="sub-hero">
        <div>
          <p class="section-kicker">SEARCH / ARCHIVE</p>
          <h1>搜尋已公開的故事</h1>
          <p>
            依標題、系列或 CP 搜尋。
            草稿與未公開文章不會出現在結果中。
          </p>
        </div>

        <img src="./assets/card-random.webp?v=2" alt="">
      </header>

      <div class="filter-row" style="margin-top:32px">
        <input
          id="globalSearch"
          type="search"
          placeholder="輸入標題、CP 或系列名稱"
          aria-label="全站搜尋"
          style="width:min(600px,100%)"
        >
      </div>

      <div id="globalResults"></div>
    `;

    const search = document.getElementById('globalSearch');
    const results = document.getElementById('globalResults');

    function refresh() {
      const query = search.value.trim().toLocaleLowerCase();

      const filtered = current.filter(ch =>
        !query ||
        `${ch.title} ${cpLabel(ch)} ${ch.storyArc || ''} ${byId(ch.work)?.title || ''}`
          .toLocaleLowerCase()
          .includes(query)
      );

      results.replaceChildren();

      if (!filtered.length) {
        const empty = document.createElement('div');

        empty.className = 'empty-state';
        empty.textContent = '找不到符合條件的已公開文章。';

        results.append(empty);
        return;
      }

      const list = document.createElement('div');
      list.className = 'story-list';

      list.append(...filtered.map(entryNode));
      results.append(list);

      const count = document.createElement('p');
      count.className = 'archive-search-summary';
      count.textContent = `找到 ${filtered.length} 篇公開文章`;

      results.append(count);
    }

    search.addEventListener('input', refresh);

    refresh();
    search.focus();
  }

  function showMissing() {
    pageTitle('找不到頁面');

    els.sub.innerHTML = `
      <div class="info-card">
        <strong>這個航線尚未建立。</strong>

        <p>
          <a href="#archive" class="btn-link">
            ← 返回作品目錄
          </a>
        </p>
      </div>
    `;
  }

  function openReader(ch) {
    if (isAdult(ch) && !state.ageGranted) {
      state.pendingReader = ch;

      if (typeof els.age.showModal === 'function') {
        els.age.showModal();
      } else if (
        window.confirm('這篇標示為 18+，請確認已成年。')
      ) {
        grantAge();
      }

      return;
    }

    routeTo(
      `#read/${encodeURIComponent(ch.work)}/${encodeURIComponent(ch.slug)}`
    );
  }

  function grantAge() {
    state.ageGranted = true;

    try {
      sessionStorage.setItem(
        'topgun-age-agreed',
        'yes'
      );
    } catch (_) {}

    if (els.age.open) {
      els.age.close();
    }

    if (state.pendingReader) {
      const ch = state.pendingReader;
      state.pendingReader = null;

      routeTo(
        `#read/${encodeURIComponent(ch.work)}/${encodeURIComponent(ch.slug)}`
      );
    }
  }

  els.ageContinue.addEventListener('click', grantAge);

  els.ageCancel.addEventListener('click', () => {
    if (els.age.open) {
      els.age.close();
    }

    state.pendingReader = null;
  });

  els.age.addEventListener('cancel', () => {
    state.pendingReader = null;
  });

  function safeImage(raw) {
    if (typeof raw !== 'string') return null;

    if (
      /^\.\/assets\/notion\/[A-Za-z0-9_.-]+$/.test(raw)
    ) {
      return raw;
    }

    return safeHttp(raw);
  }

  function appendRuns(node, runs) {
    for (const run of runs || []) {
      const content = String(run.text || '');

      if (!content) continue;

      const elem = document.createElement('span');

      if (run.bold) elem.style.fontWeight = '700';
      if (run.italic) elem.style.fontStyle = 'italic';
      if (run.underline) elem.style.textDecoration = 'underline';

      if (run.strikethrough) {
        elem.style.textDecoration = 'line-through';
      }

      if (run.code) {
        const code = document.createElement('code');

        code.textContent = content;
        elem.append(code);
      } else {
        elem.textContent = content;
      }

      const href = safeHttp(run.href);

      if (href) {
        const a = document.createElement('a');

        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        a.append(elem);
        node.append(a);
      } else if (
        !run.code &&
        /https?:\/\/[^\s]+/.test(content)
      ) {
        const pieces = content.split(
          /(https?:\/\/[^\s]+)/g
        );

        for (const part of pieces) {
          if (
            /^https?:\/\//.test(part) &&
            safeHttp(part)
          ) {
            const a = document.createElement('a');

            a.href = part;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = part;

            node.append(a);
          } else if (part) {
            const span = elem.cloneNode(false);

            span.textContent = part;
            node.append(span);
          }
        }
      } else {
        node.append(elem);
      }
    }
  }

  function chapterHeadings(blocks) {
    const heads = [];

    function visit(items) {
      for (const block of items || []) {
        const title = (block.runs || [])
          .map(run => run.text || '')
          .join('')
          .trim();

        if (
          ['heading_2', 'heading_3'].includes(block.type) &&
          (
            /\bchapter\s*[0-9ivx]+\b/i.test(title) ||
            /^第[一二三四五六七八九十\d]+章/.test(title)
          )
        ) {
          heads.push({
            block,
            text: title
          });
        }

        if (block.children) {
          visit(block.children);
        }
      }
    }

    visit(blocks);

    return heads;
  }

  function collectYoutube(blocks) {
    const links = [];

    function visit(items) {
      for (const block of items || []) {
        for (const run of block.runs || []) {
          const text =
            (run.href || '') + ' ' + (run.text || '');

          const match = text.match(
            /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s<>"']*v=[\w-]+|youtu\.be\/[\w-]+)/i
          );

          if (match) {
            const url = safeHttp(match[0]);

            if (url) links.push(url);
          }
        }

        if (block.children) {
          visit(block.children);
        }
      }
    }

    visit(blocks);

    return [...new Set(links)];
  }

  function buildBlock(block, headingMap) {
    const type = block.type || 'paragraph';

    const tags = {
      heading_1: 'h2',
      heading_2: 'h2',
      heading_3: 'h3',
      bulleted_list_item: 'li',
      numbered_list_item: 'li',
      quote: 'blockquote',
      code: 'pre',
      callout: 'div',
      toggle: 'details',
      to_do: 'div',
      divider: 'hr',
      image: 'figure',
      table: 'table',
      table_row: 'tr'
    };

    const el = document.createElement(
      tags[type] || 'p'
    );

    if (headingMap.has(block)) {
      el.id = headingMap.get(block);
    }

    if (type === 'divider') {
      return el;
    }

    if (type === 'image') {
      const url = safeImage(block.url);

      if (!url) {
        return document.createDocumentFragment();
      }

      const img = document.createElement('img');

      img.loading = 'lazy';
      img.src = url;
      img.alt = block.caption || '文章圖片';

      el.append(img);

      if (block.caption) {
        const caption = document.createElement('figcaption');

        caption.textContent = block.caption;
        el.append(caption);
      }

      return el;
    }

    if (type === 'table_row') {
      for (const cellRuns of block.cells || []) {
        const td = document.createElement('td');

        appendRuns(td, cellRuns);
        el.append(td);
      }

      return el;
    }

    if (type === 'callout') {
      el.className = 'callout';
    }

    if (type === 'to_do') {
      el.className = 'todo';

      const input = document.createElement('input');

      input.type = 'checkbox';
      input.checked = Boolean(block.checked);
      input.disabled = true;

      el.append(input);

      const text = document.createElement('span');

      appendRuns(text, block.runs);
      el.append(text);
    } else if (type === 'toggle') {
      const summary = document.createElement('summary');

      appendRuns(summary, block.runs);
      el.append(summary);
    } else if (type === 'code') {
      const code = document.createElement('code');

      appendRuns(code, block.runs);
      el.append(code);
    } else {
      appendRuns(el, block.runs);
    }

    if (
      block.children &&
      block.children.length
    ) {
      const children = document.createElement('div');

      children.append(
        ...renderNodes(block.children, headingMap)
      );

      el.append(children);
    }

    return el;
  }

  function renderNodes(blocks, headingMap) {
    const nodes = [];

    let list = null;
    let listType = null;

    function flush() {
      if (list) {
        nodes.push(list);
        list = null;
        listType = null;
      }
    }

    for (const block of blocks || []) {
      if (
        block.type === 'bulleted_list_item' ||
        block.type === 'numbered_list_item'
      ) {
        const type = block.type === 'bulleted_list_item'
          ? 'ul'
          : 'ol';

        if (listType !== type) {
          flush();

          list = document.createElement(type);
          listType = type;
        }

        list.append(buildBlock(block, headingMap));
      } else {
        flush();

        nodes.push(buildBlock(block, headingMap));
      }
    }

    flush();

    return nodes;
  }

  function showReader(ch) {
    if (isAdult(ch) && !state.ageGranted) {
      routeTo('#series/' + ch.work);
      openReader(ch);
      return;
    }

    const work = byId(ch.work);

    if (!work) {
      return showMissing();
    }

    pageTitle(ch.title);

    els.sub.innerHTML = `
      <div class="reader-top">
        <div class="crumbs" style="margin:0">
          <a href="#archive">作品檔案</a>
          <span>/</span>
          <a href="#series/${encodeURIComponent(ch.work)}">
            ${escapeHtml(work.title)}
          </a>
          <span>/</span>
          <span>閱讀</span>
        </div>

        <div class="reader-actions">
          <a
            class="button-ghost"
            href="#series/${encodeURIComponent(ch.work)}"
          >
            ← 回到故事目錄
          </a>
        </div>
      </div>

      <article class="reader-card">
        <p class="reader-kicker">
          ${escapeHtml(work.title.toUpperCase())}
          · STORY
          ${String(ch.chapterNumber ?? '—').padStart(2, '0')}
        </p>

        <h1 id="readerTitle"></h1>
        <p class="reader-byline" id="readerByline"></p>

        <div id="readerToc"></div>

        <div
          class="reader-content"
          id="readerContent"
        ></div>

        <nav
          class="reader-footer"
          id="readerFooter"
          aria-label="上一篇與下一篇"
        ></nav>
      </article>
    `;

    document.getElementById(
      'readerTitle'
    ).textContent = ch.title;

    document.getElementById(
      'readerByline'
    ).textContent =
      `${cpLabel(ch)}　·　${ch.ageRating || '一般'}　·　${ch.chapterType || '短篇'}`;

    const blocks = Array.isArray(ch.blocks)
      ? ch.blocks
      : [];

    const headings = chapterHeadings(blocks);
    const headingMap = new Map();

    headings.forEach((heading, index) => {
      headingMap.set(
        heading.block,
        `chapter-part-${index + 1}`
      );
    });

    const toc = document.getElementById('readerToc');

    if (headings.length >= 2) {
      toc.className = 'toc';

      const title = document.createElement('div');

      title.className = 'toc-title';
      title.textContent =
        `章節導覽 / ${headings.length} CHAPTERS`;

      toc.append(title);

      headings.forEach(heading => {
        const link = document.createElement('a');

        link.href = '#' + headingMap.get(heading.block);
        link.textContent = heading.text;

        link.addEventListener('click', event => {
          event.preventDefault();

          document.getElementById(
            headingMap.get(heading.block)
          )?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        });

        toc.append(link);
      });
    }

    const music = collectYoutube(blocks);

    if (music.length) {
      const link = document.createElement('a');

      link.className = 'playlist-link';
      link.href = music[0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      link.textContent =
        '♫ 本篇推薦配樂 · YouTube ↗';

      toc.before(link);
    }

    const content = document.getElementById(
      'readerContent'
    );

    content.append(
      ...renderNodes(blocks, headingMap)
    );

    if (!blocks.length) {
      const message = document.createElement('p');

      message.textContent =
        '此篇目前沒有可顯示的正文，請確認 Notion 已同步內容。';

      content.append(message);
    }

    const same = storiesFor(ch.work);

    const currentIndex = same.findIndex(
      item => item.slug === ch.slug
    );

    const previous = same[currentIndex - 1];
    const next = same[currentIndex + 1];

    const footer = document.getElementById('readerFooter');

    function createNav(other, prefix) {
      const a = document.createElement('a');

      if (!other) {
        a.href = '#series/' + encodeURIComponent(ch.work);
        a.textContent = '返回目錄';
      } else {
        a.href =
          '#read/' +
          encodeURIComponent(other.work) +
          '/' +
          encodeURIComponent(other.slug);

        a.textContent = prefix + other.title;

        a.addEventListener('click', event => {
          if (isAdult(other) && !state.ageGranted) {
            event.preventDefault();
            openReader(other);
          }
        });
      }

      return a;
    }

    footer.append(
      createNav(previous, '← '),
      createNav(next, '→ ')
    );
  }

  function route() {
    const parts = decodeURIComponent(
      location.hash.slice(1) || 'home'
    ).split('/');

    const part = parts[0];

    const isHome =
      part === 'home' ||
      part === 'archive';

    els.home.hidden = !isHome;
    els.sub.hidden = isHome;

    els.nav.classList.remove('open');
    els.menu.setAttribute('aria-expanded', 'false');

    if (isHome) {
      pageTitle('Stories Beyond the Sky');
      updateNav(part);
      renderCards();
      scrollTop();

      if (part === 'archive') {
        setTimeout(() => {
          document.getElementById(
            'archiveSection'
          )?.scrollIntoView({
            behavior: 'instant',
            block: 'start'
          });
        }, 0);
      }

      return;
    }

    scrollTop();

    if (part === 'series') {
      showSeries(parts[1]);
      updateNav(parts[1]);
    } else if (part === 'work') {
      showExternal(parts[1]);
      updateNav('work');
    } else if (part === 'read') {
      const chapter = state.chapters.find(
        ch =>
          ch.work === parts[1] &&
          ch.slug === parts[2]
      );

      if (chapter) {
        showReader(chapter);
      } else {
        showMissing();
      }

      updateNav('read');
    } else if (part === 'search') {
      showSearch();
      updateNav('search');
    } else {
      showMissing();
      updateNav('none');
    }
  }

  els.menu.addEventListener('click', () => {
    const open = els.nav.classList.toggle('open');

    els.menu.setAttribute(
      'aria-expanded',
      String(open)
    );
  });

  document.getElementById(
    'globalSearchButton'
  ).addEventListener(
    'click',
    () => routeTo('#search')
  );

  window.addEventListener('hashchange', route);

  async function init() {
    try {
      const response = await fetch(
        './data/chapters.json',
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error(
          'HTTP ' + response.status
        );
      }

      const json = await response.json();

      const rows = Array.isArray(json)
        ? json
        : Array.isArray(json.chapters)
          ? json.chapters
          : [];

      state.chapters = rows.filter(ch =>
        ch &&
        typeof ch.title === 'string' &&
        typeof ch.slug === 'string' &&
        typeof ch.work === 'string' &&
        [
          'song_maketh_wingman',
          'top_gun_random_writings'
        ].includes(ch.work)
      );

      state.ready = true;
    } catch (error) {
      console.warn(
        'Unable to load published Notion stories:',
        error
      );

      state.error = true;
    }

    renderCards();
    route();
  }

  init();
})();
