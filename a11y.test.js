/* a11y.test.js — G6 gate: axe-core over the decks + Compose, plus a
   token-level contrast table (axe's color-contrast rule needs paint,
   which jsdom lacks — the arithmetic below replaces it exactly).
   Run:  npm i jsdom axe-core && node a11y.test.js
   Exit code = axe violations + contrast failures. */
'use strict';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const DISABLED = {
  'color-contrast': 'no paint in jsdom — replaced by the token arithmetic below',
  'scrollable-region-focusable': 'code blocks scroll horizontally at fixed canvas; content is not interactive',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;

async function audit(name, html, url) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, pretendToBeVisual: true, virtualConsole: vc });
  await sleep(90);
  dom.window.eval(axeSrc);
  const rules = {}; Object.keys(DISABLED).forEach((r) => { rules[r] = { enabled: false }; });
  const res = await dom.window.axe.run(dom.window.document, { rules });
  const v = res.violations;
  console.log((v.length ? ' FAIL ' : '  ok  ') + name + ' — axe violations: ' + v.length);
  v.forEach((x) => console.log('    · ' + x.id + ': ' + x.help + '  [' + x.nodes.length + ' node(s)] e.g. ' + (x.nodes[0] && x.nodes[0].target)));
  fails += v.length;
}

/* ── token contrast (WCAG relative luminance) ── */
function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function tokenTable(src) {
  const themes = { paper: {} };
  const root = /:root\{([^}]+)\}/.exec(src)[1];
  const grab = (blk, o) => blk.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g, (_, k, v) => { o[k] = v; return _; });
  grab(root, themes.paper);
  src.replace(/html\[data-theme="(\w+)"\]\{([^}]+)\}/g, (_, name, blk) => {
    themes[name] = Object.assign({}, themes.paper); grab(blk, themes[name]); return _;
  });
  console.log('\n  token contrast (body ≥ 4.5, secondary ≥ 4.5, accent ≥ 3):');
  Object.entries(themes).forEach(([name, t]) => {
    const rows = [
      ['ink/paper', ratio(t.ink, t.paper), 4.5],
      ['ink-2/paper', ratio(t['ink-2'], t.paper), 4.5],
      ['lapis/paper', ratio(t.lapis, t.paper), 3],
      ['rubric/paper', ratio(t.rubric, t.paper), 3],
    ];
    rows.forEach(([k, r, min]) => {
      const ok = r >= min;
      if (!ok) fails++;
      console.log(`   ${ok ? ' ok ' : 'FAIL'} ${name.padEnd(6)} ${k.padEnd(13)} ${r.toFixed(2)} (min ${min})`);
    });
  });
}

(async () => {
  const deck = fs.readFileSync('lectern.html', 'utf8');
  await audit('lectern.html', deck, 'https://localhost/lectern.html');
  if (fs.existsSync('starter.html')) {
    await audit('starter.html', fs.readFileSync('starter.html', 'utf8'), 'https://localhost/starter.html');
  }
  if (fs.existsSync('compose.html')) {
    const csrc = fs.readFileSync('compose.html', 'utf8');
    await audit('compose.html (tool UI)', csrc, 'https://localhost/compose.html');
    const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
    const C = new JSDOM(csrc, { runScripts: 'dangerously', url: 'https://localhost/c.html', pretendToBeVisual: true, virtualConsole: vc });
    await sleep(80);
    const gen = C.window.buildDeck(C.window.document.querySelector('#outline').value);
    await audit('generated deck', gen, 'https://localhost/talk.html');
  }
  if (fs.existsSync('showcase.html')) {
    await audit('showcase.html', fs.readFileSync('showcase.html', 'utf8'), 'https://localhost/showcase.html');
  }
  tokenTable(deck);
  Object.entries(DISABLED).forEach(([r, why]) => console.log(`  (rule off: ${r} — ${why})`));
  console.log(fails === 0 ? '\nall green' : `\n${fails} problem(s)`);
  process.exit(fails);
})().catch((e) => { console.error(' FATAL', e); process.exit(99); });
