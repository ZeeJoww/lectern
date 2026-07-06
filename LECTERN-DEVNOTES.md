# Lectern — Developer Notes

Living log for `lectern.html`. **Newest entry first.** Every change lands with an entry using the template at the bottom — decisions with their *why*, testing evidence, and handoff pointers. Companions: `LECTERN-SPEC.md` (contracts — read §1–§6 before coding), `smoke.test.js` (automated checks; extend it with every feature).

Status ledger: **v2.25** · release-ready: grammar v1 canonical (`GRAMMAR.md`), showcase deck, repo pack (LICENSE · CI · `package.json` · `statics.py`), scale probed to 137 slides · smoke 97/97 (+2 gated) · a11y ×5 · strict ×3 · deck Build v2.25.

Roadmap 3 issued 2026-07-05 → `LECTERN-ROADMAP-3.md`. **All ten items shipped: H0–H9 (v2.15–v2.24).**

## v2.25 — release packaging: grammar v1, showcase, repo, scale (2026-07-05)

**Grammar v1 canonical.** `GRAMMAR.md` is now the single reference (header keys, structure, in-slide table, tables, citations, media, reserved words, the append-only promise). Two completions close the last HTML-only gaps a canonical v1 could not honestly freeze: `$$TeX$$` on its own line → a numbered display equation (escaped only — inline formatting must never mangle TeX), and `++ text` → a fragment that dims once passed. Downloaded decks now embed `lectern-outline:v1:…`; Import reads any `v<n>:` and the legacy unversioned form — the ten lines that make future grammar eras distinguishable.

**Showcase.** `showcase.outline.txt` → `showcase.html` (via Compose, PIL-drawn figure inlined): 13 slides exercising *every* construct — columns+fill, booktabs, citations+auto-references, `$$eq$$`, `+`/`++`, `::fx`, `::compact`-free but budgeted `@Xm`, a `::backup` section, `link:` QR. Zero lints, strict-fits first try; wired as a boot fixture in smoke and a fifth a11y target; `npm run strict` covers it.

**Repo pack.** `LICENSE` (MIT, vendor note) · `.github/workflows/ci.yml` running the whole ladder on Ubuntu (apt fonts + pinned STIX v2.0.2 from the upstream archive via codeload; weasyprint; `statics → gated smoke → a11y → strict`) plus a Pages deploy on main · `package.json` with the ladder as npm scripts and pinned devDeps · `statics.py` formalising rung 2 · `.gitignore`. The whole tree ships as `lectern-repo.zip`.

**Scale probe — and the bug it caught.** `scale-probe.js` drives a 120-content-slide deck: build 6.5 ms, `check()` 0.4 ms, navigation 1.8 ms/step, search 5 ms across 137 slides, overview toggle 3 ms — no quadratic anywhere. But strict flagged **the agenda itself**: at 6 sections its rows (19 px padding, 27 px serif) exceed the canvas — my original "≤6 fits" budget was knife-edge arithmetic that real fonts push over. Fix in the engine: `agenda--dense` past 5 sections, `agenda--cols` (two columns, break-inside avoid) past 8; probe hardened to 9 sections to exercise the column path; demo/showcase agendas re-verified. Deck → Build v2.25. Exactly the class of bug the probe existed to find — plus a recurring pitfall re-noted: `cmd | tail; echo $?` reports tail's exit, not cmd's.

**Safari watchlist.** MANUAL-QA gains a WebKit matrix (inert+VoiceOver, `file://` popup/localStorage, iOS PointerEvents for ink, fixed-position veil, Print-Backgrounds default, `beforeprint`, download-attribute on iOS) — the deck has never met Safari; the list makes the first encounter targeted.

**Testing.** smoke 97/97 (+2 gated) · a11y ×5 clean · strict green on demo/starter/showcase and the 137-slide probe deck.

---

Roadmap 2 issued 2026-07-04 → `LECTERN-ROADMAP-2.md`. **All ten items shipped: G0–G2 (v2.5–2.7), G3–G9 (v2.8–2.14).**

## v2.15–v2.24 — Roadmap-3 in one integrated release (2026-07-05)

