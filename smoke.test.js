/* Lectern smoke test — engine + F0–F9.
   Run:  npm i jsdom && node smoke.test.js [path/to/lectern.html]
   Exit code = number of failed assertions. jsdom asserts DOM/API state;
   pixels, popups and print are the browser ritual (SPEC §6 steps 3–4). */
'use strict';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const file = process.argv[2] || 'lectern.html';
const html = fs.readFileSync(file, 'utf8');

function boot(url, src) {
  const scriptErrors = [];
  const counters = { error: 0 };
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    const m = String((e && e.message) || e);
    if (!/Could not parse CSS|Not implemented/i.test(m)) scriptErrors.push(m);
  });
  vc.on('error', () => { counters.error++; });
  const dom = new JSDOM(src || html, {
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
  await goId('layouts'); w.Lectern.next(); // #writing, steps hidden
  const w0 = parseFloat(d.querySelector('#pbar').style.width);
  w.Lectern.next(); w.Lectern.next(); w.Lectern.next(); // reveal all 3
  t('progress bar interpolates and completes on the last step',
    parseFloat(d.querySelector('#pbar').style.width) > w0
    && d.querySelector('#pbar').style.width === '40%'); // (5+1)/15
  const st = w.Lectern.state();
  t('state(): pull access mirrors the deck', st.id === 'writing' && st.i === 5
    && st.n === '06' && st.tot === 15 && st.frag === 2 && st.frags === 3
    && st.sections.length === 3 && st.sections[0].id === 'foundations');

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

  /* ── srcdoc-safe fragment links (v2.4) ── */
  await goId('agenda');
  const row = d.querySelector('#agenda .agenda a');
  const ev = new w.MouseEvent('click', { bubbles: true, cancelable: true });
  row.dispatchEvent(ev);
  t('agenda click routes through go(), native nav suppressed',
    ev.defaultPrevented && cur().id === 'foundations');
  await goId('agenda');
  w.Lectern.overview(true);
  const ev2 = new w.MouseEvent('click', { bubbles: true, cancelable: true });
  row.dispatchEvent(ev2);
  t('in overview the thumbnail wins over the link inside it',
    ev2.defaultPrevented && cur().id === 'agenda'
    && !d.querySelector('#deck').classList.contains('is-overview'));

  /* ── G6: announcer, inert, popover keyboard ── */
  t('G6: announcer narrates navigation',
    d.querySelector('#announce').textContent.startsWith(cur().dataset.n + ' / 15'));
  t('G6: hidden slides are inert, current is not',
    !cur().hasAttribute('inert') && d.querySelectorAll('.slide[inert]').length === 14);
  w.Lectern.overview(true);
  const inOv = d.querySelectorAll('.slide[inert]').length;
  w.Lectern.overview(false);
  t('G6: overview lifts inert so thumbnails stay clickable',
    inOv === 0 && d.querySelectorAll('.slide[inert]').length === 14);
  key('g');
  const tocAs = d.querySelectorAll('#toc a');
  const focusedInToc = d.activeElement && d.activeElement.closest('#toc');
  key('ArrowDown', d.activeElement);
  t('G6: popover opens focused; arrows traverse; deck does not move',
    !!focusedInToc && d.activeElement === tocAs[1] && cur().id === 'agenda');
  key('Escape', d.activeElement);
  t('G6: Escape closes the popover and restores the trigger',
    !d.querySelector('#toc').classList.contains('is-open')
    && d.activeElement === d.querySelector('#runSection'));
  t('G7: unplanned decks expose no pace fields', w.Lectern._pv().plan === null);
  t('G9: deck ships the data-fx variant CSS',
    fs.readFileSync(file, 'utf8').includes('.slide[data-fx="slide"]'));

  /* ── H0: overview keyboard ── */
  await goId('tokens');
  w.Lectern.overview(true);
  t('H0: overview seeds the ring on the current slide', cur().classList.contains('is-sel'));
  key('ArrowRight');
  t('H0: arrows move the ring, never the deck',
    d.querySelector('.slide.is-sel').id === 'layouts' && cur().id === 'tokens');
  key('ArrowDown');
  t('H0: row-move falls back to ±1 when geometry is flat',
    d.querySelector('.slide.is-sel').id === 'writing');
  key('Home');
  t('H0: Home moves the ring first and announces it',
    d.querySelector('.slide.is-sel').id === 'title'
    && d.querySelector('#announce').textContent.startsWith('01 / 15'));
  key('End'); key('Enter');
  t('H0: Enter commits the ring and closes the grid',
    cur().id === 'end'
    && !d.querySelector('#deck').classList.contains('is-overview')
    && !d.querySelector('.slide.is-sel'));

  /* ── H2: rehearsal report formatter ── */
  const rep = w.Lectern._report(
    [{ n: '01', id: 'title', plan: 1, ms: 0 }, { n: '02', id: 'agenda', plan: 0.5, ms: 70000 }], 100000);
  t('H2: report — dwell vs plan per slide, signed deltas, totals',
    rep.includes('01  #title  1:10  / plan 1:00  +0:10')
    && rep.includes('02  #agenda  0:30  / plan 0:30  +0:00')
    && rep.endsWith('total  1:40  / plan 1:30'));

  /* ── H7: next-step preview ── */
  await goId('layouts'); w.Lectern.next(); // forward entry: #writing, steps hidden
  const pvs = w.Lectern._pv();
  w.Lectern.next(); w.Lectern.next(); w.Lectern.next(); // reveal all three
  const pvz = w.Lectern._pv();
  t('H7: presenter previews the coming step, then the coming slide',
    pvs.nextStep && pvs.nextStep.k === 1 && pvs.nextStep.K === 3
    && pvs.nextStep.text.startsWith('Inline tokens')
    && pvz.nextStep === null && /Definitions/.test(pvz.next)
    && pvs.backup === false);

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

  /* ── starter template (if present) ── */
  if (fs.existsSync('starter.html')) {
    const raw = fs.readFileSync('starter.html', 'utf8');
    const vc2 = new VirtualConsole(); const errs = [];
    vc2.on('jsdomError', (e) => { const m = String((e && e.message) || e);
      if (!/Could not parse CSS|Not implemented/i.test(m)) errs.push(m); });
    const S = new JSDOM(raw, { runScripts: 'dangerously',
      url: 'https://localhost/starter.html', pretendToBeVisual: true, virtualConsole: vc2 });
    await tick(30);
    t('starter boots clean: 5 slides, agenda has 1 section',
      errs.length === 0
      && S.window.document.querySelector('#cntTot').textContent === '05'
      && S.window.document.querySelectorAll('#agenda .agenda a').length === 1
      && S.window.Lectern.state().tot === 5);
  }

  /* ── compose (if present): outline → deck → boots ── */
  if (fs.existsSync('compose.html')) {
    const C = boot('https://localhost/compose.html', fs.readFileSync('compose.html', 'utf8'));
    await tick(60);
    t('compose boots with API + prefilled sample',
      C.scriptErrors.length === 0
      && typeof C.w.buildDeck === 'function'
      && C.w.document.querySelector('#outline').value.includes('## '));
    const sample = C.w.document.querySelector('#outline').value;
    const deck = C.w.buildDeck(sample);
    t('outline survives a round trip exactly', C.w.extractOutline(deck) === sample);
    t('no placeholders leak into the deck',
      !/__SLIDES__|__SHORT__|__BYLINE__|__TITLE__/.test(deck));
    const evil = C.w.buildDeck('title: Costs & $& "q"\n\n## A $\' slide\n- keep $& literal');
    t('$-patterns and quotes in speaker text survive',
      evil.includes('$&amp;') && !evil.includes('__SHORT__'));
    const vcg = new VirtualConsole(); const gErrs = [];
    vcg.on('jsdomError', (e) => { const m = String((e && e.message) || e);
      if (!/Could not parse CSS|Not implemented/i.test(m)) gErrs.push(m); });
    const GD = new JSDOM(deck, { runScripts: 'dangerously',
      url: 'https://localhost/talk.html', pretendToBeVisual: true, virtualConsole: vcg });
    await tick(60);
    const gs = GD.window.Lectern.state();
    t('generated deck boots clean: title+agenda+2 sections+3 slides+end',
      gErrs.length === 0 && gs.tot === 8 && gs.sections.length === 2
      && GD.window.document.querySelectorAll('#agenda .agenda a').length === 2
      && GD.window.document.querySelectorAll('.frag').length === 3
      && GD.window.document.querySelectorAll('.math').length === 1);

    /* v2.3 — escape fix */
    const src = fs.readFileSync('compose.html', 'utf8');
    let mk = src;
    (src.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).forEach((b) => { mk = mk.replace(b, ''); });
    t('no \\uXXXX escapes in the UI markup; real characters shown',
      !/\\u[0-9a-fA-F]{4}/.test(mk)
      && C.w.document.querySelector('h1').textContent.includes('\u00b7')
      && C.w.document.querySelector('#cheat').textContent.includes('\u2192'));

    /* v2.3 — bilingual UI */
    C.w.setLang('zh');
    t('setLang(zh) localises chrome and swaps the untouched sample',
      C.w.document.querySelector('#dl').textContent === '\u4e0b\u8f7d\u5e7b\u706f\u7247'
      && C.w.document.documentElement.lang === 'zh-CN'
      && C.w.document.querySelector('#outline').value.includes('lang: zh'));
    const zhSample = C.w.document.querySelector('#outline').value;
    const zhDeck = C.w.buildDeck(zhSample);
    const vcz = new VirtualConsole(); const zErrs = [];
    vcz.on('jsdomError', (e) => { const m = String((e && e.message) || e);
      if (!/Could not parse CSS|Not implemented/i.test(m)) zErrs.push(m); });
    const ZD = new JSDOM(zhDeck, { runScripts: 'dangerously',
      url: 'https://localhost/zh.html', pretendToBeVisual: true, virtualConsole: vcz });
    await tick(60);
    const zAg = ZD.window.document.querySelectorAll('#agenda .agenda a');
    t('lang:zh deck: \u8bae\u7a0b, \u95ee\u7b54, zh-CN, CJK slugs, \u9875 counts',
      zErrs.length === 0
      && zhDeck.includes('<html lang="zh-CN">')
      && ZD.window.document.querySelector('#agenda h2').textContent === '\u8bae\u7a0b'
      && ZD.window.document.querySelector('#end h2').textContent.includes('\u95ee\u7b54')
      && !!ZD.window.document.getElementById('\u4e00\u4e2a-html-\u6587\u4ef6')
      && /\u9875/.test(zAg[0].textContent));
    C.w.setLang('en');

    /* v2.3 — pictures */
    const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    C.w.ASSETS['pic-1'] = px;
    const pDeck = C.w.buildDeck('title: T\n\n## Fig slide\n![pic-1 | A tiny dot]\n![nope | ghost]');
    t('pasted picture renders as a captioned figure; missing asset warns',
      pDeck.includes('data-name="pic-1"') && pDeck.includes(px)
      && /<figcaption><b>Figure 1<\/b> — A tiny dot<\/figcaption>/.test(pDeck)
      && /missing image: nope|\u7f3a\u5c11\u56fe\u7247/.test(pDeck));
    const rec = C.w.extractAssets(pDeck);
    t('assets round-trip from the downloaded deck', rec['pic-1'] === px
      && Object.keys(rec).length === 1);

    /* ── G1: outline ⇄ preview provenance ── */
    C.w.setLang('en');
    const sTxt = C.w.document.querySelector('#outline').value;
    C.w.buildDeck(sTxt);
    const map = C.w._map();
    const lines = sTxt.split('\n');
    t('G1: provenance map — every block knows its line',
      map.length === 8 && map[0].id === 'title' && !map[1].src /* agenda */
      && map.find((m) => m.id === 'one-html-file').start
         === lines.findIndex((l) => l.startsWith('## One HTML file')));
    const caretLn = lines.findIndex((l) => l.includes('Press **T**'));
    t('G1: a caret line resolves to its slide',
      C.w._caretIndex(caretLn).id === 'one-html-file'
      && C.w._caretIndex(0).id === 'title');

    /* ── G2: ::compact grammar + one-click fixes ── */
    t('G2: ::compact renders h-compact and unknown directives are ignored',
      /class="slide h-compact" id="a"/.test(C.w.buildDeck('title: T\n\n## A\n::compact\n::future x\n- x'))
      && !/class="slide h-compact"/.test(C.w.buildDeck('title: T\n\n## A\n- x')));
    C.w.document.querySelector('#outline').value = sTxt;
    C.w.fixSlide('why-sharing-slides-is-hard', 'compact');
    let v = C.w.document.querySelector('#outline').value;
    t('G2: Compact inserts the directive under the heading, once',
      v.includes('## Why sharing slides is hard\n::compact')
      && (C.w.fixSlide('why-sharing-slides-is-hard', 'compact'),
          C.w.document.querySelector('#outline').value.split('::compact').length === 2));
    C.w.fixSlide('why-sharing-slides-is-hard', 'split');
    v = C.w.document.querySelector('#outline').value;
    const contDeck = C.w.buildDeck(v);
    t('G2: Split moves the trailing half to a cont. slide that builds',
      v.includes('## Why sharing slides is hard — cont.')
      && contDeck.includes('id="why-sharing-slides-is-hard-cont"')
      && contDeck.includes('h-compact') /* directive stayed on part one */
      && v.indexOf('> Ask who has reopened') < v.indexOf('— cont.') /* notes stay on part one */);

    /* ── G3: columns + fill figure ── */
    const colDeck = C.w.buildDeck('title: T\n\n## Two up\nLead.\n- left point\n|\n![pic-1 | Side view | fill]');
    t('G3: lone | splits into .cols; lone fill figure stretches its cell',
      colDeck.includes('<div class="cols">')
      && colDeck.includes('align-self:stretch')
      && colDeck.includes('object-fit:contain')
      && /<b>Figure 1<\/b> — Side view/.test(colDeck)
      && /class="cols"><div><p class="lead">Lead\./.test(colDeck));

    /* ── G4: tables ── */
    const tb = C.w.buildDeck('title: T\n\n## Tab\n| Model | Acc |\n|---|---:|\n| A | 0.91 |\n| B | 0.87 |\n|= Results on the dev set');
    t('G4: |table| → booktabs with header, right-aligned numerics, numbered caption',
      tb.includes('<table class="tbl">')
      && tb.includes('<thead><tr><th>Model</th><th class="num">Acc</th></tr></thead>')
      && tb.includes('<td class="num">0.91</td>')
      && /<caption><b>Table 1<\/b> — Results on the dev set<\/caption>/.test(tb));

    /* ── G5: citations + auto references ── */
    const rf = C.w.buildDeck('title: T\nrefs:\n  smith2020: Smith et al. (2020). A paper. Venue.\n  li2023: Li (2023). Another. Venue.\n\n## Claims\nShown [@smith2020], again [@smith2020]; [@li2023] too; [@ghost] is unknown.');
    t('G5: numbered by first use, reuse stable, unknown flagged, refs slide auto-built',
      rf.includes('<sup class="cite">[1]</sup>')
      && (rf.match(/\[1\]/g) || []).length >= 2
      && rf.includes('<sup class="cite">[2]</sup>')
      && rf.includes('cite--bad">[?ghost]')
      && rf.includes('id="references"')
      && rf.indexOf('Smith et al.') < rf.indexOf('Li (2023).'));
    const rf2 = C.w.buildDeck('title: T\nrefs:\n  a1: One.\n\n## X\n[@a1]\n\n## References\n- mine');
    t('G5: a hand-written References slide suppresses the auto one',
      (rf2.match(/id="references"/g) || []).length === 1 && rf2.includes('<li>mine</li>'));

    /* ── G7: pacing budgets ── */
    const pd = C.w.buildDeck('title: T\ntime: 10m\n\n# S\n## A @4m\n- x\n## B\n- y\n## C\n- z');
    t('G7: @4m sticks, time: spreads the rest, titles are clean',
      pd.includes('id="a" data-min="4"')
      && pd.includes('id="b" data-min="3"') && pd.includes('id="c" data-min="3"')
      && pd.includes('<h2>A</h2>'));
    const vcp = new VirtualConsole(); vcp.on('jsdomError', () => {});
    const PD = new JSDOM(pd, { runScripts: 'dangerously',
      url: 'https://localhost/p.html#b', pretendToBeVisual: true, virtualConsole: vcp });
    await tick(50);
    const pvp = PD.window.Lectern._pv();
    t('G7: presenter plan = cumulative budget at slide entry',
      pvp.plan === 240 && pvp.planTot === 600 && pvp.slideMin === 3);

    /* ── G8: URL media + lints ── */
    const uDeck = C.w.buildDeck('title: T\n\n## Media\n![https://example.org/x.png | Remote]\n!video[https://example.org/v.mp4 | Clip]');
    const li2 = C.w._lints();
    t('G8: URL figure + !video render externally and lint; no asset tag',
      uDeck.includes('<img src="https://example.org/x.png"')
      && uDeck.includes('video data-src="https://example.org/v.mp4"')
      && li2.length === 2 && /self-contained|自包含/.test(li2[0]));

    /* ── H1: backup / appendix ── */
    const bd = C.w.buildDeck('title: T\n\n# Main\n## A\n- x\n## B\n- y\n# Extra ::backup\n## Z\n- z');
    t('H1: compose marks the appendix divider (no §-number, data-backup)',
      /data-section="Extra" data-backup>/.test(bd)
      && /data-section="Main" data-sn="1"/.test(bd)
      && bd.includes('§ A'));
    const vcb = new VirtualConsole(); vcb.on('jsdomError', () => {});
    const BD = new JSDOM(bd, { runScripts: 'dangerously',
      url: 'https://localhost/b.html#a', pretendToBeVisual: true, virtualConsole: vcb });
    await tick(50);
    const bw = BD.window, bdoc = bw.document;
    const bkey = (k) => bw.dispatchEvent(new bw.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    t('H1: main count excludes appendix; A-folios; agenda skips it, popover keeps it muted',
      bdoc.querySelector('#cntTot').textContent === '05'
      && bdoc.getElementById('extra').dataset.n === 'A1'
      && bdoc.getElementById('end').dataset.n === 'A3'
      && bdoc.querySelectorAll('#agenda .agenda a').length === 1
      && bdoc.querySelectorAll('#toc a').length === 2
      && !!bdoc.querySelector('#toc .toc__hr')
      && !!bdoc.querySelector('#toc a.toc--bk'));
    bkey('End');
    const atEnd = bdoc.querySelector('.slide.is-current').id;
    bkey('PageDown');
    t('H1: End stops before the appendix; PgDn still enters it; presenter knows',
      atEnd === 'b'
      && bdoc.querySelector('.slide.is-current').id === 'extra'
      && bw.Lectern._pv().backup === true);
    C.w.buildDeck('title: T\n\n# X ::backup\n## a\n- 1\n# Y\n## b\n- 2');
    t('H1: a normal section after ::backup lints',
      C.w._lints().some((m) => /appendix|附录/.test(m)));
    t('H1: pacing spreads over main slides only',
      /id="a" data-min="4"/.test(C.w.buildDeck('title: T\ntime: 4m\n\n# M\n## A\n- x\n# B ::backup\n## Z\n- z'))
      && !/id="z" data-min/.test(C.w.buildDeck('title: T\ntime: 4m\n\n# M\n## A\n- x\n# B ::backup\n## Z\n- z')));

    /* ── H3: archiver ── */
    C.w.setLang('en');
    C.w.document.querySelector('#outline').value =
      'title: T\n\n## Pics\n![https://ok.example/a.png | Good]\n![https://bad.example/b.png | Bad]';
    C.w.buildDeck(C.w.document.querySelector('#outline').value);
    const pngBytes = Uint8Array.from(atob(px.split(',')[1]), (c) => c.charCodeAt(0));
    C.w._setFetch((u) => /ok\.example/.test(u)
      ? Promise.resolve({ ok: true, blob: () => Promise.resolve(new C.w.Blob([pngBytes], { type: 'image/png' })) })
      : Promise.resolve({ ok: false, status: 403 }));
    const ares = await C.w._archive();
    await tick(40);
    const nv = C.w.document.querySelector('#outline').value;
    t('H3: archive inlines the reachable image, leaves the CORS-blocked token, names it',
      /!\[pic-\d+ \| Good\]/.test(nv)
      && nv.includes('![https://bad.example/b.png | Bad]')
      && ares.filter((r) => r.ok).length === 1 && ares.filter((r) => !r.ok).length === 1);

    /* ── H4: math embed ── */
    C.w._setFetch((u) => {
      if (/\.css$/.test(u)) return Promise.resolve({ ok: true, text: () => Promise.resolve('@font-face{src:url(fonts/KaTeX_Main.woff2) format("woff2")} .katex{}') });
      if (/\.js$/.test(u)) return Promise.resolve({ ok: true, text: () => Promise.resolve('window.katex={render:function(t,e){e.textContent="K"}}') });
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer) });
    });
    const mdeck = C.w.buildDeck('title: T\n\n## M\n$x$');
    const emb = await C.w._embedMath(mdeck);
    t('H4: embed inlines css + fonts (data-URI) + js, drops the CDN lines',
      emb.ok && emb.fonts === 1
      && !/https:[^"']*katex/.test(emb.deck)
      && emb.deck.includes('data:font/woff2;base64,AQID')
      && emb.deck.includes('window.katex='));
    C.w._setFetch(() => Promise.resolve({ ok: false, status: 500 }));
    const emb2 = await C.w._embedMath(mdeck);
    t('H4: any fetch failure keeps the deck byte-identical with a reason',
      emb2.ok === false && emb2.deck === mdeck && emb2.why.length > 0);

    /* ── H5: raw .txt import; export is guarded ── */
    const f5 = new C.w.File(['title: TXT\n\n## Only\n- ok'], 'o.txt', { type: 'text/plain' });
    const impEl = C.w.document.querySelector('#imp');
    Object.defineProperty(impEl, 'files', { configurable: true, value: [f5] });
    impEl.dispatchEvent(new C.w.Event('change', { bubbles: true }));
    await tick(60);
    let expThrew = false;
    try { C.w.document.querySelector('#exp').click(); } catch (e) { expThrew = true; }
    t('H5: a raw .txt outline imports directly; export never throws',
      C.w.document.querySelector('#outline').value.startsWith('title: TXT') && !expThrew);

    /* ── H6: QR ── */
    const q1 = C.w._qrSvg('https://example.org/talk');
    const qd = C.w.buildDeck('title: T\nlink: https://example.org/talk\n\n## A\n- x');
    t('H6: link: → deterministic inline-SVG QR + visible URL; absent otherwise',
      q1.startsWith('<svg viewBox="0 0 ') && q1.includes('fill="currentColor"')
      && C.w._qrSvg('https://example.org/talk') === q1
      && qd.includes(q1) && qd.includes('>https://example.org/talk</p>')
      && !C.w.buildDeck('title: T\n\n## A\n- x').includes('aria-label="QR code"'));

    /* ── H9: theme key + select ── */
    t('H9: theme: sets the initial attribute; absent by default',
      C.w.buildDeck('title: T\ntheme: slate\n\n## A\n- x').includes('<html data-theme="slate" lang="en">')
      && !/<html data-theme=/.test(C.w.buildDeck('title: T\n\n## A\n- x')));
    C.w.document.querySelector('#outline').value = 'title: S\n\n## A\n- x';
    const sel9 = C.w.document.querySelector('#thSel');
    sel9.value = 'sepia';
    sel9.dispatchEvent(new C.w.Event('change', { bubbles: true }));
    t('H9: the select upserts the outline key through the undo-friendly path',
      C.w.document.querySelector('#outline').value.split('\n')[1] === 'theme: sepia'
      || C.w.document.querySelector('#outline').value.includes('theme: sepia'));

    /* ── v2.25: grammar v1 completions + outline marker ── */
    const g1 = C.w.buildDeck('title: T\n\n## A\n$$E = mc^2$$\n++ a dimming step\n+ a plain step');
    t('v1: $$…$$ is a numbered display equation; ++ is a dim step',
      g1.includes('<div class="math math--eq">E = mc^2</div>')
      && g1.includes('class="frag frag--dim">a dimming step')
      && g1.includes('class="frag">a plain step'));
    t('v1: outlines embed versioned; legacy unversioned still imports',
      g1.includes('lectern-outline:v1:')
      && C.w.extractOutline(g1) === 'title: T\n\n## A\n$$E = mc^2$$\n++ a dimming step\n+ a plain step'
      && C.w.extractOutline('<!--lectern-outline:' + C.w.document.defaultView.btoa('title: L') + '-->') === 'title: L');

    /* ── showcase fixture (if built) boots clean ── */
    if (fs.existsSync('showcase.html')) {
      const S2 = boot('https://localhost/showcase.html',
        fs.readFileSync('showcase.html', 'utf8'));
      await tick(60);
      const ss = S2.w.Lectern.state();
      t('showcase: boots clean, has appendix, refs, agenda',
        S2.scriptErrors.length === 0 && ss.tot > 10
        && S2.w.document.querySelector('.slide[data-backup]') !== null
        && S2.w.document.querySelector('#references') !== null
        && S2.w.document.querySelectorAll('#agenda .agenda a').length >= 2
        && S2.w.document.querySelector('#end svg[aria-label="QR code"]') !== null);
    }

    /* ── hostile import (launch kit): untrusted outlines stay inert ── */
    const evil2 = C.w.buildDeck([
      'title: <img src=x onerror=alert(1)>',
      'byline: </scr' + 'ipt><scr' + 'ipt>window.PWNED=1</scr' + 'ipt>',
      'authors: A"; window.PWNED=1; var x="',
      'link: javascript:alert(1)',
      '',
      '## Payloads',
      '![https://x/a.png" onerror="window.PWNED=1 | cap]',
    ].join('\n'));
    const vch = new VirtualConsole(); const hErrs = [];
    vch.on('jsdomError', (e) => { const m = String((e && e.message) || e);
      if (!/Could not parse CSS|Not implemented/i.test(m)) hErrs.push(m); });
    const HD = new JSDOM(evil2, { runScripts: 'dangerously',
      url: 'https://localhost/h.html', pretendToBeVisual: true, virtualConsole: vch });
    await tick(60);
    t('hostile: script-string splices cannot close the engine script',
      !evil2.includes('</scr' + 'ipt><scr' + 'ipt>window.PWNED')
      && evil2.includes('\\u003C/script')
      && hErrs.length === 0 && typeof HD.window.Lectern === 'object'
      && HD.window.PWNED === undefined);
    t('hostile: attribute breakouts and title HTML are neutralised',
      !/onerror="window\.PWNED/.test(evil2)
      && evil2.includes('src="https://x/a.png&quot; onerror=&quot;')
      && evil2.includes('&lt;img src=x onerror')
      && !evil2.includes('<a href="javascript:'));

    /* ── G9: ::fx directive ── */
    t('G9: ::fx slide lands as data-fx on the section',
      /id="a" data-fx="slide"/.test(C.w.buildDeck('title: T\n\n## A\n::fx slide\n- x')));
  }

  /* ── G0: strict render-proof gate (opt-in: SMOKE_STRICT=1) ── */
  if (process.env.SMOKE_STRICT) {
    const { execSync } = require('child_process');
    const run = (f) => { try { execSync(`node render-proof.js ${f} --strict`, { stdio: 'pipe' }); return true; } catch (e) { return false; } };
    t('G0 strict: every demo slide fits at real metrics', run(file));
    if (fs.existsSync('starter.html')) t('G0 strict: starter fits', run('starter.html'));
  }

  console.log(fails === 0 ? '\nall green' : `\n${fails} failing`);
  process.exit(fails);
})().catch((e) => { console.error(' FATAL', e); process.exit(99); });
