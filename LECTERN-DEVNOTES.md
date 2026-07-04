# Lectern — Developer Notes

Living log for `lectern.html`. **Newest entry first.** Every change lands with an entry using the template at the bottom — decisions with their *why*, testing evidence, and handoff pointers. Companions: `LECTERN-SPEC.md` (contracts — read §1–§6 before coding), `smoke.test.js` (automated checks; extend it with every feature).

Status ledger: **v2.4** · fix: fragment links break inside srcdoc embeds · deck engine patched (both decks + Compose shell) · smoke 55/55.

---

## v2.4 — fix: in-deck links navigate away inside srcdoc embeds (2026-07-04)

**Bug (user screenshot).** Clicking an agenda/popover row in Compose's live preview replaced the preview with… Compose itself, nested. Root cause is a `srcdoc` URL-resolution rule: an `about:srcdoc` document's **base URL is its parent's**, so a plain `href="#foundations"` resolves to `compose.html#foundations` — a *different document* — and the iframe performs a full navigation instead of a fragment jump. This affected any srcdoc embedding of a deck, not just Compose; the README explicitly blesses iframe embedding, so the fix belongs in the engine.

**Fix (engine, both `lectern.html` and `starter.html`; Compose shell rebuilt).** A capture-phase document click handler routes every in-deck fragment link (`a[href^="#"]` whose target is a slide id) through `go()` with `preventDefault` — agenda, section popover, and hand-authored links all stop depending on native navigation. Capture phase matters: in overview, the thumbnail handler must win over a link *inside* the thumbnail, so the router only suppresses the default there — which also fixes a pre-existing latent bug where clicking an agenda row in overview jumped to the row's target instead of the clicked slide. `history.replaceState` on boot is now try-wrapped (srcdoc/sandboxed documents may reject cross-path URLs). Non-slide fragment anchors still fall through untouched.

**Testing.** smoke **55/55** — new: an agenda click is `defaultPrevented` and lands via `go()`; the same click during overview lands on the *thumbnail's* slide with overview closed. (jsdom cannot reproduce the navigation itself — it doesn't navigate on clicks — so the assertions pin the interception contract; the user's browser scenario is the integration check.) Deck build line unified to the release number: **v2.4** (deck builds v2.2–2.3 never existed; those releases were Compose-only).

---

## v2.3 — Compose: escape fix, picture paste, Chinese (2026-07-04)

**Fix — literal `\uXXXX` on screen.** `COMPOSE` in `build-compose.py` is a *raw* Python string (protects the JS regexes), so `\u00b7`-style escapes in the **HTML text** were never decoded — HTML doesn't interpret them, while identical escapes inside JS strings rendered fine, which is why only the chrome (header, pane titles, cheat line) showed raw `\u00b7`. Fixed by using real UTF-8 characters throughout, plus a build-time safety pass that decodes any `\uXXXX` that slips in (`assert '\\u' not in COMPOSE`) and a smoke assertion pinning it. Follow-up on the earlier suspicion: the `\n`-join worry was a false alarm caused by tool-output backslash escaping — python byte counts confirmed the joins were always real newlines. Lesson recorded: inside a raw template, `\uXXXX` is only alive in JS strings, dead in markup; write real characters and verify with byte-level checks, not shell greps.

**Picture paste.** Paste (Ctrl/⌘+V) or drag an image into the outline: Compose downscales it on a canvas (≤1600 px, white-matted JPEG q0.85, keeping the original if smaller), registers it as `pic-n`, and inserts `![pic-n | caption hint]` at the cursor. Grammar: `![name | caption]` on its own line → `<figure class="fig">` with a bordered, height-capped image and a `figcaption`. Missing assets render a rubric warning instead of a broken img. **No duplication for round-trips:** images live only in the slide markup, tagged `data-name`; `extractAssets()` rebuilds the asset map from a downloaded deck on Import, alongside the outline.

**Chinese.** One toggle (EN ⇄ 中文) localises the whole composer chrome, persists in localStorage, and swaps the sample outline if it is untouched. Deck-side language is the outline's own `lang: zh` key (falls back to the UI language): agenda becomes 目录/议程, the end slide 问答与讨论, agenda counts n 页 (spliced into the engine string), `<html lang="zh-CN">` is set, and `slug()` now keeps CJK characters so deep links like `#一个-html-文件` work. CJK font fallbacks (PingFang/YaHei) added to the composer stack; the deck's own stacks already end in generic families.

