/* render-proof — headless visual verification for Lectern decks.
   Structural mode:  node render-proof.js deck.html out.html [--handout]
     Executes the deck's JS in jsdom, snapshots the live DOM (folios,
     agenda, hydrated attrs) as offline HTML for WeasyPrint.
   Strict mode:      node render-proof.js deck.html --strict
     G0: per-slide overflow truth. Requires the real fonts (STIX Two
     Text, Inter, JetBrains Mono — see LECTERN-DEVNOTES v2.5) and
     weasyprint + pdfinfo. Each slide is rendered ALONE with the
     overflow:hidden guards stripped, so content taller than the
     720px canvas fragments to an extra page — machine-detectable.
     A fits-slide yields exactly 2 pages (content + trailing break
     blank); more ⇒ overflow. Exit code = number of offenders.
     Metrics caveat: hinting differs from Chrome by up to ±1 line;
     treat a bare +1-page flag as a warning to confirm with D. */
'use strict';
const fs = require('fs');
const { execSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const args = process.argv.slice(2);
const inFile = args[0];
const strict = args.includes('--strict');
const handout = args.includes('--handout');
function flagVal(name, dflt) {
  const k = args.findIndex((a) => a === name || a.startsWith(name + '='));
  if (k < 0) return dflt;
  return args[k].includes('=') ? args[k].split('=')[1] : (args[k + 1] || dflt);
}
const only = (flagVal('--only', '') || '').split(',').map((x) => x.replace(/^#/, '').trim()).filter(Boolean);
const jobs = Math.max(1, +flagVal('--jobs', 4) || 4);
const outFile = args.find((a, i) => i > 0 && !a.startsWith('--')) || '/tmp/proof.html';

function snapshot(withGuards) {
  const html = fs.readFileSync(inFile, 'utf8');
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://localhost/deck.html' + (handout ? '?handout' : ''),
    pretendToBeVisual: true, virtualConsole: vc,
  });
  return new Promise((res) => setTimeout(() => {
    const d = dom.window.document;
    d.querySelectorAll('script, link[rel="stylesheet"], link[rel="preconnect"]').forEach((n) => n.remove());
    // WeasyPrint's parser stops after a raw <template>; lazy content prints blank anyway
    d.querySelectorAll('template, iframe').forEach((n) => {
      const ph = d.createElement('div');
      ph.setAttribute('style', 'flex:1;min-height:120px;background:#F6F8FA;border:1px dashed #9AA3AF');
      n.replaceWith(ph);
    });
    let out = '<!doctype html>\n' + d.documentElement.outerHTML;
    if (!withGuards) {
      // strip the clip guards so overflow becomes page fragmentation
      const g1 = 'box-shadow:0 4px 30px rgba(22,27,34,.08);overflow:hidden}';
      const g2 = '.slide{position:absolute;inset:0;overflow:hidden;';
      if (out.includes(g1)) out = out.replace(g1, 'box-shadow:0 4px 30px rgba(22,27,34,.08)}');
      else console.warn('warn: stage guard anchor not found — CSS drifted?');
      if (out.includes(g2)) out = out.replace(g2, '.slide{position:absolute;inset:0;');
      else console.warn('warn: slide guard anchor not found — CSS drifted?');
    }
    res({ out, dom });
  }, 60));
}

const { exec } = require('child_process');
function pages(pdf) {
  const t = execSync(`pdfinfo ${pdf}`, { encoding: 'utf8' });
  return +(/Pages:\s+(\d+)/.exec(t) || [0, 0])[1];
}
function weasy(html, pdf) {
  fs.writeFileSync('/tmp/rp.html', html);
  execSync(`python3 -m weasyprint /tmp/rp.html ${pdf} 2>/dev/null`);
}
function weasyJob(html, tag) {
  return new Promise((res, rej) => {
    const h = `/tmp/rp-${tag}.html`, p = `/tmp/rp-${tag}.pdf`;
    fs.writeFileSync(h, html);
    exec(`python3 -m weasyprint ${h} ${p} 2>/dev/null`, (err) => err ? rej(err) : res(pages(p)));
  });
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let k = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (k < items.length) { const i = k++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
function fontsPresent() {
  try {
    const t = execSync('fc-list', { encoding: 'utf8' });
    return ['STIX Two Text', 'Inter', 'JetBrains Mono']
      .filter((f) => !t.includes(f));
  } catch (e) { return ['(fc-list unavailable)']; }
}

(async () => {
  if (!strict) {
    const { out } = await snapshot(true);
    fs.writeFileSync(outFile, out);
    console.log('snapshot →', outFile);
    process.exit(0);
  }

  const missing = fontsPresent();
  if (missing.length) {
    console.log('strict: fonts missing (' + missing.join(', ') + ') — metrics would lie.');
    console.log('Downgrading to structural page-count check.');
    const { out } = await snapshot(true);
    weasy(out, '/tmp/rp.pdf');
    console.log('full deck pages:', pages('/tmp/rp.pdf'), '(structural only, exit 0)');
    process.exit(0);
  }

  const { out, dom } = await snapshot(false);
  const all = [...dom.window.document.querySelectorAll('#slides > section.slide')].map((s, i) => ({ id: s.id, i }));
  const targets = only.length ? all.filter((s) => only.includes(s.id)) : all;
  if (only.length && targets.length !== only.length) {
    console.warn('warn: --only names not found:', only.filter((o) => !all.some((s) => s.id === o)).join(', '));
  }
  console.log(`strict: ${targets.length} of ${all.length} slides, real fonts, ${jobs} job(s)…`);
  const bad = [];
  const results = await pool(targets, jobs, async (s) => {
    const iso = out.replace('</head>',
      `<style>.slide{display:none!important}#slides>section:nth-of-type(${s.i + 1}){display:block!important}</style></head>`);
    const p = await weasyJob(iso, s.i);
    return { ...s, spill: p - 2 };
  });
  results.forEach((r) => {
    process.stdout.write(r.spill > 0 ? 'X' : '.');
    if (r.spill > 0) bad.push({ n: String(r.i + 1).padStart(2, '0'), id: '#' + r.id, extra: r.spill });
  });
  process.stdout.write('\n');
  if (bad.length) {
    console.log('OVERFLOW — content fragments past the 720px canvas:');
    bad.forEach((b) => console.log(`  slide ${b.n} ${b.id} → +${b.extra} page${b.extra > 1 ? 's' : ''} of spill`));
    console.log('(+1 page can be ±1-line hinting drift — confirm with the D key in a browser)');
  } else {
    console.log('all slides fit ✓ (each isolated render = exactly content + break page)');
  }
  process.exit(bad.length);
})().catch((e) => { console.error('FATAL', e.message); process.exit(99); });