**v2.15 · H0 overview keyboard.** A roving `.is-sel` ring (one selection, not fifteen tab stops): ←→ move ±1, ↑↓ move by *row* via `offsetTop` geometry (flat geometry — jsdom — falls back to ±1, as designed), Home/End bound the ring, Enter commits and closes, the announcer narrates each move. Enter on a focused button/anchor never double-fires.

**v2.16 · H1 backups.** `# Title ::backup` → the divider carries `data-backup`; the engine treats *everything from the first backup slide on* as appendix. `Nmain` detection uses `hasAttribute` (order-independent — bug 1 below); folios become `A1…` with `tot = Nmain`; the progress bar clamps; `End` stops at the last main slide while PgDn still crosses (the designed escape hatch); the agenda excludes appendix sections, the popover keeps them under a hairline, muted; `time:` spreads over main slides only; a lint fires if a normal `#` follows a backup one.

**v2.17 · H2 rehearsal.** Presenter **● rec** logs slide transitions; stopping stores the run (last 3) under `localStorage['lectern-runs:<title>']` — R6: nothing leaves the machine, nothing enters the deck file. The report formatter lives in the **engine** as `Lectern._report(marks, endMs)` so it is jsdom-testable and the popup stays thin: `04  #frames  2:10  / plan 3:00  −0:50`, plus totals and copy-report.

**v2.18 · H3 archiver.** The lint block gains **Archive/归档**: each external image is fetched through a seam (`_setFetch` for tests), pushed through the shared blob pipeline (now with a 300 ms decode-timeout fallback so environments without an image decoder keep the raw bytes), registered as `pic-n`, and its outline token rewritten through the undo-preserving path. Per-URL honesty: CORS/HTTP failures are named and their tokens untouched. Videos stay excluded.

**v2.19 · H4 math embed.** Download option: fetch the pinned KaTeX css+js, inline **the referenced woff2 fonts as data-URIs** (the part that makes "offline" true), splice out the CDN lines. Two hard guards: any fetch failure returns the deck byte-identical with a reason; a `</script` literal in the renderer source aborts rather than escapes-and-hopes (invariant 10).

**v2.20 · H5.** Export outline as `<slug>.outline.txt`; Import accepts raw `.txt` outlines directly. Markdown auto-convert stays deferred per the roadmap.

**v2.21 · H7.** `_pv()` gains `nextStep {k,K,text}` — the truthful answer to "what does → do next" — and `backup`; the presenter's next pane and position line render both. Last deck-touching release ⇒ deck Build v2.21.

**v2.22 · H6 QR.** `link:` → deterministic inline-SVG QR (error-correction M, `currentColor`, crispEdges) + the visible URL beneath it on the end slide. Encoder vendored per R7: `vendor-qrcode.js` (qrcode-generator v2.0.4, MIT, provenance header) embedded in Compose at build time — the **deck** receives only path data.

**v2.23 · H9.** Download-options row: the H4 checkbox plus a theme select that upserts a `theme:` outline key; Compose splices `data-theme` onto `<html>` statically, and the pre-paint script only overrides on a stored viewer preference — initial theming with zero engine change, exactly as planned.

**v2.24 · H8.** `render-proof --only=id[,id]` for single-slide iteration and `--jobs N` (pooled WeasyPrint spawns; the 15-slide strict pass drops well under 10 s). `MANUAL-QA.md` committed: the ~5-minute checklist of everything the ladder cannot see; release entries should name the lines run.

**Bugs the tests caught — three lessons for the file.**
1. *Order beats intent:* the backup/pacing block was anchored **before** the metadata loop, so `dataset.backup` (loop-written) read falsy and the A-folios were clobbered by the loop's own numbering. Fix: `hasAttribute('data-backup')` (markup-time truth) for `Nmain`, and the folio pass relocated after the loop. When a block reads what another block writes, the anchor comment must say so.
2. *Class namespaces:* the overview ring reused `is-sel`, which the search results already used — a "no `.is-sel` anywhere" assertion failed on a leftover search row. Tests now use scoped selectors; flagged as naming hygiene for future shared state classes.
3. *Vendored code shifts baselines:* the "no `\uXXXX` escapes" check began matching legitimate escapes inside the embedded QR library; the assertion now scopes to markup only. Every vendor drop should re-ask which global assertions it invalidates.

