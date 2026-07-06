/* scale-probe — build + drive a 120-slide deck; informative timings, no gates.
   Run: node scale-probe.js   (needs jsdom; excluded from CI by design) */
'use strict';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const t0 = () => process.hrtime.bigint();
const ms = (a, b) => Number(b - a) / 1e6;

let o = 'title: Scale Probe\ntime: 60m\n\n';
for (let s = 1; s <= 9; s++) {   /* 9 sections exercises the two-column agenda */
  o += `# Part ${s}\n`;
  for (let k = 1; k <= 14; k++) {
    o += `## Part ${s} slide ${k}\nLead line for ${s}.${k}.\n`;
    for (let b = 1; b <= 4; b++) o += `- point ${b} with a little wrapping text\n`;
    o += `+ a revealed step\n> note ${s}.${k}\n`;
  }
}
const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const C = new JSDOM(fs.readFileSync('compose.html', 'utf8'),
  { runScripts: 'dangerously', url: 'https://localhost/c.html', pretendToBeVisual: true, virtualConsole: vc });
setTimeout(() => {
  let a = t0(); const deck = C.window.buildDeck(o); let b = t0();
  console.log('buildDeck (120 slides + agenda):', ms(a, b).toFixed(1), 'ms ·', Math.round(deck.length / 1024), 'KB');
  a = t0();
  const D = new JSDOM(deck, { runScripts: 'dangerously', url: 'https://localhost/big.html', pretendToBeVisual: true, virtualConsole: vc });
  setTimeout(() => {
    b = t0(); console.log('boot:', ms(a, b).toFixed(1), 'ms');
    const w = D.window;
    a = t0(); w.Lectern.check(); b = t0();
    console.log('check() all slides:', ms(a, b).toFixed(1), 'ms');
    a = t0(); for (let i = 0; i < 140; i++) w.Lectern.next(); b = t0();
    console.log('next() ×140 (incl. fragments):', ms(a, b).toFixed(1), 'ms ·', (ms(a, b) / 140).toFixed(2), 'ms/step');
    a = t0();
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }));
    const fin = w.document.querySelector('#findIn');
    fin.value = 'slide 11'; fin.dispatchEvent(new w.Event('input', { bubbles: true }));
    b = t0();
    console.log('search open+query over 137 slides:', ms(a, b).toFixed(1), 'ms ·',
      w.document.querySelectorAll('#findRs li[data-i]').length, 'hits');
    a = t0(); w.Lectern.overview(true); w.Lectern.overview(false); b = t0();
    console.log('overview toggle:', ms(a, b).toFixed(1), 'ms');
    fs.writeFileSync('/tmp/big.html', deck);
    console.log('deck written to /tmp/big.html — strict: node render-proof.js /tmp/big.html --strict --jobs=6');
    process.exit(0);
  }, 400);
}, 80);