**Testing.** smoke **53/53** — adds: zero `\uXXXX` anywhere + real `·`/`→` in the live DOM; `setLang('zh')` flips chrome and sample; a `lang: zh` deck boots clean in jsdom with 议程/问答/zh-CN/CJK ids/页 counts; a pasted asset renders as a captioned figure, a missing one warns, and `extractAssets` round-trips exactly.

---

## v2.2 — Compose: speakers type text, get a deck (2026-07-04)

**Scope.** Lower the entry cost to zero markup: a speaker prepares only *what to say on each slide*, as plain text.

**`compose.html`.** Single file, offline, no install. Left pane: outline text (prefilled sample doubles as the tutorial). Right pane: live preview that is the *real* generated deck in an iframe — arrow keys, presenter, themes all work in place. Because the preview is the deck, the composer calls its `Lectern.state()` / `Lectern.check()` after each rebuild and shows per-slide **overflow warnings inline** ("slide 04 is 32px too tall — trim or split"), so the fixed-canvas discipline is enforced while typing, not discovered at the podium. Download produces a standalone deck; **Import deck** recovers the outline from a previously downloaded file for further editing.

**Grammar** (deliberately tiny): `key: value` header lines (title, subtitle, authors, venue, contact, short, byline) · `# Section` · `## Slide` · plain line = paragraph (first is the lead) · `- bullet`, `+ bullet` = fragment, two-space indent nests · `> note` · inline `**b**`, `*i*`, `` `code` ``, `$TeX$`. Agenda auto-inserts when ≥ 2 sections; ids are slugged and deduped against reserved names; the end slide comes from `contact:`.

**Round-tripping.** The outline is embedded in the downloaded deck as a base64 HTML comment (`lectern-outline:…`) — the deck stays the single source of truth for both forms.

**`build-compose.py`.** Committed generator: carves the shell out of `lectern.html` (slides → marker, DECK/title → placeholders) and embeds it **base64** in compose — sidestepping every `</script>`-in-string escaping trap. Re-run it after any deck change to keep Compose in sync.

**Two bugs the tests caught — record for future splicers.**
1. `String.replace('</body>', …)` hits the *first* occurrence — which lives inside the presenter template string in the engine, so the outline comment was spliced mid-script (SyntaxError). The engine legitimately contains `</body>`/`</html>` inside strings: anchor structural splices on unique markers or `lastIndexOf`.
2. `String.replace` treats `$&`/`$'` in the *replacement* specially — speaker text like a title containing `$&` corrupted the shell. All placeholder splices now use `split(mark).join(value)`.

**Testing.** smoke **48/48** — compose boots, exact outline round-trip, no placeholder leaks, adversarial `$`-and-quote text survives, and the generated deck itself boots in a nested jsdom (8 slides, 2 agenda rows, 3 frags, 1 math). Render proof of a generated talk: 8 + 1 trailing-blank pages, section map `title · agenda · §1×3 · §2×3 · end` confirmed by page-text extraction.

---

## v2.1 — polish, starter template, render proof (2026-07-04)

**Scope.** The three v2.0 handoff items plus first *visual* verification.

**Fragment-aware progress bar.** `pbarUp()` replaces the inline width write: `width = (i + (frag+2)/(frags+1)) / N`. One formula covers both cases — with no fragments it reduces exactly to the old `(i+1)/N`; with fragments the bar interpolates per reveal and completes on the last step. Called from `go()` and from announced `setFrag`.

**`Lectern.state()`.** Pull access for external controllers (and anything F2-like built later): `{i, id, n, tot, frag, frags, sections:[{n,t,id}]}`. Late subscribers no longer need to wait for the next `'slide'` event.

**`starter.html`.** The deck with the 15 demo slides swapped for a 5-slide skeleton (title · auto-agenda · section divider · annotated content slide with a frag + inline math · end) and generic `DECK` config. Same engine byte-for-byte otherwise. Smoke boots it when present (5 slides, 1 agenda section, clean console).