**Testing.** smoke **94/94** (+2 strict-gated) · a11y green ×4 · strict green on both decks with `--jobs 4` · an appendix fixture boots, folios, paginates and paces exactly as specced. Compose is 173 KB (QR lib + features; R4 caps decks, not tools — generated text decks remain ~55 KB).

---

## v2.8–v2.14 — Roadmap-2 P1+P2 in one integrated release (2026-07-05)

**v2.8 · G3 columns & placed figures.** A line containing only `|` splits a slide's body into `.cols`; one split per slide by design. Figures gained a third field — `![name | caption | fill]` — where a *lone* fill figure in a cell stretches to the column (`align-self:stretch`, `object-fit:contain`; the 420 px height cap lifts in fill mode). `left/right/full` parse as reserved no-ops (R2). Figures are now numbered per deck: `<b>Figure n</b> — caption` (图 n in zh) — a G3 side-benefit that made pasted images cite-able.

**v2.9 · G4 tables.** Contiguous `|`-lines form a `.tbl` booktabs table; a `|---|---:|` row after the first marks the header and right-aligns `:`-suffixed columns via the deck's existing `.num` class; `|= caption` becomes the numbered `<caption><b>Table n</b> — …</caption>` (表 n). Cells run through `fmt()`, so math-in-cells works. No spans — rejected in the roadmap, unchanged here.

