(() => {
'use strict';
const D = window.PORTFOLIO_CONTENT;
const MEDIA = window.PORTFOLIO_MEDIA || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const safeUrl = u => { try { return ['http:', 'https:'].includes(new URL(u, location.href).protocol); } catch { return false; } };
const byId = Object.fromEntries(D.projects.map(p => [p.id, p]));
const TONES = ['blue', 'pink', 'green', 'beige'];
const categories = [...new Set(D.projects.map(p => p.category))];
const catTone = c => TONES[categories.indexOf(c) % TONES.length];
const workHref = id => `#work/${encodeURIComponent(id)}`;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}
function announce(msg) { $('#announce').textContent = msg; }
function workMeta(p) {
  if (p.sites) return `${p.category} · ${p.sites.length} 个网站`;
  if (p.workbook) return `${p.category} · Excel 策划`;
  const n = (p.images || []).length;
  if (n) return `${p.category} · ${n} 页`;
  if ((p.documents || []).length) return `${p.category} · 文档`;
  return p.category;
}

/* ---------- hero ---------- */
const STACK = [
  { l: '3%', t: '15%', w: '31%', r: '-10deg', d: .8 },
  { l: '27%', t: '3%', w: '31%', r: '-2deg', d: 1.25 },
  { l: '53%', t: '15%', w: '44%', r: '7deg', d: .95 },
  { l: '30%', t: '57%', w: '40%', r: '-5deg', d: 1.5 }
];
function renderHero() {
  const h = D.hero;
  $('#hero-school').textContent = h.school;
  $('#hero-roles').innerHTML = h.roles.map((r, i) => `<li data-tone="${TONES[i % 4]}">${esc(r)}</li>`).join('');
  $('#hero-note').innerHTML = h.note.map(n => `<span>${esc(n).replace(/(近\s?[\d.,]+\s?万\+?)/, '<b>$1</b>')}</span>`).join('');
  $('#stack').innerHTML = D.featured.map((id, i) => {
    const p = byId[id], c = p.hero, s = STACK[i];
    return `<a class="polaroid" href="${workHref(id)}" style="--l:${s.l};--t:${s.t};--w:${s.w};--r:${s.r};--d:${s.d};--z:${i + 1};--i:${i}"><img src="${esc(c.src)}" width="${c.width}" height="${c.height}" alt="${esc(p.title)}"><span>${esc(c.caption)}</span></a>`;
  }).join('');
}

/* ---------- about ---------- */
function renderAbout() {
  $('#about-portrait').src = D.portrait;
  $('#about-text').textContent = D.about;
  $('#about-edu').textContent = D.education;
  $('#about-honors').innerHTML = D.honors.map(h => `<li><svg aria-hidden="true"><use href="#star"/></svg><span>${esc(h)}</span></li>`).join('');
  $('#album-count').textContent = `· ${D.photos.length} 张`;
}

/* ---------- journey ---------- */
function renderJourney() {
  const rot = ['-1.5deg', '1deg', '-.5deg'];
  const items = D.experience.map(e => {
    const head = `<div class="trip-head"><h3>${esc(e.company)}</h3><span class="trip-role">${esc(e.role)}</span><span class="trip-kind">${esc(e.kind)}</span>${e.current ? '<span class="trip-live">进行中</span>' : ''}</div>`;
    let body;
    if (e.minor) {
      body = `<article class="trip trip--minor">${head}<p>${esc(e.summary)}</p></article>`;
    } else {
      const bullets = `<ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
      const stats = e.stats?.length ? `<div class="stamps">${e.stats.map((s, i) => `<div class="stamp-item" style="--rot:${rot[i % 3]}"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('')}</div>` : '';
      const works = e.works?.length ? `<div class="trip-works"><span>代表作品</span>${e.works.filter(id => byId[id]).map(id => `<a href="${workHref(id)}">${esc(byId[id].title)}</a>`).join('')}</div>` : '';
      const note = e.note ? `<p class="trip-note">${esc(e.note)}</p>` : '';
      body = `<article class="trip paper${e.current ? ' trip--current' : ''}">${e.current ? '<span class="tape tape--yellow" aria-hidden="true"></span>' : ''}${head}${bullets}${stats}${works}${note}</article>`;
    }
    return `<li class="stop reveal" data-line="${esc(e.line || '')}"><span class="stop-date">${esc(e.date)}</span>${body}</li>`;
  });
  items.push('<li class="stop stop--end" aria-hidden="true">To be continued…</li>');
  $('#stops').innerHTML = items.join('');
}

/* ---------- works ---------- */
let category = '全部';
function renderFeatured() {
  $('#featured').innerHTML = D.featured.map((id, i) => {
    const p = byId[id];
    return `<a class="feature reveal" href="${workHref(id)}"><span class="tape" data-tone="${TONES[(i + 1) % 4]}" aria-hidden="true"></span><div class="feature-img"><img src="${esc(p.image)}" alt="" width="640" height="420" loading="lazy"></div><div class="feature-body"><span class="chip" data-tone="${catTone(p.category)}">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><span class="more">点开看看 →</span></div></a>`;
  }).join('');
}
function renderFilters() {
  const all = ['全部', ...categories];
  $('#filters').innerHTML = all.map(c => {
    const n = c === '全部' ? D.projects.length : D.projects.filter(p => p.category === c).length;
    return `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === category}">${esc(c)}<small>${n}</small></button>`;
  }).join('');
}
function renderGrid() {
  const list = D.projects.filter(p => category === '全部' || p.category === category);
  $('#works-count').textContent = `· ${list.length}`;
  $('#work-grid').innerHTML = list.map((p, i) => `<a class="work-card" href="${workHref(p.id)}" style="--i:${i}">${D.featured.includes(p.id) ? '<span class="badge-star">主打</span>' : ''}<img src="${esc(p.image)}" alt="" width="640" height="420" loading="lazy"><h4>${esc(p.title)}</h4><p>${esc(workMeta(p))}</p></a>`).join('');
}
function setCategory(c, { updateHash = true } = {}) {
  if (c !== '全部' && !categories.includes(c)) c = '全部';
  category = c;
  renderFilters();
  renderGrid();
  if (updateHash) history.replaceState(history.state, '', c === '全部' ? '#works' : `#works/${encodeURIComponent(c)}`);
  announce(`作品已筛选：${c}`);
}

/* ---------- films ---------- */
function renderFilms() {
  $('#metrics').innerHTML = D.metrics.map(m => `<div class="metric"><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></div>`).join('') + '<p class="metrics-note">累计播放数据来自个人账号</p>';
  const groups = Object.entries(D.videoGroups);
  let html = groups.map(([key, label]) => {
    const vids = D.videos.filter(v => v.group === key && safeUrl(v.url));
    if (!vids.length) return '';
    return `<div class="video-group reveal"><h3 class="sub-title">${esc(label)}</h3><div class="video-row">${vids.map(v => `<a class="video-card" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer"><span class="video-cover">${v.cover ? `<img src="${esc(v.cover.src)}" alt="" width="${v.cover.width}" height="${v.cover.height}" loading="lazy">` : `<span class="video-fallback">${esc(v.title)}<small>${esc(key)}</small></span>`}<span class="video-play" aria-hidden="true"><svg><use href="#play"/></svg></span></span><h4>${esc(v.title)}</h4><p>在小红书观看 ↗</p></a>`).join('')}</div></div>`;
  }).join('');
  if (D.videoPlanningUrl) html += `<a class="doc-link reveal" href="${esc(D.videoPlanningUrl)}" download>中秋礼盒开箱创意 · 视频脚本（Excel） <span aria-hidden="true">↓</span></a>`;
  $('#video-groups').innerHTML = html;
}

/* ---------- skills ---------- */
function renderSkills() {
  $('#checks').innerHTML = D.skills.map(s => `<li class="check"><span class="box" aria-hidden="true"><svg><use href="#check"/></svg></span><div><h3>${esc(s.title)}</h3><p class="check-tools">${esc(s.tools)}</p><p>${esc(s.description)}</p>${s.projects.length ? `<div class="check-links">${s.projects.filter(id => byId[id]).map(id => `<a href="${workHref(id)}">${esc(byId[id].title)} →</a>`).join('')}</div>` : ''}</div></li>`).join('');
}

/* ---------- contact ---------- */
function renderContact() {
  const email = D.contact.email;
  const a = $('#email');
  a.textContent = email;
  a.href = `mailto:${email}`;
  $('#wechat').textContent = D.contact.wechat;
  $('#resume-download').href = D.resumeUrl;
  $('#year').textContent = new Date().getFullYear();
  $('#copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast('邮箱已复制');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = email;
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
      toast(ok ? '邮箱已复制' : email);
    }
  });
}

/* ---------- detail dialog ---------- */
const dialog = $('#detail');
const body = $('#detail-body');
const wait = ms => new Promise(r => setTimeout(r, ms));
let gallery = [], galleryIndex = 0, opener = null, route = null, flipToken = 0, albumScroll = 0, photoFromGrid = false, closing = false;

function infoBlocks(p) {
  const left = [];
  if (p.context) left.push(`<div class="d-block"><h3>项目说明</h3><p>${esc(p.context)}</p></div>`);
  (p.sections || []).forEach(s => left.push(`<div class="d-block"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`));
  const right = p.focus?.length ? `<div class="d-block"><h3>实践重点</h3><ul>${p.focus.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : '';
  if (!left.length && !right) return '';
  return `<div class="d-info"><div>${left.join('')}</div><div>${right}</div></div>`;
}
function docsMarkup(p) {
  const docs = (p.documents || []).filter(d => d.url);
  if (!docs.length) return '';
  return `<div class="d-docs">${docs.map(d => `<a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function sitesMarkup(p) {
  return `<div class="sites">${p.sites.filter(s => safeUrl(s.url)).map(s => `<a class="site-card" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(s.image)}" alt="" width="960" height="480" loading="lazy"><h3>${esc(s.title)}</h3><p>${esc(s.role)}</p><span class="more">打开网站 ↗</span></a>`).join('')}</div>`;
}
function workbookMarkup(sheets) {
  const tabs = `<div class="sheet-tabs" role="tablist" aria-label="Excel 工作表">${sheets.map((s, i) => `<button type="button" role="tab" id="sheet-tab-${i}" aria-controls="sheet-${i}" aria-selected="${i === 0}" data-sheet="${i}">${esc(s.name)}</button>`).join('')}</div>`;
  const panels = sheets.map((s, i) => `<section class="sheet-panel" id="sheet-${i}" role="tabpanel" aria-labelledby="sheet-tab-${i}" ${i ? 'hidden' : ''}><h3>${esc(s.name)}</h3>${s.blocks.map(b => b.type === 'table'
    ? `<h4>${esc(b.title)}</h4><div class="sheet-scroll" tabindex="0" role="region" aria-label="${esc(b.title)}"><table><thead><tr>${b.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : `<section class="sheet-copy"><h4>${esc(b.title)}</h4><p>${esc(b.text)}</p></section>`).join('')}</section>`).join('');
  return tabs + panels;
}
function galleryMarkup(images, label = '作品图片') {
  const many = images.length > 1;
  return `<section class="viewer" aria-label="${esc(label)}">
    <div class="viewer-bar">
      ${many ? '<button type="button" data-step="-1" aria-label="上一页">←</button>' : ''}
      <span class="viewer-count" id="viewer-count"></span>
      ${many ? '<button type="button" data-step="1" aria-label="下一页">→</button>' : ''}
      <a class="viewer-orig" id="viewer-orig" target="_blank" rel="noopener noreferrer">查看原图 ↗</a>
      <p class="viewer-cap" id="viewer-cap" aria-live="polite"></p>
    </div>
    ${many ? `<div class="thumbs" id="thumbs">${images.map((im, i) => `<button type="button" data-goto="${i}" aria-label="第 ${i + 1} 页：${esc(im.caption)}"><img src="${esc(im.thumb || im.src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    <div class="viewer-stage" id="viewer-stage">
      ${many ? '<button type="button" class="stage-nav stage-nav--prev" data-step="-1" aria-label="上一页"><span aria-hidden="true">‹</span></button><button type="button" class="stage-nav stage-nav--next" data-step="1" aria-label="下一页"><span aria-hidden="true">›</span></button>' : ''}
      <div class="viewer-page" id="viewer-page"></div>
    </div>
    ${many ? '<p class="viewer-tip">可以用键盘 ← →、左右滑动，或点图片两侧的箭头翻页</p>' : ''}
  </section>`;
}
function imageMarkup(im) {
  const m = MEDIA[im.src];
  if (m?.tiles) return `<div class="tiles">${m.tiles.map((t, i) => `<img src="${esc(t.src)}" width="${t.width}" height="${t.height}" alt="${i ? '' : esc(im.caption)}" decoding="async" ${i > 1 ? 'loading="lazy"' : ''}>`).join('')}</div>`;
  const src = m?.display || im.src;
  return `<img src="${esc(src)}" ${im.width ? `width="${m?.width || im.width}" height="${m?.height || im.height}"` : ''} alt="${esc(im.caption)}" decoding="async">`;
}

/* gallery: preload neighbours so a page turn never waits on the network */
const firstSrc = im => { const m = MEDIA[im.src]; return m?.tiles ? m.tiles[0].src : (m?.display || im.src); };
const decoded = new Map();
function preload(im) {
  if (!im) return Promise.resolve();
  const src = firstSrc(im);
  if (!decoded.has(src)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    decoded.set(src, (img.decode ? img.decode() : new Promise(r => { img.onload = img.onerror = r; })).catch(() => {}));
  }
  return decoded.get(src);
}
function updateControls() {
  const im = gallery[galleryIndex];
  $('#viewer-count').textContent = `${galleryIndex + 1} / ${gallery.length}`;
  $('#viewer-cap').textContent = im.caption || '';
  $('#viewer-orig').href = im.src;
  $$('[data-step]', body).forEach(b => { b.disabled = (+b.dataset.step < 0 && galleryIndex === 0) || (+b.dataset.step > 0 && galleryIndex === gallery.length - 1); });
  const strip = $('#thumbs', body);
  if (!strip) return;
  [...strip.children].forEach((b, i) => { if (i === galleryIndex) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  // Scroll the strip sideways only; scrollIntoView would also scroll the dialog.
  const btn = strip.children[galleryIndex];
  strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
}
function paintImage() {
  const im = gallery[galleryIndex];
  $('#viewer-page').innerHTML = imageMarkup(im);
  $('#viewer-stage').classList.toggle('is-tiled', !!MEDIA[im.src]?.tiles);
}
// Keep the picture where the reader is looking: only when its top has slid under the
// sticky bar (or, for thumbnail jumps, is out of sight below) line it up under the bar.
function keepStageInView(reveal) {
  const bar = $('.viewer-bar', body), stage = $('#viewer-stage', body);
  if (!bar || !stage) return;
  const barBottom = bar.getBoundingClientRect().bottom;
  const top = stage.getBoundingClientRect().top;
  if (top < barBottom || (reveal && top > body.getBoundingClientRect().bottom - 160)) body.scrollTop += top - barBottom - 10;
}
async function showImage(n, dir = 0, { reveal = false } = {}) {
  if (!gallery.length) return;
  galleryIndex = Math.max(0, Math.min(gallery.length - 1, n));
  const token = ++flipToken;
  updateControls();
  if (route?.type === 'album' && route.photo !== null) {
    route.photo = galleryIndex;
    history.replaceState(history.state, '', `#album/${galleryIndex + 1}`);
  }
  const page = $('#viewer-page');
  const ready = Promise.race([preload(gallery[galleryIndex]), wait(1500)]);
  if (dir && !reduced()) {
    const side = dir > 0 ? 'next' : 'prev';
    page.className = `viewer-page out-${side}`;
    await Promise.all([wait(180), ready]);
    if (token !== flipToken) return;
    paintImage();
    keepStageInView(reveal);
    page.className = `viewer-page in-${side}`;
  } else {
    if (dir || reveal) await ready;
    if (token !== flipToken) return;
    paintImage();
    if (dir || reveal) keepStageInView(reveal);
  }
  [1, 2, -1].forEach(o => preload(gallery[galleryIndex + o]));
}
function step(delta) {
  const n = galleryIndex + delta;
  if (n < 0 || n >= gallery.length) return;
  showImage(n, delta);
}

function openDialog(crumb, html, { images = [], start = 0, scroll = 0, label } = {}) {
  if (!dialog.open) opener = document.activeElement;
  $('#detail-crumb').textContent = crumb;
  body.innerHTML = html;
  gallery = images;
  galleryIndex = 0;
  flipToken++;
  dialog.setAttribute('aria-label', label || crumb);
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add('modal-open');
  body.scrollTop = scroll;
  if (gallery.length) showImage(start);
  body.focus({ preventScroll: true });
}
function workPager(id) {
  const list = D.projects, i = list.findIndex(p => p.id === id);
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  return `<nav class="d-pager" aria-label="切换作品"><a href="${workHref(prev.id)}"><small>← 上一个作品</small><span>${esc(prev.title)}</span></a><a href="${workHref(next.id)}"><small>下一个作品 →</small><span>${esc(next.title)}</span></a></nav>`;
}
function renderWork(id) {
  const p = byId[id];
  let extra = '';
  if (p.workbook) extra = workbookMarkup(p.workbook);
  else if (p.sites) extra = sitesMarkup(p);
  else if (p.images?.length) extra = galleryMarkup(p.images);
  const jump = p.workbook || p.sites || !p.images?.length ? '' : `<button type="button" class="d-jump" data-jump>↓ 直接看作品图片（${p.images.length} 页）</button>`;
  const html = `<header class="d-head"><span class="chip" data-tone="${catTone(p.category)}">${esc(p.category)}</span><h2 id="detail-title">${esc(p.title)}</h2>${p.summary ? `<p class="d-summary">${esc(p.summary)}</p>` : ''}${jump}</header>${infoBlocks(p)}${docsMarkup(p)}${p.note ? `<p class="d-note">${esc(p.note)}</p>` : ''}${extra}${workPager(id)}`;
  openDialog(`作品 · ${p.category}`, html, { images: p.workbook || p.sites ? [] : (p.images || []), label: p.title });
}
function renderResume() {
  const im = D.resumeImages[0];
  openDialog('简历', `<header class="d-head"><h2>何静瑶 · 个人简历</h2><p class="d-summary">教育背景、实习经历与技能。</p></header><div class="d-docs"><a href="${esc(D.resumeUrl)}" download="何静瑶-简历.pdf">下载 PDF <span aria-hidden="true">↓</span></a><a href="${esc(D.resumeUrl)}" target="_blank" rel="noopener noreferrer">在新页面打开 <span aria-hidden="true">↗</span></a></div><div class="resume-view"><img src="${esc(im.src)}" width="${im.width}" height="${im.height}" alt="何静瑶的个人简历"></div>`, { label: '何静瑶的个人简历' });
}
function renderAlbum(scroll = 0) {
  openDialog('生活里的 Katie', `<header class="album-intro"><span class="chip" data-tone="pink">A little more about me</span><h2>生活里的 Katie</h2><p>把喜欢的瞬间，慢慢收进这一页。点照片可以放大看。</p></header><div class="album">${D.photos.map((im, i) => `<figure><button type="button" class="album-photo" data-photo="${i}" aria-label="放大第 ${i + 1} 张照片"><img src="${esc(MEDIA[im.src]?.display || im.src)}" alt="Katie 的生活照片 ${i + 1}" ${im.width ? `width="${im.width}" height="${im.height}"` : ''} loading="lazy" decoding="async"></button><figcaption><span>Moment ${String(i + 1).padStart(2, '0')}</span><span aria-hidden="true">${i % 3 ? '✧' : '♡'}</span></figcaption></figure>`).join('')}</div>`, { scroll, label: '生活里的 Katie 相册' });
}
function renderPhoto(n) {
  openDialog('生活里的 Katie', `<button type="button" class="back-link" data-album-back>← 返回相册</button>${galleryMarkup(D.photos, 'Katie 的生活照片')}`, { images: D.photos, start: n, label: 'Katie 的生活照片' });
}

/* ---------- routes: #work/<id> · #resume · #album · #album/<n> ---------- */
function parseRoute(h = location.hash) {
  let m = h.match(/^#work\/(.+)$/);
  if (m) { const id = decodeURIComponent(m[1]); return byId[id] ? { type: 'work', id } : null; }
  m = h.match(/^#album(?:\/(\d+))?$/);
  if (m) { const n = m[1] ? +m[1] - 1 : null; return { type: 'album', photo: n !== null && n >= 0 && n < D.photos.length ? n : null }; }
  return h === '#resume' ? { type: 'resume' } : null;
}
const depth = () => history.state?.kd || 0;
const restingUrl = r => (r?.type === 'work' ? '#works' : location.pathname + location.search);
function render(r) {
  const prev = route;
  route = { ...r };
  if (r.type === 'work') renderWork(r.id);
  else if (r.type === 'resume') renderResume();
  else if (r.photo !== null) {
    photoFromGrid = prev?.type === 'album' && prev.photo === null;
    if (photoFromGrid) albumScroll = body.scrollTop;
    renderPhoto(r.photo);
  } else renderAlbum(prev?.type === 'album' && prev.photo !== null ? albumScroll : 0);
}
function go(hash, { replace = false } = {}) {
  const r = parseRoute(hash);
  if (!r) return;
  if (dialog.open && replace) history.replaceState({ kd: depth() }, '', hash);
  else history.pushState({ kd: depth() + 1 }, '', hash);
  render(r);
}
function closeDialog() {
  if (!dialog.open) return;
  dialog.close();
  document.documentElement.classList.remove('modal-open');
  gallery = [];
  route = null;
  flipToken++;
  opener?.focus?.({ preventScroll: true });
}
// Closing walks back through every entry the dialog added, so the phone's back
// button and the close button agree and the visitor never leaves the site.
function requestClose() {
  const d = depth();
  if (d > 0) { closing = true; history.go(-d); return; }
  if (parseRoute()) history.replaceState(null, '', restingUrl(route));
  closeDialog();
}
addEventListener('popstate', () => {
  const r = parseRoute();
  if (closing) {
    closing = false;
    if (r) history.replaceState(null, '', restingUrl(r));
    closeDialog();
    return;
  }
  if (r) render(r);
  else closeDialog();
});

$('#detail-close').addEventListener('click', requestClose);
dialog.addEventListener('cancel', e => { e.preventDefault(); requestClose(); });
dialog.addEventListener('click', e => {
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) requestClose();
});
body.addEventListener('click', e => {
  if (e.target.closest('[data-jump]')) {
    const viewer = $('.viewer', body);
    if (viewer) body.scrollTo({ top: body.scrollTop + viewer.getBoundingClientRect().top - body.getBoundingClientRect().top - 12, behavior: reduced() ? 'auto' : 'smooth' });
  }
  const s = e.target.closest('[data-step]');
  if (s) step(+s.dataset.step);
  const g = e.target.closest('[data-goto]');
  if (g) showImage(+g.dataset.goto, +g.dataset.goto - galleryIndex, { reveal: true });
  const tab = e.target.closest('[data-sheet]');
  if (tab) {
    $$('[data-sheet]', body).forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    $$('.sheet-panel', body).forEach((p, i) => { p.hidden = i !== +tab.dataset.sheet; });
  }
});
dialog.addEventListener('keydown', e => {
  if (!gallery.length || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
});
let touch = null;
body.addEventListener('touchstart', e => {
  if (!e.target.closest('#viewer-stage')) return;
  touch = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
}, { passive: true });
body.addEventListener('touchend', e => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  touch = null;
}, { passive: true });

/* ---------- global clicks ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#work/"]');
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    go(a.getAttribute('href'), { replace: dialog.open && route?.type === 'work' });
    return;
  }
  if (e.target.closest('[data-resume]')) { e.preventDefault(); go('#resume'); }
  if (e.target.closest('[data-album]')) go('#album');
  const ph = e.target.closest('[data-photo]');
  if (ph) go(`#album/${+ph.dataset.photo + 1}`);
  if (e.target.closest('[data-album-back]')) {
    if (photoFromGrid) history.back();
    else go('#album', { replace: true });
  }
  const f = e.target.closest('[data-cat]');
  if (f) setCategory(f.dataset.cat);
});

/* ---------- init ---------- */
renderHero();
renderAbout();
renderJourney();
renderFeatured();
renderFilters();
renderGrid();
renderFilms();
renderSkills();
renderContact();

const catMatch = location.hash.match(/^#works\/(.+)$/);
if (catMatch) {
  setCategory(decodeURIComponent(catMatch[1]), { updateHash: false });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  addEventListener('load', () => setTimeout(() => $('#works').scrollIntoView({ behavior: 'instant' }), 60), { once: true });
}

window.Katie = {
  data: D, byId, esc, toast, workHref, reduced,
  openWork: id => go(workHref(id)),
  openInitial() { const r = parseRoute(); if (r) render(r); }
};
})();