**`render-proof.js` — the deck becomes visible to headless agents.** Pipeline: jsdom executes the engine (folios, agenda, runheads are JS-hydrated) → serialize the live DOM, stripping scripts/external links and replacing `<template>`/`<iframe>` with placeholder boxes → WeasyPrint typesets the print stylesheet → poppler rasterizes pages. Findings this run: 15 + 1 trailing blank pages (the final `page-break-after`; harmless), handout 30 + 1; agenda rows, two-column key grid, environments, chart/table, section runheads and both folio styles all visually confirmed. **Two WeasyPrint traps recorded:** (1) its parser stops laying out the document after a raw `<template>` — hence the placeholder swap; (2) `aspect-ratio` and `box-shadow` are unsupported, and fonts fall back to DejaVu, so this proof validates *structure and pagination*, not pixel budgets — the D-walk in a real browser remains the authority on overflow.

**Testing.** smoke.test.js **43/43** (adds: pbar interpolates and hits `40%` = (5+1)/15 after the last reveal on `#writing`; `state()` field check; starter boot) · statics ✓ · render proof ✓ both variants.

**Size.** 1184 → 1191 lines · 70.4 → 70.8 KB. `starter.html` 969 lines / 54.8 KB.

---

## v2.0 — F1–F9 · full roadmap (2026-07-04)

**Scope.** SPEC §7·F1–F9 in one integrated release on top of v1.2. Deck grows to **15 slides** (auto-agenda inserted as 02); all folio comments renumbered; smoke tests refactored to be **id-driven** so future slide inserts don't invalidate them.

**F1 fragments.** `applyFrag` runs *inside* `go()` before `is-current` lands — no flash of stale reveal state. Reveal is visibility/opacity/transform only (invariant 3). Arrival policy: stepping forward = hidden, stepping back = revealed, **any jump (hash, overview, Home/End, PgUp/PgDn) = fully revealed** — shared deep links always show the finished slide. `'slide'` payload now carries `{frag,frags}`; in-slide reveals emit with `step:true`. Demo: three steps on `#writing`, `frag--dim` on the first (a last-step dim can never trigger — caught by the test run).