**v2.10 · G5 citations.** Header block gains a multi-line `refs:` key (indented `key: formatted citation` lines; dedent ends the block — blank lines don't). Inline `[@key]` numbers by first use and renders `<sup class="cite">[n]</sup>`; unknown keys show `[?key]` in rubric, same philosophy as missing images. If any citation fired and the author didn't write a References/参考文献 slide, one is appended before `end` (`ol.refs`, two CSS columns past six entries). Deliberately not BibTeX: speakers paste formatted strings.

**v2.11 · G6 accessibility.** The big one is `inert`: hidden slides were keyboard-reachable (agenda links inside invisible slides — axe's `aria-hidden-focus` in waiting). `setInert()` now runs on every `go()` and overview toggle — overview must *lift* inert or thumbnails stop receiving clicks entirely. Plus: a visually-hidden `aria-live` announcer ("04 / 15 · Title" — numerals + title, deliberately language-neutral), the section popover opens focused with ↑↓ traversal and Escape-returns-to-trigger (global keys guard `#toc`), and Tab is contained in the search dialog. New gate: `a11y.test.js` — axe-core in jsdom over demo/starter/Compose/generated (two rules off with written justifications) plus a WCAG contrast table computed from the token blocks; all twelve theme pairs clear with margin.

**v2.12 · G7 pacing.** Outline: `time: 25m` plus optional `## Title @4m` (suffix stripped from the title); explicit budgets keep theirs, the remainder spreads over unbudgeted content slides. Budgets land as `data-min`; the engine precomputes cumulative targets and `_pv()` gains `plan/slideMin/planTot` (all `null` when unplanned — zero cost). The presenter shows `plan 12:00 · +1:30 behind`, rubric past two minutes. Informs, never advances.

**v2.13 · G8 external media + honest size.** `![https://… | cap]` renders an external `<img>` (no `data-name`, so Import doesn't pretend it's an asset); `!video[url | cap]` reuses the lazy `frame`+`video[data-src]` path. Both push a persistent lint: *external asset — no longer self-contained* (外部资源…). The status bar now always shows the generated size; past 8 MB it goes rubric with an email hint. Data-URL video stays rejected.

**v2.14 · G9 transitions.** `::fx slide` → `data-fx="slide"`: the base fade's translateY simply becomes translateX(28 px); `::fx none` kills the transition. Pure CSS + attribute — no engine change; print pins `transform:none !important`; overview/reduced-motion already win by cascade order.

**Testing.** smoke 75/75 (+2 strict-gated) — fifteen new assertions including a booted `time:`-budgeted deck asserting `plan === 240` at slide entry and the inert/announcer/popover keyboard contracts. `a11y.test.js` green ×4. **Strict render-proof green on both decks after all deck edits** — the ladder's promise held: no human browser pass was needed to trust this release. Two test-side lessons: dispatch Escape at the *focused element* (browsers do; window-dispatch skips focus-scoped handlers), and never index-compare against the first `<div` of a full document.

---

## v2.7 — G2 · one-click overflow fixes (2026-07-04)

## v2.7 — G2 · one-click overflow fixes (2026-07-04)

**Grammar.** Per-slide directive lines `::word [args]` (R2-safe sigil). `::compact` → `h-compact`; **unknown directives parse and are ignored** — future words (`::fx`, G9) won't break old Compose builds. Fixture pinned in smoke.

**Chips.** Every overflow warning row gains **Split** / **Compact** (拆分 / 紧凑). Both are plain text edits to the outline — visible and undoable (`execCommand('insertText')` over a select-all keeps the browser undo stack; jsdom/fallback path assigns `.value`). Split moves the trailing ⌈half⌉ of the slide's *content* lines (notes `>` and directives `::` stay with part one) into a new `## Title — cont.` / `（续）` block inserted after; convergent because the chip persists while the audit still flags. Compact inserts `::compact` under the heading, idempotently. Block bounds come from the G1 provenance map, refreshed from the live textarea before each fix.

**Testing.** smoke: directive rendering + unknown-directive tolerance; Compact inserts once; Split produces a `-cont` slide that builds, keeps notes and the directive on part one.

## v2.6 — G1 · outline ⇄ preview sync (2026-07-04)

**Provenance.** The parser records the source line of every `#`/`##`; `buildDeck` emits `MAP = [{i, id, start, src}]` (title = line 0; agenda/end are `src:false` so the caret never resolves to them). Exposed as `_map()` / `_caretIndex()` for tests and G2.

**Caret → slide.** `keyup`/`click` (150 ms debounce) resolve the caret line to its block and `Lectern.go()` the preview. **Slide → outline:** a `'slide'` listener attached after every rebuild scrolls the textarea (scrollTop only — *never* the caret or focus) when the change originated in the preview; the loop guard is simply "textarea focused ⇒ skip". **Rebuilds keep place:** previously every keystroke reset the preview to slide 1 (a real pre-existing wart); now the caret's block wins while typing, `lastPvId` otherwise.

**Testing.** Mapping + caret resolution asserted on the sample fixture; live-iframe behaviour is a browser check (jsdom doesn't run srcdoc navigation reliably).

## v2.5 — G0 · strict render-proof + three real overflows fixed (2026-07-04)

**Fonts.** Inter + JetBrains Mono via apt; **STIX Two Text** is not packaged — pulled the v2.0.2 OTFs from `stipub/stixfonts` `archive/` via **codeload.github.com** (the REST API returned 403 in this network; the release assets live off-repo). `fc-list` must show all three families or the tool downgrades to the structural check *and says so* — it never fails on lying metrics.

**Detection.** `render-proof.js --strict`: snapshot with the two `overflow:hidden` guards stripped (so overflow becomes *page fragmentation*), then render each slide in isolation (`display:none` all + `nth-of-type` re-show). A fitting slide = exactly **2 pages** (content + trailing break blank); every extra page is spill. Exit code = offender count; output carries the ±1-line hinting caveat. Positive control: a 22-bullet generated fixture flags. Opt-in smoke gate: `SMOKE_STRICT=1`.

**First run caught three real bugs.** `#frames`, `#inner-pages`, `#share` all spilled — my v1.1 *arithmetic* budgets used estimated Inter advances; real glyphs wrap wider. The spilled items (a whole bullet ×2, the embed snippet) were beyond hinting noise, so the fix was content: tighter bullets and shorter snippets on all three slides (deck → Build v2.5). Both decks now pass strict; the D-key browser walk that was "owed by a human" since v2.0 is finally automated.

---

## v2.4 — fix: in-deck links navigate away inside srcdoc embeds (2026-07-04)

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
