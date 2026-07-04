/* render-proof — executes the deck's JS in jsdom, serializes the live DOM
   (folios, agenda, hydrated attrs), and writes an offline HTML snapshot
   that WeasyPrint can typeset with the print stylesheet.
   Usage: node render-proof.js lectern.html out.html [--handout] */
'use strict';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const [,, inFile, outFile, flag] = process.argv;
const html = fs.readFileSync(inFile, 'utf8');
const vc = new VirtualConsole();
vc.on('jsdomError', () => {});
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://localhost/deck.html' + (flag === '--handout' ? '?handout' : ''),
  pretendToBeVisual: true, virtualConsole: vc,
});
setTimeout(() => {
  const d = dom.window.document;
  // offline + static: scripts have run, external fetches must not happen
  d.querySelectorAll('script, link[rel="stylesheet"], link[rel="preconnect"]').forEach(n => n.remove());
  // WeasyPrint's parser stops laying out after a <template>; print shows lazy
  // content blank anyway, so swap templates + iframes for placeholder boxes
  d.querySelectorAll('template, iframe').forEach(n => {
    const ph = d.createElement('div');
    ph.setAttribute('style', 'flex:1;min-height:120px;background:#F6F8FA;border:1px dashed #9AA3AF');
    n.replaceWith(ph);
  });
  fs.writeFileSync(outFile, '<!doctype html>\n' + d.documentElement.outerHTML);
  console.log('snapshot →', outFile);
  process.exit(0);
}, 60);
