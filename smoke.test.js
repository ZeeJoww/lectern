/* Lectern smoke test — engine + F0–F9.
   Run:  npm i jsdom && node smoke.test.js [path/to/lectern.html]
   Exit code = number of failed assertions. jsdom asserts DOM/API state;
   pixels, popups and print are the browser ritual (SPEC §6 steps 3–4). */
'use strict';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const file = process.argv[2] || 'lectern.html';
const html = fs.readFileSync(file, 'utf8');

function boot(url) {
  const scriptErrors = [];
  const counters = { error: 0 };
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    const m = String((e && e.message) || e);
    if (!/Could not parse CSS|Not implemented/i.test(m)) scriptErrors.push(m);
  });
  vc.on('error', () => { counters.error++; });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url, pretendToBeVisual: true, virtualConsole: vc,
  });
  return { w: dom.window, d: dom.window.document, scriptErrors, counters };
}

let fails = 0;
function t(name, cond) {
  console.log((cond ? '  ok  ' : ' FAIL ') + name);
  if (!cond) fails++;
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 25));

(async () => {
  const { w, d, scriptErrors, counters } = boot('https://localhost/lectern.html');
  const cur = () => d.querySelector('.slide.is-current');
  const key = (k, target) => (target || w).dispatchEvent(
    new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  async function goId(id) { w.location.hash = '#' + id; await tick(); }

  /* ── boot ── */
  t('no uncaught script errors on boot', scriptErrors.length === 0);
  t('Lectern API: go/next/prev/overview/check/on/off/presenter/math/_pv',
    ['go','next','prev','overview','check','on','off','presenter','math','_pv']
      .every((k) => typeof w.Lectern[k] === 'function'));
  t('boots on #title, counter 01 / 15', cur().id === 'title'
    && d.querySelector('#cntCur').textContent === '01'
    && d.querySelector('#cntTot').textContent === '15');

  /* ── F0 hooks ── */
  const seen = [];
  const h0 = w.Lectern.on('slide', (e) => seen.push(e));
  w.Lectern.next();
  t("next() emits 'slide' with frag fields", seen.length === 1
    && seen[0].id === 'agenda' && seen[0].i === 1
    && seen[0].frag === -1 && seen[0].frags === 0);
  const bomb = w.Lectern.on('slide', () => { throw new Error('boom'); });
  const errBefore = counters.error;
  w.Lectern.next();
  t('throwing listener: nav survives, error reported',
    cur().id === 'foundations' && counters.error === errBefore + 1);
  w.Lectern.off('slide', bomb);
  w.Lectern.off('slide', h0);

  /* ── F4 agenda + toc ── */
  const ags = d.querySelectorAll('#agenda .agenda a');
  t('agenda self-builds: 3 sections, deep-link hrefs, counts',
    ags.length === 3
    && ags[0].getAttribute('href') === '#foundations'
    && ags[1].getAttribute('href') === '#embedding'
    && ags[2].getAttribute('href') === '#sharing'
    && /6 slides/.test(ags[0].textContent));
  t('toc popover mirrors sections', d.querySelectorAll('#toc a').length === 3);
  key('g');
  t('G opens the section popover', d.querySelector('#toc').classList.contains('is-open')
    && d.querySelector('#runSection').getAttribute('aria-expanded') === 'true');
  key('Escape');
  t('Esc closes popover first (deck not in overview)',
    !d.querySelector('#toc').classList.contains('is-open')
    && !d.querySelector('#deck').classList.contains('is-overview'));

  /* ── F1 fragments ── */
  await goId('layouts');
  w.Lectern.next(); // forward entry into #writing → steps hidden
  const frags = d.querySelectorAll('#writing .frag');
  t('forward entry hides all steps', cur().id === 'writing' && frags.length === 3
    && ![...frags].some((f) => f.classList.contains('is-revealed')));
  const steps = [];
  const h1 = w.Lectern.on('slide', (e) => { if (e.step) steps.push(e); });
  w.Lectern.next(); w.Lectern.next();
  t('two reveals stay on the slide', cur().id === 'writing'
    && [...frags].filter((f) => f.classList.contains('is-revealed')).length === 2
    && steps.length === 2 && steps[1].frag === 1 && steps[1].frags === 3);
  t('frag--dim first step dims once passed',
    frags[0].classList.contains('is-passed') === true
    && frags[0].classList.contains('frag--dim')
    && d.querySelectorAll('#writing .is-passed').length === 1);
  w.Lectern.next(); w.Lectern.next(); // 3rd reveal, then advance
  t('exhausted steps advance the slide', cur().id === 'blocks');
  w.Lectern.prev();
  t('backward entry arrives fully revealed', cur().id === 'writing'
    && [...frags].every((f) => f.classList.contains('is-revealed')));
  key('PageDown');
  t('PageDown skips steps entirely', cur().id === 'blocks');
  w.Lectern.off('slide', h1);

  /* ── F3 math ── */
  const m = d.querySelector('#blocks .math');
  t('without KaTeX the TeX chip is untouched',
    m && !m.hasAttribute('data-mathed') && /e\^{i\\pi}/.test(m.textContent));
  w.katex = { render: (tex, el) => { el.textContent = '∎'; } };
  w.Lectern.math(6); // #blocks
  t('with KaTeX (faked) math renders once and is marked',
    m.getAttribute('data-mathed') === '1' && m.textContent === '∎');

  /* ── F5 search ── */
  key('/');
  const fin = d.querySelector('#findIn');
  t('/ opens search focused', d.body.classList.contains('find-on')
    && d.activeElement === fin);
  fin.value = 'booktabs';
  fin.dispatchEvent(new w.Event('input', { bubbles: true }));
  const rows = d.querySelectorAll('#findRs li[data-i]');
  t('query lists hits with folio + context', rows.length >= 1
    && /Figures and booktabs/.test(rows[0].textContent));
  const before = cur().id;
  key('ArrowDown', fin);
  t('arrows inside the input never move the deck', cur().id === before);
  key('Enter', fin);
  t('Enter jumps to the hit and closes', cur().id === 'figures'
    && !d.body.classList.contains('find-on'));

  /* ── F2 presenter + blackout ── */
  const pv = w.Lectern._pv();
  t('_pv payload: folio, title, notes, next', pv.tot === 15
    && pv.id === 'figures' && /booktabs/i.test(pv.title)
    && typeof pv.notes === 'string' && pv.next.length > 0);
  await goId('end');
  t('_pv at the last slide reports end of deck', /end of deck/.test(w.Lectern._pv().next));
  let threw = false;
  try { w.Lectern.presenter(); key('p'); } catch (e) { threw = true; }
  t('presenter degrades silently when popups are unavailable', !threw);
  key('b');
  t('B blacks out', d.body.classList.contains('blackout-on'));
  await goId('share');
  key('ArrowLeft');
  t('any nav key lifts the blackout and still navigates',
    !d.body.classList.contains('blackout-on') && cur().id === 'sharing');

  /* ── F6 media ── */
  const tok = d.querySelector('#tokens');
  const vid = d.createElement('video');
  vid.setAttribute('data-src', 'clip.mp4');
  tok.appendChild(vid);
  await goId('tokens');
  t('video[data-src] promotes near its slide',
    vid.getAttribute('src') === 'clip.mp4' && !vid.hasAttribute('data-src'));
  let paused = 0;
  Object.defineProperty(vid, 'paused', { get: () => false });
  vid.pause = () => { paused++; };
  w.Lectern.next();
  t('leaving a slide pauses its media', paused === 1);

  /* ── F7 ink/laser (no 2D context in jsdom → graceful) ── */
  key('l');
  t('L arms the laser', d.body.classList.contains('laser-on'));
  key('l');
  key('i');
  t('I without a canvas context degrades to a no-op',
    !d.body.classList.contains('ink-on') && !d.body.classList.contains('laser-on'));
  threw = false; try { key('c'); } catch (e) { threw = true; }
  t('C never throws', !threw);

  /* ── F8 themes ── */
  key('t');
  t('T applies slate and persists it',
    d.documentElement.getAttribute('data-theme') === 'slate'
    && w.localStorage.getItem('lectern-theme') === 'slate'
    && d.querySelector('#toast').classList.contains('is-on'));
  key('t'); key('t');
  t('cycle returns to paper (attribute removed)',
    !d.documentElement.hasAttribute('data-theme')
    && w.localStorage.getItem('lectern-theme') === '');

  /* ── engine regressions ── */
  await goId('inner-pages');
  const fr = d.querySelector('#inner-pages iframe[sandbox]');
  t('template[data-page] hydrates to sandboxed srcdoc',
    !!fr && !d.querySelector('#inner-pages template'));
  t('check() returns an array', Array.isArray(w.Lectern.check()));
  t('no handout pages without the flag', d.querySelectorAll('.hand').length === 0);
  await goId('end');
  t('hashchange still navigates', cur().id === 'end');

  /* ── F9 handout instance ── */
  const H = boot('https://localhost/lectern.html?handout#title');
  await tick(40);
  const hands = H.d.querySelectorAll('.hand');
  t('?handout: one notes page per slide', hands.length === 15
    && H.d.body.classList.contains('handout'));
  t('handout pages interleave and carry folios',
    hands[0].previousElementSibling.id === 'title'
    && hands[0].getAttribute('data-n') === '01'
    && /—|notes/i.test(hands[0].textContent));
  t('handout boot clean', H.scriptErrors.length === 0);

  console.log(fails === 0 ? '\nall green' : `\n${fails} failing`);
  process.exit(fails);
})().catch((e) => { console.error(' FATAL', e); process.exit(99); });
