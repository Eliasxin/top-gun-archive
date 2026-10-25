
(() => {
  'use strict';

  // 公開網站設定
  // 可透過 config.js 覆寫網址。
  // 即使舊版 config.js 沒填 Globetrotting，
  // 仍會使用下方備援網址。
  const CONFIG = window.TOP_GUN_CONFIG || {};

  const EXTERNAL_URLS = {
    where_wake_turbulence_ends:
      CONFIG.turbulenceUrl ||
      'https://turbulence-eim.pages.dev/',
    globetrotting:
      CONFIG.globetrottingUrl ||
      'https://globetrotting.pages.dev/'
  };

  const WORKS = [
    {
      id: 'song_maketh_wingman',
      number: '01',
      title: 'Song Maketh Wingman',
      subtitle: '歌曲短篇系列',
      description:
        '讓音樂成為領航員。在熟悉的旋律裡，看見不同的相遇與告別。',
      image: './assets/card-wingman.webp',
      kind: 'series',
      state: 'SHORT STORIES'
    },
    {
      id: 'top_gun_random_writings',
      number: '02',
      title: '隨寫系列',
      subtitle: '三組獨立合集',
      description:
        '不同時間裡的小片段，保留那些一閃而過的日常與心動。',
      image: './assets/card-random.webp',
      kind: 'series',
      state: 'THREE COLLECTIONS'
    },
    {
      id: 'top_gun_prompts',
      number: '03',
      title: '點文／活動系列',
      subtitle: '預留作品入口',
      description:
        '來自活動與讀者點文的特別航線；待內容整理完成後開放。',
      image: './assets/card-prompts.webp',
      kind: 'upcoming',
      state: 'COMING SOON'
    },
    {
      id: 'where_wake_turbulence_ends',
      number: '04',
      title: 'Where Wake Turbulence Ends',
      subtitle: '獨立長篇',
      description:
        '有些人從相遇的那一刻起，就注定會在彼此的生命裡留下痕跡。從年少時共同仰望的天空，到長大後各自飛行的航線。關於錯過、等待，以及再次靠近。',
      image: './assets/card-turbulence.webp',
      kind: 'external',
      state: 'EXTERNAL WEBSITE'
    },
    {
      id: 'globetrotting',
      number: '05',
      title: '時空交錯的旅行',
      subtitle: '獨立長篇',
      description:
        '跨越距離與時空的相遇，保留自己的故事入口與閱讀脈絡。',
      image: './assets/card-globetrotting.webp',
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
      detail: '依各篇文章實際 CP 標籤'
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
    error: false,
    ageGranted: false,
    pendingReader: null
  };

  try {
    state.ageGranted =
      sessionStorage.getItem('topgun-age-agreed') === 'yes';
  } catch (_) {
    // 隱私模式可能停用 sessionStorage
  }

  const byId = id =>
    WORKS.find(work => work.id === id);

  const cpLabel = ch =>
    (Array.isArray(ch.cp) ? ch.cp : []).join('、') ||
    '未標示 CP';

  const isAdult = ch =>
    /18\+|r18|成人|限制|explicit/i.test(
      ch.ageRating || ''
    );

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
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const parsed = new URL(url, location.href);

      return ['https:', 'http:'].includes(
        parsed.protocol
      ) ? parsed.href : null;
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

  const pageTitle = title => {
    document.title =
      title + ' | TOP GUN · SAKURAI_TK';
  };

  const scrollTop = () =>
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });

  function routeTo(hash) {
    if (location.hash === hash) {
      route();
    } else {
      location.hash = hash;
    }
  }

  function updateNav(view) {
    const map = {
      home: 'home',
      archive: 'archive',
      song_maketh_wingman: 'wingman',
      top_gun_random_writings: 'random',
      about: 'about'
    };

    els.nav.querySelectorAll('a').forEach(a => {
      a.classList.toggle(
        'active',
        a.dataset.nav === map[view]
      );
    });
  }

  // 外部長篇直接跳轉原網站
  // 不再經過站內介紹頁
  function renderCards() {
    const cards = WORKS.map(work => {
      const published =
        work.kind === 'series'
          ? storiesFor(work.id).length
          : null;

      const external =
        work.kind === 'external'
          ? workUrl(work)
          : null;

      const a = document.createElement('a');
      a.className = 'archive-card';

      a.href =
        external || '#series/' + work.id;

      if (external) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        a.setAttribute(
          'aria-label',
          `前往 ${work.title} 獨立網站（新分頁）`
        );
      }

      const count =
        published === null
          ? work.state
          : published
            ? `${published} 篇已公開`
            : '等待公開';

      a.innerHTML = `
        <div class="card-media">
          <img
            src="${escapeHtml(work.image)}"
            loading="lazy"
            alt=""
          >
          <span class="card-num">
            ${work.number}
          </span>
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

            ${
              external
                ? '<span class="card-chip special">直接前往網站</span>'
                : ''
            }
          </div>

          <div class="card-foot">
            <span>${escapeHtml(count)}</span>
            <strong>↗</strong>
          </div>
        </div>
      `;

      return a;
    });

    els.grid.replaceChildren(...cards);
  }

  function subFrame(
    crumb,
    title,
    description,
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
          <p>${escapeHtml(description)}</p>
        </div>

        <img
          src="${escapeHtml(image)}"
          alt=""
        >
      </header>
    `;
  }

  function showSeries(id) {
    const work = byId(id);

    if (!work) {
      return showMissing();
    }

    if (work.kind === 'external') {
      return showExternal(id);
    }

    pageTitle(work.title);

    if (work.kind === 'upcoming') {
      els.sub.innerHTML =
        subFrame(
          work.title,
          work.title,
          work.description,
          work.image,
          'SPECIAL FLIGHTS'
        ) +
        `
        <div
          class="info-card"
          style="margin-top:35px"
        >
          <strong>
            這個系列目前保留入口，
            尚未正式開放。
          </strong>

          <p>
            文章整理完成、在 Notion
            設為「已發布」並勾選
            「網站公開」後，再開放閱讀。
          </p>

          <a
            class="btn-link"
            href="#archive"
          >
            ← 返回作品目錄
          </a>
        </div>
        `;

      return;
    }

    const current = storiesFor(id);

    els.sub.innerHTML =
      subFrame(
        work.title,
        work.title,
        work.description,
        work.image,
        'SERIES FILE / ' + work.number
      ) +

      (
        id === 'top_gun_random_writings'
          ? `
            <div class="series-categories">
              ${
                GROUPS.map(g => `
                  <div>
                    <strong>
                      ${escapeHtml(g.title)}
                    </strong>

                    <span>
                      ${escapeHtml(g.detail)}
                    </span>
                  </div>
                `).join('')
              }
            </div>
          `
          : ''
      ) +

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

        <select
          id="cpFilter"
          aria-label="篩選配對"
        >
          <option value="all">
            全部 CP
          </option>
        </select>

        ${
          id === 'top_gun_random_writings'
            ? `
              <select
                id="groupFilter"
                aria-label="篩選合集"
              >
                <option value="all">
                  全部合集
                </option>
              </select>
            `
            : ''
        }

        <select
          id="ratingFilter"
          aria-label="篩選閱讀分級"
        >
          <option value="all">
            全部分級
          </option>
          <option value="general">
            一般
          </option>
          <option value="adult">
            18+
          </option>
        </select>
      </div>

      <div
        id="storyList"
        aria-live="polite"
      ></div>
      `;

    const search =
      document.getElementById('storySearch');

    const cp =
      document.getElementById('cpFilter');

    const group =
      document.getElementById('groupFilter');

    const rating =
      document.getElementById('ratingFilter');

    [...new Set(
      current.flatMap(ch => ch.cp || [])
    )]
      .sort()
      .forEach(value => {
        const option =
          document.createElement('option');

        option.value = value;
        option.textContent = value;
        cp.append(option);
      });

    if (group) {
      GROUPS.forEach(g => {
        const option =
          document.createElement('option');

        option.value = g.id;
        option.textContent = g.title;
        group.append(option);
      });
    }

    function refresh() {
      const query =
        search.value
          .trim()
          .toLocaleLowerCase();

      const filtered =
        current.filter(ch =>
          (
            !query ||
            `${ch.title} ${cpLabel(ch)} ${ch.storyArc || ''}`
              .toLocaleLowerCase()
              .includes(query)
          ) &&
          (
            cp.value === 'all' ||
            (ch.cp || []).includes(cp.value)
          ) &&
          (
            !group ||
            group.value === 'all' ||
            ch.storyArc === group.value
          ) &&
          (
            rating.value === 'all' ||
            (
              rating.value === 'adult'
            ) === isAdult(ch)
          )
        );

      const target =
        document.getElementById('storyList');

      target.replaceChildren();

      if (!filtered.length) {
        const empty =
          document.createElement('div');

        empty.className = 'empty-state';

        empty.innerHTML =
          current.length
            ? `
              <strong>
                目前沒有符合條件的文章
              </strong>
              請調整搜尋或篩選條件。
            `
            : state.error
              ? `
                <strong>
                  暫時無法載入故事
                </strong>
                請確認 data/chapters.json
                是否已部署。
              `
              : `
                <strong>
                  目前尚無公開文章
                </strong>
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
          : [
              {
                id: null,
                title: null
              }
            ];

      buckets.forEach(bucket => {
        const articles =
          id === 'top_gun_random_writings'
            ? filtered.filter(ch =>
                (ch.storyArc || '') === bucket.id
              )
            : filtered;

        if (bucket.title) {
          const h =
            document.createElement('h3');

          h.className = 'group-title';

          h.textContent =
            `${bucket.title} · ${articles.length} 篇`;

          target.append(h);
        }

        const list =
          document.createElement('div');

        list.className = 'story-list';

        list.append(
          ...articles.map(entryNode)
        );

        target.append(list);
      });

      const summary =
        document.createElement('p');

      summary.className =
        'archive-search-summary';

      summary.textContent =
        `顯示 ${filtered.length} / ${current.length} 篇已公開文章`;

      target.append(summary);
    }

    search.addEventListener(
      'input',
      refresh
    );

    cp.addEventListener(
      'change',
      refresh
    );

    rating.addEventListener(
      'change',
      refresh
    );

    if (group) {
      group.addEventListener(
        'change',
        refresh
      );
    }

    refresh();
  }

  function entryNode(ch) {
    const button =
      document.createElement('button');

    button.type = 'button';
    button.className = 'story-entry';

    button.setAttribute(
      'aria-label',
      `閱讀 ${ch.title}`
    );

    button.innerHTML = `
      <span class="story-no">
        ${
          String(
            ch.chapterNumber ?? '—'
          ).padStart(2, '0')
        }
      </span>

      <span class="story-main">
        <strong>
          ${escapeHtml(ch.title)}
        </strong>

        <small>
          ${escapeHtml(cpLabel(ch))}
        </small>

        <span class="story-pills">
          <span class="pill">
            ${escapeHtml(ch.chapterType || '短篇')}
          </span>

          ${
            isAdult(ch)
              ? '<span class="pill adult">18+</span>'
              : ''
          }
        </span>
      </span>

      <span
        class="card-arrow"
        aria-hidden="true"
      >
        ↗
      </span>
    `;

    button.addEventListener(
      'click',
      () => openReader(ch)
    );

    return button;
  }

  function showExternal(id) {
    const work = byId(id);

    if (!work) {
      return showMissing();
    }

    const url = workUrl(work);

    // 相容舊版 #work/ 連結：
    // 不再顯示中間頁，直接導向原站
    if (url) {
      window.location.replace(url);
      return;
    }

    pageTitle(work.title);

    els.sub.innerHTML =
      subFrame(
        work.title,
        work.title,
        work.description,
        work.image
      ) +
      `
      <div
        class="info-card"
        style="margin-top:35px"
      >
        這部作品的網址尚未設定。
        請返回作品目錄。
      </div>
      `;
  }

  function showSearch() {
    pageTitle('搜尋文章');

    els.sub.innerHTML = `
      <div class="crumbs">
        <a href="#home">首頁</a>
        <span>/</span>
        搜尋文章
      </div>

      <header class="sub-hero">
        <div>
          <p class="section-kicker">
            SEARCH / ARCHIVE
          </p>

          <h1>
            搜尋已公開的故事
          </h1>

          <p>
            依標題、系列或 CP 搜尋，
            草稿不會出現在結果中。
          </p>
        </div>

        <img
          src="./assets/card-prompts.webp"
          alt=""
        >
      </header>

      <div
        class="filter-row"
        style="margin-top:32px"
      >
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

    const search =
      document.getElementById('globalSearch');

    const results =
      document.getElementById('globalResults');

    function searchNow() {
      const query =
        search.value
          .trim()
          .toLocaleLowerCase();

      const filtered =
        state.chapters.filter(ch =>
          !query ||
          `${
            ch.title
          } ${
            cpLabel(ch)
          } ${
            ch.storyArc || ''
          } ${
            byId(ch.work)?.title || ''
          }`
            .toLocaleLowerCase()
            .includes(query)
        );

      results.replaceChildren();

      if (!filtered.length) {
        const empty =
          document.createElement('div');

        empty.className = 'empty-state';

        empty.textContent =
          '找不到符合條件的已公開文章。';

        results.append(empty);
        return;
      }

      const list =
        document.createElement('div');

      list.className = 'story-list';

      list.append(
        ...filtered.map(entryNode)
      );

      results.append(list);

      const count =
        document.createElement('p');

      count.className =
        'archive-search-summary';

      count.textContent =
        `找到 ${filtered.length} 篇公開文章`;

      results.append(count);
    }

    search.addEventListener(
      'input',
      searchNow
    );

    searchNow();
    search.focus();
  }

  function showAbout() {
    pageTitle('關於本站');

    els.sub.innerHTML = `
      <div class="crumbs">
        <a href="#home">首頁</a>
        <span>/</span>
        關於本站
      </div>

      <header class="sub-hero">
        <div>
          <p class="section-kicker">
            ABOUT / SAKURAI_TK
          </p>

          <h1>
            那些在天空之外的故事。
          </h1>

          <p>
            這裡收藏以 Top Gun 為靈感延伸的
            短篇、系列與獨立長篇。
          </p>
        </div>

        <img
          src="./assets/card-wingman.webp"
          alt=""
        >
      </header>

      <div
        class="info-card"
        style="margin-top:33px"
      >
        <strong>
          非官方二次創作檔案館
        </strong>

        <p>
          本站與電影製作、發行及相關
          權利人沒有官方關係。
        </p>

        <strong>
          閱讀與公開規則
        </strong>

        <p>
          Notion 文章需同時符合「已發布」
          與「網站公開」才會同步。
          18+ 提醒不是實際身分驗證。
        </p>

        <strong>音樂</strong>

        <p>
          指定配樂僅提供 YouTube 連結，
          不上傳或擷取歌曲音訊。
        </p>
      </div>
    `;
  }

  function showMissing() {
    pageTitle('找不到頁面');

    els.sub.innerHTML = `
      <div class="info-card">
        <strong>
          這個航線尚未建立。
        </strong>

        <p>
          <a
            class="btn-link"
            href="#archive"
          >
            ← 返回作品目錄
          </a>
        </p>
      </div>
    `;
  }

  function openReader(ch) {
    if (
      isAdult(ch) &&
      !state.ageGranted
    ) {
      state.pendingReader = ch;

      if (
        typeof els.age.showModal === 'function'
      ) {
        els.age.showModal();
      } else if (
        window.confirm(
          '這篇標示為 18+，請確認已成年。'
        )
      ) {
        grantAge();
      }

      return;
    }

    routeTo(
      `#read/${
        encodeURIComponent(ch.work)
      }/${
        encodeURIComponent(ch.slug)
      }`
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
        `#read/${
          encodeURIComponent(ch.work)
        }/${
          encodeURIComponent(ch.slug)
        }`
      );
    }
  }

  els.ageContinue.addEventListener(
    'click',
    grantAge
  );

  els.ageCancel.addEventListener(
    'click',
    () => {
      if (els.age.open) {
        els.age.close();
      }

      state.pendingReader = null;
    }
  );

  els.age.addEventListener(
    'cancel',
    () => {
      state.pendingReader = null;
    }
  );

  function safeImage(raw) {
    if (typeof raw !== 'string') {
      return null;
    }

    if (
      /^\.\/assets\/notion\/[A-Za-z0-9_.-]+$/.test(
        raw
      )
    ) {
      return raw;
    }

    return safeHttp(raw);
  }

  function appendRuns(node, runs) {
    for (const run of runs || []) {
      const content = String(
        run.text || ''
      );

      if (!content) {
        continue;
      }

      const el =
        document.createElement('span');

      if (run.bold) {
        el.style.fontWeight = '700';
      }

      if (run.italic) {
        el.style.fontStyle = 'italic';
      }

      if (run.underline) {
        el.style.textDecoration =
          'underline';
      }

      if (run.strikethrough) {
        el.style.textDecoration =
          'line-through';
      }

      if (run.code) {
        const code =
          document.createElement('code');

        code.textContent = content;
        el.append(code);
      } else {
        el.textContent = content;
      }

      const href =
        safeHttp(run.href);

      if (href) {
        const a =
          document.createElement('a');

        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        a.append(el);
        node.append(a);

      } else if (
        !run.code &&
        /https?:\/\/[^\s]+/.test(content)
      ) {
        for (
          const part of content.split(
            /(https?:\/\/[^\s]+)/g
          )
        ) {
          if (
            /^https?:\/\//.test(part) &&
            safeHttp(part)
          ) {
            const a =
              document.createElement('a');

            a.href = part;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = part;

            node.append(a);
          } else if (part) {
            const span =
              el.cloneNode(false);

            span.textContent = part;
            node.append(span);
          }
        }
      } else {
        node.append(el);
      }
    }
  }

  function chapterHeadings(blocks) {
    const found = [];

    function visit(items) {
      for (const block of items || []) {
        const text =
          (block.runs || [])
            .map(r => r.text || '')
            .join('')
            .trim();

        if (
          [
            'heading_2',
            'heading_3'
          ].includes(block.type) &&
          (
            /\bchapter\s*[0-9ivx]+\b/i.test(
              text
            ) ||
            /^第[一二三四五六七八九十\d]+章/.test(
              text
            )
          )
        ) {
          found.push({
            block,
            text
          });
        }

        if (block.children) {
          visit(block.children);
        }
      }
    }

    visit(blocks);

    return found;
  }

  function collectYoutube(blocks) {
    const links = [];

    function visit(items) {
      for (const block of items || []) {
        for (
          const run of block.runs || []
        ) {
          const value =
            (run.href || '') +
            ' ' +
            (run.text || '');

          const match = value.match(
            /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s<>"']*v=[\w-]+|youtu\.be\/[\w-]+)/i
          );

          if (
            match &&
            safeHttp(match[0])
          ) {
            links.push(
              safeHttp(match[0])
            );
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

  function buildBlock(
    block,
    headingMap
  ) {
    const type =
      block.type || 'paragraph';

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

    const el =
      document.createElement(
        tags[type] || 'p'
      );

    if (
      headingMap.has(block)
    ) {
      el.id =
        headingMap.get(block);
    }

    if (type === 'divider') {
      return el;
    }

    if (type === 'image') {
      const url =
        safeImage(block.url);

      if (!url) {
        return document.createDocumentFragment();
      }

      const img =
        document.createElement('img');

      img.loading = 'lazy';
      img.src = url;
      img.alt =
        block.caption || '文章圖片';

      el.append(img);

      if (block.caption) {
        const caption =
          document.createElement(
            'figcaption'
          );

        caption.textContent =
          block.caption;

        el.append(caption);
      }

      return el;
    }

    if (type === 'table_row') {
      for (
        const runs of block.cells || []
      ) {
        const cell =
          document.createElement('td');

        appendRuns(cell, runs);
        el.append(cell);
      }

      return el;
    }

    if (type === 'callout') {
      el.className = 'callout';
    }

    if (type === 'to_do') {
      el.className = 'todo';

      const checkbox =
        document.createElement('input');

      checkbox.type = 'checkbox';
      checkbox.checked =
        !!block.checked;
      checkbox.disabled = true;

      el.append(checkbox);

      const label =
        document.createElement('span');

      appendRuns(
        label,
        block.runs
      );

      el.append(label);

    } else if (type === 'toggle') {
      const summary =
        document.createElement('summary');

      appendRuns(
        summary,
        block.runs
      );

      el.append(summary);

    } else if (type === 'code') {
      const code =
        document.createElement('code');

      appendRuns(
        code,
        block.runs
      );

      el.append(code);

    } else {
      appendRuns(
        el,
        block.runs
      );
    }

    if (
      block.children &&
      block.children.length
    ) {
      const children =
        document.createElement('div');

      children.append(
        ...renderNodes(
          block.children,
          headingMap
        )
      );

      el.append(children);
    }

    return el;
  }

  function renderNodes(
    blocks,
    headingMap
  ) {
    const nodes = [];

    let list = null;
    let listType = null;

    const flush = () => {
      if (list) {
        nodes.push(list);
      }

      list = null;
      listType = null;
    };

    for (
      const block of blocks || []
    ) {
      if (
        [
          'bulleted_list_item',
          'numbered_list_item'
        ].includes(block.type)
      ) {
        const tag =
          block.type === 'bulleted_list_item'
            ? 'ul'
            : 'ol';

        if (listType !== tag) {
          flush();

          list =
            document.createElement(tag);

          listType = tag;
        }

        list.append(
          buildBlock(
            block,
            headingMap
          )
        );

      } else {
        flush();

        nodes.push(
          buildBlock(
            block,
            headingMap
          )
        );
      }
    }

    flush();

    return nodes;
  }

  function showReader(ch) {
    if (
      isAdult(ch) &&
      !state.ageGranted
    ) {
      routeTo(
        '#series/' + ch.work
      );

      openReader(ch);
      return;
    }

    const work =
      byId(ch.work);

    if (!work) {
      return showMissing();
    }

    pageTitle(ch.title);

    els.sub.innerHTML = `
      <div class="reader-top">
        <div
          class="crumbs"
          style="margin:0"
        >
          <a href="#archive">
            作品檔案
          </a>

          <span>/</span>

          <a
            href="#series/${
              encodeURIComponent(ch.work)
            }"
          >
            ${escapeHtml(work.title)}
          </a>

          <span>/</span>
          <span>閱讀</span>
        </div>

        <div class="reader-actions">
          <a
            class="button-ghost"
            href="#series/${
              encodeURIComponent(ch.work)
            }"
          >
            ← 回到故事目錄
          </a>
        </div>
      </div>

      <article class="reader-card">
        <p class="reader-kicker">
          ${
            escapeHtml(
              work.title.toUpperCase()
            )
          }
          · STORY ${
            String(
              ch.chapterNumber ?? '—'
            ).padStart(2, '0')
          }
        </p>

        <h1 id="readerTitle"></h1>

        <p
          id="readerByline"
          class="reader-byline"
        ></p>

        <div id="readerToc"></div>

        <div
          id="readerContent"
          class="reader-content"
        ></div>

        <nav
          id="readerFooter"
          class="reader-footer"
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
      `${cpLabel(ch)}　·　${
        ch.ageRating || '一般'
      }　·　${
        ch.chapterType || '短篇'
      }`;

    const blocks =
      Array.isArray(ch.blocks)
        ? ch.blocks
        : [];

    const headings =
      chapterHeadings(blocks);

    const headingMap =
      new Map();

    headings.forEach(
      (h, index) =>
        headingMap.set(
          h.block,
          `chapter-part-${index + 1}`
        )
    );

    const toc =
      document.getElementById(
        'readerToc'
      );

    if (headings.length >= 2) {
      toc.className = 'toc';

      const title =
        document.createElement('div');

      title.className =
        'toc-title';

      title.textContent =
        `章節導覽 / ${
          headings.length
        } CHAPTERS`;

      toc.append(title);

      headings.forEach(h => {
        const link =
          document.createElement('a');

        link.href =
          '#' +
          headingMap.get(h.block);

        link.textContent = h.text;

        link.addEventListener(
          'click',
          event => {
            event.preventDefault();

            document.getElementById(
              headingMap.get(h.block)
            )?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        );

        toc.append(link);
      });
    }

    const music =
      collectYoutube(blocks);

    if (music.length) {
      const link =
        document.createElement('a');

      link.className =
        'playlist-link';

      link.href = music[0];
      link.target = '_blank';

      link.rel =
        'noopener noreferrer';

      link.textContent =
        '♫ 本篇推薦配樂 · YouTube ↗';

      toc.before(link);
    }

    const content =
      document.getElementById(
        'readerContent'
      );

    content.append(
      ...renderNodes(
        blocks,
        headingMap
      )
    );

    if (!blocks.length) {
      const empty =
        document.createElement('p');

      empty.textContent =
        '此篇目前沒有可顯示的正文，請確認 Notion 已同步內容。';

      content.append(empty);
    }

    const same =
      storiesFor(ch.work);

    const currentIndex =
      same.findIndex(
        item =>
          item.slug === ch.slug
      );

    const previous =
      same[currentIndex - 1];

    const next =
      same[currentIndex + 1];

    const footer =
      document.getElementById(
        'readerFooter'
      );

    function navLink(
      other,
      label
    ) {
      const link =
        document.createElement('a');

      if (!other) {
        link.href =
          '#series/' +
          encodeURIComponent(ch.work);

        link.textContent =
          '返回目錄';

      } else {
        link.href =
          '#read/' +
          encodeURIComponent(
            other.work
          ) +
          '/' +
          encodeURIComponent(
            other.slug
          );

        link.textContent =
          label + other.title;

        link.addEventListener(
          'click',
          event => {
            if (
              isAdult(other) &&
              !state.ageGranted
            ) {
              event.preventDefault();
              openReader(other);
            }
          }
        );
      }

      return link;
    }

    footer.append(
      navLink(previous, '← '),
      navLink(next, '→ ')
    );
  }

  function route() {
    const parts =
      decodeURIComponent(
        location.hash.slice(1) ||
        'home'
      ).split('/');

    const section = parts[0];

    const isHome =
      section === 'home' ||
      section === 'archive';

    els.home.hidden = !isHome;
    els.sub.hidden = isHome;

    els.nav.classList.remove(
      'open'
    );

    els.menu.setAttribute(
      'aria-expanded',
      'false'
    );

    if (isHome) {
      pageTitle(
        'Stories Beyond the Sky'
      );

      updateNav(section);
      renderCards();
      scrollTop();

      if (
        section === 'archive'
      ) {
        setTimeout(
          () =>
            document.getElementById(
              'archiveSection'
            )?.scrollIntoView({
              behavior: 'instant',
              block: 'start'
            }),
          0
        );
      }

      return;
    }

    scrollTop();

    if (section === 'series') {
      showSeries(parts[1]);
      updateNav(parts[1]);

    } else if (
      section === 'work'
    ) {
      showExternal(parts[1]);
      updateNav('work');

    } else if (
      section === 'read'
    ) {
      const ch =
        state.chapters.find(
          item =>
            item.work === parts[1] &&
            item.slug === parts[2]
        );

      if (ch) {
        showReader(ch);
      } else {
        showMissing();
      }

      updateNav('read');

    } else if (
      section === 'about'
    ) {
      showAbout();
      updateNav('about');

    } else if (
      section === 'search'
    ) {
      showSearch();
      updateNav('search');

    } else {
      showMissing();
      updateNav('none');
    }
  }

  els.menu.addEventListener(
    'click',
    () => {
      const open =
        els.nav.classList.toggle(
          'open'
        );

      els.menu.setAttribute(
        'aria-expanded',
        String(open)
      );
    }
  );

  document.getElementById(
    'globalSearchButton'
  ).addEventListener(
    'click',
    () => routeTo('#search')
  );

  window.addEventListener(
    'hashchange',
    route
  );

  async function init() {
    try {
      const response =
        await fetch(
          './data/chapters.json',
          {
            cache: 'no-store'
          }
        );

      if (!response.ok) {
        throw new Error(
          'HTTP ' + response.status
        );
      }

      const json =
        await response.json();

      const rows =
        Array.isArray(json)
          ? json
          : Array.isArray(
              json.chapters
            )
            ? json.chapters
            : [];

      state.chapters =
        rows.filter(ch =>
          ch &&
          typeof ch.title === 'string' &&
          typeof ch.slug === 'string' &&
          typeof ch.work === 'string' &&
          [
            'song_maketh_wingman',
            'top_gun_random_writings',
            'top_gun_prompts'
          ].includes(ch.work)
        );

    } catch (error) {
      console.warn(
        'No published Notion data yet:',
        error
      );

      state.error = true;
    }

    renderCards();
    route();
  }

  init();
})();
