(() => {
  'use strict';
  const CONFIG = Object.freeze(window.TOP_GUN_CONFIG || {});
  const WORKS = [
    {id:'song_maketh_wingman', number:'01', title:'Song Maketh Wingman', subtitle:'歌曲短篇系列', description:'讓音樂成為領航員。在熟悉的旋律裡，看見不同的相遇與告別。', image:'./assets/card-wingman.webp', kind:'series', state:'SHORT STORIES'},
    {id:'top_gun_random_writings', number:'02', title:'隨寫系列', subtitle:'三組獨立合集', description:'不同時間裡的小片段，保留那些一閃而過的日常與心動。', image:'./assets/card-random.webp', kind:'series', state:'THREE COLLECTIONS'},
    {id:'top_gun_prompts', number:'03', title:'點文／活動系列', subtitle:'預留作品入口', description:'來自活動與讀者點文的特別航線；待內容整理完成後開放。', image:'./assets/card-prompts.webp', kind:'upcoming', state:'COMING SOON'},
    {id:'where_wake_turbulence_ends', number:'04', title:'Where Wake Turbulence Ends', subtitle:'獨立長篇', description:'一段獨立的長篇旅程，保留原有網站與章節閱讀功能。', image:'./assets/card-turbulence.webp', kind:'external', state:'EXTERNAL WEBSITE'},
    {id:'globetrotting', number:'05', title:'時空交錯的旅行', subtitle:'獨立長篇', description:'跨越距離與時空的相遇，保留自己的故事入口與閱讀脈絡。', image:'./assets/card-globetrotting.webp', kind:'external-pending', state:'INDEPENDENT WORK'}
  ];
  const GROUPS = [
    {id:'IceMav合集',title:'IceMav 合集',detail:'Iceman × Maverick'},
    {id:'RooHang合集',title:'RooHang 合集',detail:'Rooster × Hangman'},
    {id:'IceMav和RooHang合集',title:'IceMav 和 RooHang 合集',detail:'多配對短篇；以文章實際標示為準'}
  ];
  const els = {
    home:document.getElementById('homeView'), sub:document.getElementById('subView'), grid:document.getElementById('archiveGrid'),
    nav:document.getElementById('mainNav'), menu:document.getElementById('menuToggle'),
    age:document.getElementById('ageDialog'), ageCancel:document.getElementById('ageCancel'), ageContinue:document.getElementById('ageContinue')
  };
  const state={chapters:[],ready:false,error:false,ageGranted:false,pendingReader:null};
  try {state.ageGranted=sessionStorage.getItem('topgun-age-agreed')==='yes';}catch(_){/* Private mode may block sessionStorage */}
  const byId=id=>WORKS.find(w=>w.id===id);
  const cpLabel=ch=>(Array.isArray(ch.cp)?ch.cp:[]).join('、') || '未標示 CP';
  const isAdult=ch=>/18\+|r18|成人|限制|explicit/i.test(ch.ageRating||'');
  const escapeHtml=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeHttp=url=>{try{const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch(_){return null;}};
  const workUrl=work=>work.id==='where_wake_turbulence_ends'?safeHttp(CONFIG.turbulenceUrl):work.id==='globetrotting'?safeHttp(CONFIG.globetrottingUrl):null;
  const storiesFor=id=>state.chapters.filter(ch=>ch.work===id).sort((a,b)=>(a.chapterNumber??999999)-(b.chapterNumber??999999)||a.title.localeCompare(b.title));
  const pageTitle=value=>{document.title=value+' | TOP GUN · SAKURAI_TK';};
  function routeTo(hash){if(location.hash===hash){route();}else{location.hash=hash;}}
  function scrollTop(){window.scrollTo({top:0,behavior:'instant'});}
  function updateNav(view){els.nav.querySelectorAll('a').forEach(a=>a.classList.toggle('active',view==='home'?a.dataset.nav==='home':view==='archive'?a.dataset.nav==='archive':view==='song_maketh_wingman'?a.dataset.nav==='wingman':view==='top_gun_random_writings'?a.dataset.nav==='random':view==='about'?a.dataset.nav==='about':false));}
  function renderCards(){
    els.grid.replaceChildren(...WORKS.map(work=>{
      const n=work.kind==='series'?storiesFor(work.id).length:null;
      const a=document.createElement('a');a.className='archive-card';a.href=work.kind==='series'||work.kind==='upcoming'?'#series/'+work.id:'#work/'+work.id;
      const badge=n==null?work.state:(n?`${n} 篇已公開`:'等待公開');
      a.innerHTML=`<div class="card-media"><img src="${work.image}" loading="lazy" alt=""/><span class="card-num">${work.number}</span></div><div class="card-body"><h3 class="card-title">${escapeHtml(work.title)}</h3><div class="card-line"></div><p class="card-copy">${escapeHtml(work.description)}</p><div class="card-meta"><span class="card-chip">${escapeHtml(work.subtitle)}</span>${work.kind==='external'?'<span class="card-chip special">既有網站</span>':''}</div><div class="card-foot"><span>${escapeHtml(badge)}</span><strong>↗</strong></div></div>`;
      return a;
    }));
  }
  function subFrame(crumb,title,text,image,kicker='FLIGHT ARCHIVE'){
    return `<div class="crumbs"><a href="#home">首頁</a><span>/</span><a href="#archive">作品檔案</a><span>/</span><span>${escapeHtml(crumb)}</span></div><header class="sub-hero"><div><p class="section-kicker"><span class="gold-square"></span> ${escapeHtml(kicker)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p></div><img src="${image}" alt=""/></header>`;
  }
  function showSeries(id){
    const work=byId(id); if(!work)return showMissing();
    pageTitle(work.title);
    const current=storiesFor(id);
    if(work.kind==='upcoming'){
      els.sub.innerHTML=subFrame(work.title,work.title,work.description,work.image,'SPECIAL FLIGHTS')+`<div class="info-card" style="margin-top:35px"><strong>這個系列目前保留入口，尚未正式開放。</strong><br>待你完成 Notion 章節整理、將文章設定為「已發布」並勾選「網站公開」後，才能由同步程式顯示故事內容。<br><a class="btn-link" href="#archive" style="display:inline-block;margin-top:17px">← 返回作品目錄</a></div>`;
      return;
    }
    els.sub.innerHTML=subFrame(work.title,work.title,work.description,work.image,'SERIES FILE / '+work.number)
      +(id==='top_gun_random_writings'?`<div class="series-categories">${GROUPS.map(group=>`<div><strong>${escapeHtml(group.title)}</strong><span>${escapeHtml(group.detail)}</span></div>`).join('')}</div>`:'')
      +`<div class="list-header"><h2>公開故事目錄</h2><span class="feature-label">${current.length} PUBLIC STORIES</span></div><div class="filter-row"><input id="storySearch" type="search" placeholder="搜尋故事標題或配對" aria-label="搜尋作品"/><select id="cpFilter" aria-label="篩選配對"><option value="all">全部 CP</option></select>${id==='top_gun_random_writings'?'<select id="groupFilter" aria-label="篩選合集"><option value="all">全部合集</option></select>':''}<select id="ratingFilter" aria-label="篩選閱讀分級"><option value="all">全部分級</option><option value="general">一般</option><option value="adult">18+</option></select></div><div id="storyList" aria-live="polite"></div>`;
    const search=document.getElementById('storySearch'),cp=document.getElementById('cpFilter'),group=document.getElementById('groupFilter'),rating=document.getElementById('ratingFilter');
    const cps=[...new Set(current.flatMap(ch=>ch.cp||[]))].sort();
    cps.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;cp.append(o)});
    if(group){GROUPS.forEach(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=g.title;group.append(o)});}
    function refresh(){
      const q=search.value.trim().toLocaleLowerCase(),cat=cp.value,g=group?group.value:'all',r=rating.value;
      const filtered=current.filter(ch=>(!q||(`${ch.title} ${cpLabel(ch)} ${ch.storyArc||''}`.toLocaleLowerCase().includes(q)))&&(cat==='all'||(ch.cp||[]).includes(cat))&&(g==='all'||ch.storyArc===g)&&(r==='all'||(r==='adult')===isAdult(ch)));
      const target=document.getElementById('storyList');target.replaceChildren();
      if(!filtered.length){const empty=document.createElement('div');empty.className='empty-state';empty.innerHTML=current.length?'<strong>目前沒有符合條件的文章</strong>請調整搜尋關鍵字或篩選條件。':state.error?'<strong>暫時無法載入故事</strong>請檢查 data/chapters.json 是否已部署。':'<strong>這個系列目前尚無公開文章</strong>Notion 草稿不會顯示。文章設為「已發布」並勾選「網站公開」，同步成功後就會出現在這裡。';target.append(empty);return;}
      const groupsToShow=id==='top_gun_random_writings'?
        [...GROUPS.map(x=>({id:x.id,title:x.title})),{id:'',title:'其他'}].filter(x=>filtered.some(ch=>(ch.storyArc||'')===x.id)):
        [{id:null,title:null}];
      for(const bucket of groupsToShow){const arr=id==='top_gun_random_writings'?filtered.filter(ch=>(ch.storyArc||'')===bucket.id):filtered;
        if(bucket.title){const h=document.createElement('h3');h.className='group-title';h.textContent=bucket.title+` · ${arr.length} 篇`;target.append(h)}
        const list=document.createElement('div');list.className='story-list';list.append(...arr.map(ch=>entryNode(ch)));target.append(list);
      }
      const summary=document.createElement('p');summary.className='archive-search-summary';summary.textContent=`顯示 ${filtered.length} / ${current.length} 篇已公開文章`;target.append(summary);
    }
    [search,cp,rating,...(group?[group]:[])].forEach(x=>x.addEventListener(x===search?'input':'change',refresh));refresh();
  }
  function entryNode(ch){
    const b=document.createElement('button');b.type='button';b.className='story-entry';b.setAttribute('aria-label',`閱讀 ${ch.title}`);
    const subtitle=cpLabel(ch);b.innerHTML=`<span class="story-no">${String(ch.chapterNumber??'—').padStart(2,'0')}</span><span class="story-main"><strong>${escapeHtml(ch.title)}</strong><small>${escapeHtml(subtitle)}</small><span class="story-pills"><span class="pill">${escapeHtml(ch.chapterType||'短篇')}</span>${isAdult(ch)?'<span class="pill adult">18+</span>':''}</span></span><span class="card-arrow" aria-hidden="true">↗</span>`;
    b.addEventListener('click',()=>openReader(ch));return b;
  }
  function showExternal(id){
    const work=byId(id);if(!work)return showMissing();pageTitle(work.title);
    const external=workUrl(work);
    els.sub.innerHTML=subFrame(work.title,work.title,work.description,work.image,'INDEPENDENT WORK / '+work.number)
      +`<div class="info-card" style="margin-top:35px"><strong>這是獨立長篇作品。</strong><br>總入口僅展示作品資料並連結原有網站，不搬移或覆蓋既有章節。${external?'':'<br>目前尚未確認這部作品的公開網站網址，因此先保留專屬入口。'}<div class="archive-actions" style="margin-top:20px">${external?`<a class="button-primary" href="${escapeHtml(external)}" target="_blank" rel="noopener noreferrer">前往獨立網站 ↗</a>`:'<span class="pill">網站連結待設定</span>'}<a class="button-ghost" href="#archive">返回所有作品</a></div></div>`;
  }
  function showSearch(){
    pageTitle('搜尋文章');const current=state.chapters;
    els.sub.innerHTML=`<div class="crumbs"><a href="#home">首頁</a><span>/</span>搜尋文章</div><header class="sub-hero"><div><p class="section-kicker">SEARCH / ARCHIVE</p><h1>搜尋已公開的故事</h1><p>依標題、系列或 CP 搜尋。草稿與未公開文章不會出現在結果中。</p></div><img src="./assets/card-prompts.webp" alt=""/></header><div class="filter-row" style="margin-top:32px"><input id="globalSearch" type="search" placeholder="輸入標題、CP 或系列名稱" aria-label="全站搜尋" autofocus style="width:min(600px,100%)"/></div><div id="globalResults"></div>`;
    const search=document.getElementById('globalSearch');
    const results=document.getElementById('globalResults');
    function go(){const q=search.value.trim().toLocaleLowerCase();results.replaceChildren();const filtered=current.filter(ch=>!q||`${ch.title} ${cpLabel(ch)} ${ch.storyArc||''} ${byId(ch.work)?.title||''}`.toLocaleLowerCase().includes(q));if(!filtered.length){const el=document.createElement('div');el.className='empty-state';el.textContent='找不到符合條件的已公開文章。';results.append(el);return;}const list=document.createElement('div');list.className='story-list';list.append(...filtered.map(entryNode));results.append(list);const count=document.createElement('p');count.className='archive-search-summary';count.textContent=`找到 ${filtered.length} 篇公開文章`;results.append(count)}search.addEventListener('input',go);go();search.focus();
  }
  function showAbout(){
    pageTitle('關於本站');els.sub.innerHTML=`<div class="crumbs"><a href="#home">首頁</a><span>/</span>關於本站</div><header class="sub-hero"><div><p class="section-kicker">ABOUT / SAKURAI_TK</p><h1>那些在天空之外的故事。</h1><p>這裡收藏以 Top Gun 為靈感延伸的文字創作：短篇、系列、獨立長篇，以及尚未結束的想像。</p></div><img src="./assets/card-wingman.webp" alt=""/></header><div class="info-card" style="margin-top:33px"><strong>非官方同人創作檔案館</strong><br>本站與《Top Gun》製作方、發行方或任何權利人沒有官方關係；角色與原著相關權利歸原權利人所有。<br><br><strong>閱讀與公開規則</strong><br>Notion 文章需同時符合「發布狀態＝已發布」以及「網站公開＝勾選」才會輸出到本站。18+ 顯示分級確認視窗，但不構成真正的身分驗證或存取限制。<br><br><strong>音樂</strong><br>有指定 YouTube 配樂的文章，網站只提供外連入口，不會自行上傳或擷取歌曲音訊。</div>`;
  }
  function showMissing(){pageTitle('找不到頁面');els.sub.innerHTML='<div class="info-card"><strong>這個航線尚未建立。</strong><br><a href="#archive" class="btn-link" style="display:inline-block;margin-top:20px">← 返回作品目錄</a></div>';}
  function openReader(ch){if(isAdult(ch)&&!state.ageGranted){state.pendingReader=ch;if(typeof els.age.showModal==='function'){els.age.showModal();}else if(window.confirm('這篇標示為 18+，請確認已成年。')){grantAge();}return;}routeTo(`#read/${encodeURIComponent(ch.work)}/${encodeURIComponent(ch.slug)}`);}
  function grantAge(){state.ageGranted=true;try{sessionStorage.setItem('topgun-age-agreed','yes')}catch(_){/* ignore */}if(els.age.open)els.age.close();if(state.pendingReader){const ch=state.pendingReader;state.pendingReader=null;routeTo(`#read/${encodeURIComponent(ch.work)}/${encodeURIComponent(ch.slug)}`);}}
  els.ageContinue.addEventListener('click',grantAge);
  els.ageCancel.addEventListener('click',()=>{els.age.close();state.pendingReader=null;});
  els.age.addEventListener('cancel',()=>state.pendingReader=null);
  function safeImage(raw){if(typeof raw!=='string')return null;if(/^\.\/assets\/notion\/[A-Za-z0-9_.-]+$/.test(raw))return raw;return safeHttp(raw);}
  function appendRuns(node,runs){for(const run of runs||[]){const content=String(run.text||'');if(!content)continue;let elem=document.createElement('span');if(run.bold)elem.style.fontWeight='700';if(run.italic)elem.style.fontStyle='italic';if(run.underline)elem.style.textDecoration='underline';if(run.strikethrough)elem.style.textDecoration='line-through';if(run.code){const code=document.createElement('code');code.textContent=content;elem.append(code)}else elem.textContent=content;const href=safeHttp(run.href);if(href){const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.append(elem);node.append(a);}else if(!run.code && /(https?:\/\/[^\s]+)/.test(content)){const pieces=content.split(/(https?:\/\/[^\s]+)/g);for(const part of pieces){if(/^https?:\/\//.test(part)&&safeHttp(part)){const a=document.createElement('a');a.href=part;a.target='_blank';a.rel='noopener noreferrer';a.textContent=part;node.append(a);}else if(part){const s=elem.cloneNode(false);s.textContent=part;node.append(s);}}}else node.append(elem);}}
  function chapterHeadings(blocks){const heads=[];function visit(items){for(const block of items||[]){const text=(block.runs||[]).map(r=>r.text||'').join('').trim();if(['heading_2','heading_3'].includes(block.type)&&(/\bchapter\s*[0-9ivx]+\b/i.test(text)||/^第[一二三四五六七八九十\d]+章/.test(text))){heads.push({block,text});}if(block.children)visit(block.children);}}visit(blocks);return heads;}
  function collectYoutube(blocks){const links=[];function visit(items){for(const b of items||[]){for(const run of b.runs||[]){const s=(run.href||'')+' '+(run.text||'');const found=s.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s<>"']*v=[\w-]+|youtu\.be\/[\w-]+)/i);if(found){const url=safeHttp(found[0]);if(url)links.push(url);}}if(b.children)visit(b.children);}}visit(blocks);return [...new Set(links)];}
  function buildBlock(block,indexId,headingMap){const type=block.type||'paragraph',el=document.createElement(['paragraph'].includes(type)?'p':{'heading_1':'h2','heading_2':'h2','heading_3':'h3','bulleted_list_item':'li','numbered_list_item':'li','quote':'blockquote','code':'pre','callout':'div','toggle':'details','to_do':'div','divider':'hr','image':'figure','table':'table','table_row':'tr'}[type]||'p');
    if(headingMap.has(block))el.id=headingMap.get(block);
    if(type==='divider')return el;
    if(type==='image'){const url=safeImage(block.url);if(!url)return document.createDocumentFragment();const img=document.createElement('img');img.loading='lazy';img.src=url;img.alt=block.caption||'文章圖片';el.append(img);if(block.caption){const cap=document.createElement('figcaption');cap.textContent=block.caption;el.append(cap);}return el;}
    if(type==='table_row'){for(const cellRuns of block.cells||[]){const td=document.createElement('td');appendRuns(td,cellRuns);el.append(td)}return el;}
    if(type==='callout')el.className='callout';
    if(type==='to_do'){el.className='todo';const input=document.createElement('input');input.type='checkbox';input.checked=Boolean(block.checked);input.disabled=true;el.append(input);const text=document.createElement('span');appendRuns(text,block.runs);el.append(text)}
    else if(type==='toggle'){const summary=document.createElement('summary');appendRuns(summary,block.runs);el.append(summary)}
    else if(type==='code'){const code=document.createElement('code');appendRuns(code,block.runs);el.append(code)}
    else{appendRuns(el,block.runs)}
    if(block.children&&block.children.length){const container=document.createElement('div');container.append(...renderNodes(block.children,headingMap));el.append(container)}
    return el;
  }
  function renderNodes(blocks,headingMap){const nodes=[];let list=null,listType=null;function flush(){if(list){nodes.push(list);list=null;listType=null}}for(const block of blocks||[]){if(block.type==='bulleted_list_item'||block.type==='numbered_list_item'){const t=block.type==='bulleted_list_item'?'ul':'ol';if(listType!==t){flush();list=document.createElement(t);listType=t;}list.append(buildBlock(block,null,headingMap));}else{flush();nodes.push(buildBlock(block,null,headingMap));}}flush();return nodes;}
  function showReader(ch){if(isAdult(ch)&&!state.ageGranted){const work=ch.work;routeTo('#series/'+work);openReader(ch);return;}const work=byId(ch.work);if(!work)return showMissing();pageTitle(ch.title);
    els.sub.innerHTML=`<div class="reader-top"><div class="crumbs" style="margin:0"><a href="#archive">作品檔案</a><span>/</span><a href="#series/${encodeURIComponent(ch.work)}">${escapeHtml(work.title)}</a><span>/</span><span>閱讀</span></div><div class="reader-actions"><a class="button-ghost" href="#series/${encodeURIComponent(ch.work)}">← 回到故事目錄</a></div></div><article class="reader-card"><p class="reader-kicker">${escapeHtml(work.title.toUpperCase())} · STORY ${String(ch.chapterNumber??'—').padStart(2,'0')}</p><h1 id="readerTitle"></h1><p class="reader-byline" id="readerByline"></p><div id="readerToc"></div><div class="reader-content" id="readerContent"></div><nav class="reader-footer" id="readerFooter" aria-label="上一篇與下一篇"></nav></article>`;
    document.getElementById('readerTitle').textContent=ch.title;
    document.getElementById('readerByline').textContent=`${cpLabel(ch)}　·　${ch.ageRating||'一般'}　·　${ch.chapterType||'短篇'}`;
    const blocks=Array.isArray(ch.blocks)?ch.blocks:[],headings=chapterHeadings(blocks),headingMap=new Map();headings.forEach((h,i)=>headingMap.set(h.block,`chapter-part-${i+1}`));
    const toc=document.getElementById('readerToc');if(headings.length>=2){toc.className='toc';const t=document.createElement('div');t.className='toc-title';t.textContent=`章節導覽 / ${headings.length} CHAPTERS`;toc.append(t);headings.forEach((h,i)=>{const a=document.createElement('a');a.href=`#${headingMap.get(h.block)}`;a.textContent=h.text;a.addEventListener('click',e=>{e.preventDefault();document.getElementById(headingMap.get(h.block))?.scrollIntoView({behavior:'smooth',block:'start'});});toc.append(a)})}
    const music=collectYoutube(blocks);if(music.length){const a=document.createElement('a');a.className='playlist-link';a.href=music[0];a.target='_blank';a.rel='noopener noreferrer';a.textContent='♫ 本篇推薦配樂 · YouTube ↗';toc.before(a)}
    const content=document.getElementById('readerContent');content.append(...renderNodes(blocks,headingMap));if(!blocks.length){const p=document.createElement('p');p.textContent='此篇目前沒有可顯示的正文，請確認 Notion 已同步內容。';content.append(p)}
    const same=storiesFor(ch.work),currentIndex=same.findIndex(x=>x.slug===ch.slug),prev=same[currentIndex-1],next=same[currentIndex+1],footer=document.getElementById('readerFooter');
    const createNav=(other,title)=>{const a=document.createElement('a');if(!other){a.href='#series/'+encodeURIComponent(ch.work);a.textContent=title||'返回目錄';}else{a.href='#read/'+encodeURIComponent(other.work)+'/'+encodeURIComponent(other.slug);a.textContent=(title||'')+other.title;a.addEventListener('click',event=>{if(isAdult(other)&&!state.ageGranted){event.preventDefault();openReader(other);}});}return a;};footer.append(createNav(prev,prev?'← ':'← 返回目錄'),createNav(next,next?' → ':'返回目錄 →'));
  }
  function route(){const parts=decodeURIComponent(location.hash.slice(1)||'home').split('/');const part=parts[0];els.home.hidden=part!=='home'&&part!=='archive';els.sub.hidden=!els.home.hidden;els.nav.classList.remove('open');els.menu.setAttribute('aria-expanded','false');
    if(part==='home'||part==='archive'){els.home.hidden=false;els.sub.hidden=true;pageTitle('Stories Beyond the Sky');updateNav(part);renderCards();scrollTop();if(part==='archive')setTimeout(()=>document.getElementById('archiveSection')?.scrollIntoView({behavior:'instant',block:'start'}),0);return;}
    scrollTop();if(part==='series'){showSeries(parts[1]);updateNav(parts[1]);}else if(part==='work'){showExternal(parts[1]);updateNav('work')}else if(part==='read'){const ch=state.chapters.find(ch=>ch.work===parts[1]&&ch.slug===parts[2]);if(ch)showReader(ch);else showMissing();updateNav('read')}else if(part==='about'){showAbout();updateNav('about')}else if(part==='search'){showSearch();updateNav('search')}else{showMissing();updateNav('none')}
  }
  els.menu.addEventListener('click',()=>{const open=els.nav.classList.toggle('open');els.menu.setAttribute('aria-expanded',String(open));});
  document.getElementById('globalSearchButton').addEventListener('click',()=>routeTo('#search'));
  window.addEventListener('hashchange',route);
  async function init(){try{const resp=await fetch('./data/chapters.json',{cache:'no-store'});if(!resp.ok)throw new Error('HTTP '+resp.status);const json=await resp.json();const arr=Array.isArray(json)?json:(Array.isArray(json.chapters)?json.chapters:[]);
      state.chapters=arr.filter(ch=>ch&&typeof ch.title==='string'&&typeof ch.slug==='string'&&typeof ch.work==='string'&&['song_maketh_wingman','top_gun_random_writings','top_gun_prompts'].includes(ch.work));state.ready=true;
    }catch(error){console.warn('No published Notion data yet:',error);state.error=true;}
    renderCards();route();}
  init();
})();
