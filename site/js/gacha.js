(() => {
'use strict';
const K = window.Katie;
if (!K) return;
const D = K.data, G = D.gacha, esc = K.esc;
const $ = s => document.querySelector(s);
const KEY = 'katie-gacha-v1';
const COLORS = ['#f5a3bd', '#9fd0e6', '#b7dba5', '#ffd57a', '#c9b5f0', '#ffb38a'];
const FACT_TONES = ['yellow', 'pink', 'blue', 'green', 'beige', 'pink'];

const items = [
  ...D.projects.map(p => ({ key: `w:${p.id}`, type: 'work', id: p.id })),
  ...D.facts.map((text, i) => ({ key: `f:${i}`, type: 'fact', i, text })),
  { key: 'hidden', type: 'hidden' }
];
const normal = items.filter(it => it.type !== 'hidden');
const byKey = Object.fromEntries(items.map(it => [it.key, it]));

let collected = [];
try { collected = (JSON.parse(localStorage.getItem(KEY) || '[]') || []).filter(k => byKey[k]); } catch { collected = []; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(collected)); } catch {} };
const has = k => collected.includes(k);

const machine = $('#machine'), knob = $('#gacha-knob'), chute = $('#chute-ball'), result = $('#gacha-result');
const mascot = document.querySelector('.mascot--gacha');
let busy = false, turn = 0;

$('#gacha-title').textContent = G.name;

// Capsules resting in the dome.
const SPOTS = [[6, 172], [54, 176], [102, 170], [150, 176], [196, 168], [28, 126], [78, 130], [126, 124], [174, 128], [52, 84], [102, 86], [150, 82], [100, 40]];
$('#machine-balls').innerHTML = SPOTS.map(([x, y], i) => `<span class="ball" style="left:${x}px;top:${y}px;--c:${COLORS[i % COLORS.length]};--r:${(i * 47) % 180 - 90}deg"></span>`).join('');

function say(text) { window.KatieFx?.say(mascot, text, 3000); }

function slotMarkup(it) {
  const got = has(it.key);
  if (it.type === 'hidden') {
    return `<li>${got ? '<button type="button" class="slot slot--hidden slot--filled" data-slot="hidden" aria-label="隐藏款">' : '<span class="slot slot--hidden" aria-label="隐藏款，还没抽到">'}<svg aria-hidden="true"><use href="#star"/></svg>${got ? '</button>' : '</span>'}</li>`;
  }
  if (!got) return '<li><span class="slot" aria-hidden="true">?</span></li>';
  if (it.type === 'work') {
    const p = K.byId[it.id];
    return `<li><button type="button" class="slot slot--filled" data-slot="${esc(it.key)}" style="background-image:url('${esc(p.image)}')" aria-label="作品：${esc(p.title)}"></button></li>`;
  }
  return `<li><button type="button" class="slot slot--filled slot--fact" data-tone="${FACT_TONES[it.i % FACT_TONES.length]}" data-slot="${esc(it.key)}" aria-label="小事 ${it.i + 1}">小事</button></li>`;
}
function renderCollection(popKey) {
  $('#gacha-collection').innerHTML = items.map(slotMarkup).join('');
  const n = normal.filter(it => has(it.key)).length;
  $('#gacha-progress').textContent = `已收集 ${n} / ${normal.length}${has('hidden') ? ' · 隐藏款 ✦' : ''}`;
  $('#gacha-reset').hidden = !(n === normal.length && has('hidden'));
  if (popKey) document.querySelector(`[data-slot="${CSS.escape(popKey)}"]`)?.classList.add('pop');
}