**F2 presenter + blackout.** Popup is `about:blank` + `document.write` + direct `opener` references — works on `file://` where BroadcastChannel does not. Preview iframes are progressive: a 1.5 s probe adds `noprev` when the engine blocks same-file iframes; the timer/notes/next core stands alone. Blocked popup ⇒ `console.warn`, deck unaffected. Any key lifts the blackout, then still performs its action. Slide-14 key table rebuilt as a two-column grid (capacity for the full map). Popup CSS mirrors slate token hexes — the one sanctioned duplication (separate document can't read deck vars).

**F3 math.** Explicit `.math` elements only — no document-wide delimiter scanning. Unrendered fallback is a legible mono chip; `[data-mathed]` guards re-render. Renders lazily in `load(i)`, again on window `load` (deferred KaTeX lands late), and `beforeprint` now `load()`s **every** slide — which also closes the old "unvisited iframes print empty" gap. `math--eq` numbering is a pure-CSS counter (`def thm eq`), so it works with KaTeX deleted.

**F4 agenda + popover.** Sections are captured during the existing metadata pass (`SECTIONS`). Agenda rows and the popover are plain `<a href="#id">` — navigation rides the existing hashchange path, zero new nav code. The running head is now a real `<button>` (aria-expanded); Esc precedence: search → popover → overview.

**F5 search.** Index `{title, raw, lowercased}` built once at init. The input reuses the global key-guard (focused input ⇒ deck keys ignored), so ↑↓/Enter are handled by the field's own listener; result rows jump on `mousedown` so the input's blur can't swallow the click.

**F6 media.** `video/audio[data-src]` promote exactly like iframes; `go()` pauses everything in the slide being left (try-guarded). `.frame` / `.frame--fill` selectors extended to `video` (+`object-fit:contain`). No bundled asset — the smoke test injects a fixture.

**F7 ink & laser.** Canvas lives **inside the stage**, so it inherits the scale transform: strokes are stored in 1280×720 design space and pointer coords divide by `rect.width/W` (rect cached in `fit()`); backing store is DPR-scaled. `pointer-events` only while armed — content clicks are swallowed mid-draw; the swipe seeder bails when ink is armed. No 2D context (jsdom, exotic engines) ⇒ the whole feature is a silent no-op. Strokes are per-slide, session-only (invariant 8).

**F8 themes.** Token-only overrides (`slate`, `sepia`) + one new token `--lapis-2` for wireframe tints. Slide-08 chart and the wireframe mocks moved from hex attributes to `style="…var(--…)"`. A 3-line pre-paint script in `<head>` applies the persisted theme (documented exception to the one-script rule — prevents a light flash). Print pins the paper tokens for both `:root` and `[data-theme]`. Ink repaints on theme change (colors are read from tokens at paint time).

**F9 handout.** `?handout` interleaves `.hand` siblings after each slide — DOM order gives print order for free; a different class keeps `measure()`, overview and slide folios untouched (`display:none` on screen). Notes pages carry their own runhead + "n · notes" folio via data attributes (invariant 6 respected: `.slide` pseudo-elements untouched).

**Testing.** `node --check` ×3 inline scripts ✓ · html5lib ✓ (extractor now strips HTML comments first — the quick-start text legitimately contains `<script>`) · **smoke.test.js 40/40** across two jsdom instances (normal + `?handout`). Browser ritual still owed by a human: D-walk all 15 (badge *fits ✓*), print normal + handout, presenter popup in Chrome/Firefox from `file://`, theme contrast eyeball, ink under a real pointer.

**Size.** 744 → 1184 lines · 44.3 → **70.4 KB**.

**Handoff.** Roadmap complete. Candidate next steps live in SPEC §9's margins: progress-bar fragment interpolation (cut as YAGNI), `Lectern.state()` getter if an external controller ever needs pull access, per-slide transition variants.

---

## v1.2 — F0 · engine event hooks (2026-07-03)

**Scope.** SPEC §7·F0. One shared notification point so F1/F2/F4/F5/F7 don't each patch `go()`.

**Changed (anchors).**
- Engine, after the `document.fonts.ready` line: new banner block `event hooks (F0)` — `hooks{}`, `on(ev,fn)→fn`, `off(ev,fn)`, `emit(ev,data)`.
- End of `go()`: `emit('slide',{i,id,el})` as the last statement.
- `overview()`: emits `'overview' {on}`; **param renamed `on`→`state`**.
- `window.Lectern` gains `on`, `off`.
- Quick-start comment: JS API section + `Build v1.2` pointer to this file.

**Decisions.**
1. *Emit at the very end of `go()`*, after class/counter/progress/lazy-load/hash have all settled — listeners always observe a coherent, final state (F2's presenter popup depends on this). Satisfies the spec's "after the runhead update" wording; treat end-of-`go()` as the contract from now on.
2. *Per-listener `try/catch` in `emit`* — a broken feature module must never kill navigation. Failures surface as `console.error('Lectern hook "<ev>":', err)`; smoke test asserts both the isolation and the report.
3. *`off()` added beyond the spec minimum* — F2's popup teardown (`beforeunload`) needs it; `on()` returns the fn so `var h=Lectern.on(...); Lectern.off('slide',h)` is ergonomic.
4. *`overview(on)` param renamed to `state`* — the old name now shadows the global `on()`; anyone editing inside `overview()` later would grab the wrong symbol. Callers unaffected (positional boolean/undefined).
5. *Payload contract is open for extension.* `'slide'` = `{i (0-based), id, el (live node)}`; `'overview'` = `{on}`. Listeners MUST tolerate extra fields — F1 will add fragment info to `'slide'`.
6. *Boot emits once* (initial `go(idx())` flows through the same path). Late subscribers (F2 popup opened mid-talk) should pull state directly rather than wait for the next event; F2 should add a `Lectern.state()` getter in its own change if needed — deliberately not added now.

**Testing.** `node --check` ×2 ✓ · `html5lib` parse ✓ · `smoke.test.js` **15/15** ✓ (jsdom 29): boot state, emit payloads, no-op nav emits nothing, throw-isolation + error report, `off()`, overview events, plus engine regressions (template→sandboxed `srcdoc` hydration, `check()` shape, `hashchange` nav). SPEC §6 browser steps 3–4 (D-walk, print, overview eyeball): **no visual delta in F0** — re-run at the next visual change.

**Size.** 727 → 744 lines · 44.4 → 44.3 KB (gzip-irrelevant; raw grew ~0.9 KB).

**Handoff → F1.** Subscribe with `on('slide', …)` to reset per-slide fragment state; extend the `'slide'` payload rather than adding a new event; put key interception in the existing `switch` *before* the `next()/prev()` calls (cases `ArrowRight/ArrowDown/' '` and `ArrowLeft/ArrowUp`); PgUp/PgDn stay slide-level. Reveal via visibility/opacity/transform only (SPEC invariant 3) or `Lectern.check()`/D lies. Add a `frag` section to `smoke.test.js` (jsdom can assert class/aria flips even though it doesn't paint).

---

## v1.1 — overflow fixes + author aid "D" (2026-07-03)

**Scope.** Bug report: clipped text on slides "2" and 9 (screenshot of 9). Root cause: the canvas is a hard 1280×720 (content box 548px tall — SPEC §4) and three slides exceeded it: **04** layout catalogue (~60px over — this was the reported "slide 2"), **09** frames (~120px), **10** inner pages (~90px, right column). Diagnosis by arithmetic budget audit of all 14 slides.

**Changed.**
- Clip guards: `.stage` and `.slide` get `overflow:hidden` — worst case is now hidden text, never text painted outside the deck. Chrome already sits at `z-index:5` above any spill.
- New component `frame--fill` (`align-self:stretch` + flex column; iframe `flex:1`) — a frame stretches to its column instead of forcing an aspect; `--ratio` remains for fixed aspects. Slides 09/10 rebuilt around it; slide 11 already used the class name.
- Slide 04: `h-compact`, wireframe cards `aspect-ratio:2.15/1`, row gap 26→22.
- Density: `pre.code` line-height 1.6→1.55, padding 16/20→13/18; `.key` rows 11px→8px (made room for the new D row on slide 13).
- **Author aid (press D)**: `measure()` diffs `scrollHeight−clientHeight` for *every* slide; badge on the current slide ("overflows by Npx" / "fits ✓ · n others overflow"), dashed line at the content budget, `console.table` of offenders on toggle, re-audit on `document.fonts.ready`. Public: `Lectern.check()`.

**Decisions.**
1. Measuring all slides at any time works **only because hidden slides use `visibility:hidden`, not `display:none`** — elevated to SPEC invariant 3; do not regress it.
2. Dev pseudo-element lives on `.slide.is-current::after` **inside `@media screen{}`** — print owns `.slide::before/::after` for runheads/folios (SPEC invariant 6); an unguarded screen rule would have overridden PDF folios.
3. Badge follows the hide-everywhere pattern (overview + print) — now SPEC invariant 7.

**Testing.** node --check ×2 ✓ · html5lib ✓ · budgets recomputed for all 14 slides (worst remaining slack ≈ 7px on slide 13 left column — fine, geometry is deterministic at fixed canvas).

---

## v1.0 — initial build (2026-07-03)

Single-file academic deck: 14 self-documenting slides; tokens (paper/ink/lapis/rubric…, STIX Two Text + Inter + JetBrains Mono); journal chrome with auto section runheads; layouts (title/section/cols/canvas/end); numbered Definition/Theorem/Note via CSS counters; booktabs tables; footnotes; speaker notes (N); lazy `iframe[data-src]`; inner pages via `template[data-page]` → sandboxed `srcdoc`; deep links per slide id; overview (O); fullscreen (F); touch swipe; print = one pre-sized 1280×720 page per slide with generated runhead/folio. Foundational choice: fixed design canvas scaled by transform + always-laid-out slides — everything else (audit, overview thumbnails, print) leans on it.

---

## Conventions

**Entry template** (prepend above the newest entry):

```
## vX.Y — <Fn · name | fix: title> (YYYY-MM-DD)
**Scope.** SPEC §… / bug: …
**Changed (anchors).** …
**Decisions.** numbered, each with the *why*
**Testing.** ritual results + tests added to smoke.test.js
**Size.** lines/KB before → after
**Handoff → next.** …
```

Version bumps: minor per feature/fix batch; also update the `Build vX.Y` line in the deck's quick-start comment and the status ledger above.

**Check commands** (SPEC §6 steps 1–2 automated; 3–4 are browser eyeballs):

```
npm i jsdom                       # once
node smoke.test.js lectern.html   # engine + hooks; exit code = failures

python3 - <<'PY'                  # syntax + parse
import re,subprocess,html5lib
raw=open('lectern.html').read()
for i,sc in enumerate(re.findall(r'<script>(.*?)</script>',raw,re.S)):
    open(f'/tmp/s{i}.js','w').write(sc)
    assert subprocess.run(['node','--check',f'/tmp/s{i}.js']).returncode==0,i
html5lib.parse(raw);print('static OK')
PY
```

Browser: open the file → press **D** → arrow through all slides (badge must say *fits ✓* everywhere) → Ctrl/Cmd+P preview (runhead+folio on every page, no feature chrome) → **O** (no feature chrome in the grid).
