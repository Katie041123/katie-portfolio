(() => {
'use strict';
const K = window.Katie;
const D = K.data;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = K.reduced;
const IMG = n => `assets/img/${n}.webp`;
const LIE = ['book-winter', 'book-bear', 'book-flower'];
addEventListener('load', () => [...LIE, 'mascot-wink'].forEach(n => { const i = new Image(); i.src = IMG(n); }), { once: true });

/* ---------- speech bubbles ---------- */
const timers = new WeakMap();
function say(el, text, ms = 2800) {
  if (!el || !text) return;
  const bubble = $('.bubble', el);
  bubble.textContent = text;
  el.classList.add('speaking');
  clearTimeout(timers.get(el));
  timers.set(el, setTimeout(() => el.classList.remove('speaking'), ms));
}
window.KatieFx = { say };
const lineFor = el => {
  const key = el.dataset.line;
  const v = D.lines[key];
  return typeof v === 'string' ? v : v?.idle;
};

/* ---------- mascots ---------- */
let clickIndex = 0;
$$('[data-mascot]').forEach(el => {
  const img = $('img', el);
  const kind = el.dataset.mascot;
  let pose = LIE.findIndex(n => img.src.includes(n));
  $('.mascot-btn', el).addEventListener('click', () => {
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    if (kind === 'lie') {
      pose = (pose + 1) % LIE.length;
      img.src = IMG(LIE[pose]);
    } else {
      img.src = IMG('mascot-wink');
      setTimeout(() => { img.src = IMG('mascot-wave'); }, 700);
    }
    say(el, D.lines.click[clickIndex++ % D.lines.click.length]);
  });
  if (kind === 'stand' && !reduced()) {
    const blink = () => {
      setTimeout(() => {
        if (!el.classList.contains('bump') && img.src.includes('mascot-wave')) {
          img.src = IMG('mascot-wink');
          setTimeout(() => { img.src = IMG('mascot-wave'); }, 170);
        }
        blink();
      }, 3500 + Math.random() * 3000);
    };
    blink();
  }
});

/* ---------- reveal on scroll ---------- */
const seen = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-visible');
    seen.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
$$('.reveal, .check').forEach(el => seen.observe(el));

const greeted = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    greeted.unobserve(e.target);
    setTimeout(() => say(e.target, lineFor(e.target), 3200), 400);
  });
}, { threshold: .6 });
$$('[data-mascot]').forEach(el => { if (el.dataset.line !== 'hero') greeted.observe(el); });

/* ---------- nav ---------- */
const nav = $('#nav');
const links = $$('.nav-links a');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => {
      if (a.getAttribute('href') !== `#${e.target.id}`) { a.removeAttribute('aria-current'); return; }
      a.setAttribute('aria-current', 'true');
      // On phones the link row scrolls sideways: keep the current section's link in view.
      const row = a.parentElement;
      if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

/* ---------- hero card stack ---------- */
const stack = $('#stack');
const heroMascot = $('.mascot--hero');
function dealCards() {
  stack.classList.add('is-in');
  setTimeout(() => say(heroMascot, D.lines.hero, 3600), reduced() ? 0 : 700);
}
const fine = matchMedia('(hover: hover) and (pointer: fine)');
if (fine.matches && !reduced()) {
  const stage = $('.hero-stage');
  let frame = 0, mx = 0, my = 0;
  $('.hero').addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    if (!frame) frame = requestAnimationFrame(() => {
      stack.style.setProperty('--mx', (mx * 9).toFixed(2));
      stack.style.setProperty('--my', (my * 7).toFixed(2));
      frame = 0;
    });
  });
  $('.hero').addEventListener('pointerleave', () => { stack.style.setProperty('--mx', 0); stack.style.setProperty('--my', 0); });
}

/* ---------- journey walker ---------- */
const track = $('#track');
const walker = $('#walker');
const fill = $('#rail-fill');
const stops = $$('#stops .stop:not(.stop--end)');
let active = null, walkTimer;
function placeWalker(stop, speak) {
  if (!stop) return;
  const y = Math.max(0, stop.offsetTop - 4);
  walker.style.setProperty('--y', `${y}px`);
  const rail = fill.parentElement;
  fill.style.setProperty('--p', Math.min(1, (y + walker.offsetHeight * .55) / Math.max(1, rail.clientHeight)).toFixed(4));
  stops.forEach(s => s.classList.toggle('is-active', s === stop));
  if (!reduced()) {
    walker.classList.add('walking');
    clearTimeout(walkTimer);
    walkTimer = setTimeout(() => walker.classList.remove('walking'), 800);
  }
  if (speak) say(walker, stop.dataset.line, 3000);
}
const walk = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting || e.target === active) return;
    active = e.target;
    placeWalker(active, true);
  });
}, { rootMargin: '-35% 0px -55% 0px' });
stops.forEach(s => walk.observe(s));
placeWalker(stops[0], false);
new ResizeObserver(() => placeWalker(active || stops[0], false)).observe(track);

/* ---------- intro ---------- */
const intro = $('#intro');
let introSeen = false;
try { introSeen = sessionStorage.getItem('katie-intro') === '1'; } catch {}
const skipIntro = introSeen || reduced() || location.hash.length > 1;
let introDone = false;
function finishIntro() {
  if (introDone) return;
  introDone = true;
  intro.classList.add('leaving');
  try { sessionStorage.setItem('katie-intro', '1'); } catch {}
  setTimeout(() => { intro.hidden = true; }, 400);
  document.documentElement.classList.remove('modal-open');
  dealCards();
  K.openInitial();
}
if (skipIntro) {
  dealCards();
  K.openInitial();
} else {
  intro.hidden = false;
  document.documentElement.classList.add('modal-open');
  const katie = $('#intro-katie');
  const t = [];
  const at = (ms, fn) => t.push(setTimeout(fn, ms));
  at(120, () => intro.classList.add('pop'));
  at(620, () => { katie.src = IMG('mascot-wink'); });
  at(880, () => { katie.src = IMG('mascot-wave'); });
  at(1000, () => intro.classList.add('open'));
  at(1500, finishIntro);
  const skip = () => { t.forEach(clearTimeout); finishIntro(); };
  intro.addEventListener('click', skip);
  addEventListener('keydown', skip, { once: true });
}
})();