function idleMarkup() {
  return `<div class="result-idle"><p class="hand">扭一个，看看里面是什么！</p><p>里面可能是一个作品、一件关于 Katie 的小事，或者……一颗隐藏款 ✦</p></div>`;
}
function resultMarkup(it) {
  if (it.type === 'work') {
    const p = K.byId[it.id];
    return `<div class="result"><img class="result-thumb" src="${esc(p.image)}" alt="" width="640" height="420"><div><span class="result-label" data-tone="green">作品扭蛋 · ${esc(p.category)}</span><h4>${esc(p.title)}</h4><p>${esc(p.summary || '')}</p><a class="btn btn-dark" href="${K.workHref(p.id)}">打开作品 →</a></div></div>`;
  }
  if (it.type === 'fact') {
    return `<div class="result result--fact"><img class="result-mascot" src="assets/img/mascot-wink.webp" alt="" width="291" height="640"><div><span class="result-label" data-tone="yellow">关于 Katie 的小事 · #${String(it.i + 1).padStart(2, '0')}</span><h4>${esc(it.text)}</h4></div></div>`;
  }
  if (it.type === 'hidden') {
    const confetti = Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;--c:${COLORS[i % COLORS.length]};--d:${(i % 9) * 70}ms"></i>`).join('');
    return `<div class="confetti" aria-hidden="true">${confetti}</div><div class="result result--hidden"><img class="result-mascot" src="${esc(G.hidden.image)}" alt="Katie 的隐藏款贴纸" width="520" height="368"><div><span class="result-label" data-tone="pink">隐藏款 ✦ 恭喜！</span><h4>${esc(G.hidden.message)}</h4></div></div>`;
  }
  return `<div class="result-idle"><p class="hand">全部集齐啦！</p><p>所有扭蛋都收进手账里了，包括隐藏款。点手账里的贴纸可以重温，也可以重新开始收集。</p></div>`;
}
function showResult(it, { animate = true, color } = {}) {
  result.classList.toggle('is-hidden', it.type === 'hidden');
  const halves = animate && !K.reduced() ? `<div class="capsule-halves" aria-hidden="true" style="--c:${color || COLORS[0]}"><span></span><span></span></div>` : '';
  result.innerHTML = resultMarkup(it) + halves;
}

function pick() {
  const left = normal.filter(it => !has(it.key));
  if (!left.length) return has('hidden') ? null : byKey.hidden;
  if (!has('hidden') && collected.length > 0 && Math.random() < G.earlyHiddenChance) return byKey.hidden;
  return left[Math.floor(Math.random() * left.length)];
}

function spin() {
  if (busy) return;
  const it = pick();
  if (!it) { showResult({ type: 'done' }, { animate: false }); say(D.lines.gacha.done); return; }
  busy = true;
  const color = it.type === 'hidden' ? '#ffd57a' : COLORS[Math.floor(Math.random() * COLORS.length)];
  const quick = K.reduced();
  turn += 360;
  knob.style.setProperty('--turn', `${turn}deg`);
  machine.classList.add('spinning');
  chute.classList.remove('drop');
  chute.style.setProperty('--c', color);
  setTimeout(() => { machine.classList.remove('spinning'); void chute.offsetWidth; chute.classList.add('drop'); }, quick ? 0 : 650);
  setTimeout(() => {
    collected.push(it.key);
    save();
    showResult(it, { color });
    renderCollection(it.key);
    const done = normal.every(n => has(n.key)) && has('hidden');
    say(done ? D.lines.gacha.done : D.lines.gacha[it.type]);
    if (window.matchMedia('(max-width:1024px)').matches) result.scrollIntoView({ block: 'nearest', behavior: quick ? 'auto' : 'smooth' });
    busy = false;
  }, quick ? 0 : 1200);
}

knob.addEventListener('click', spin);
$('#gacha-go').addEventListener('click', spin);
$('#gacha-collection').addEventListener('click', e => {
  const b = e.target.closest('[data-slot]');
  if (!b) return;
  const it = byKey[b.dataset.slot];
  if (it) showResult(it, { animate: false });
});
$('#gacha-reset').addEventListener('click', () => {
  collected = [];
  save();
  renderCollection();
  result.classList.remove('is-hidden');
  result.innerHTML = idleMarkup();
  K.toast('扭蛋手账已清空，重新开始收集吧！');
});

result.innerHTML = idleMarkup();
renderCollection();
})();
