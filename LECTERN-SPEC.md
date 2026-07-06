# Lectern — Feature Roadmap & Implementation Handoff

Spec version 1.1 · 2026-07-03 · Target file: `lectern.html` (single file; current size/status ledger lives in `LECTERN-DEVNOTES.md`)
Audience: implementation agents. Read §1–§5 here **and the newest entries in `LECTERN-DEVNOTES.md`** before touching anything. Every feature spec in §7 assumes them.

---

## 1 · What Lectern is, in one breath

A single self-contained HTML file that is an academic slide deck: fixed 1280×720 canvas scaled to the window, journal-style running chrome, LaTeX-flavoured components (numbered environments, booktabs tables, footnotes), lazy iframes, sandboxed inner HTML pages, deep links per slide, print-to-PDF, overview mode, and an author-side overflow audit. No build step. No runtime dependencies. The one external reference (Google Fonts `<link>`) is optional and the deck must always work with it removed.

## 2 · File anatomy (where things live)

| Region | Anchor to search for | Contents |
|---|---|---|
| Quick-start comment | `LECTERN — a single-file` | User-facing docs; update when you add keys/APIs |
| CSS | `<style>` … `</style>` | Sectioned with `/* ── name ─── */` banners, in order: tokens → base → stage → chrome → slides → typography → layouts → environments → figures/tables → code → footnote → notes → frame → canvas layout → doc helpers → author aid → overview → print |
| Logo | `<symbol id="logo"` | Inline SVG symbol, `currentColor` |
| Stage | `id="stage"` | header chrome → `#slides` (14 `<section class="slide">`) → `#ovf` badge → footer chrome → progress bar |
| Engine | last `<script>` | One IIFE, ES5 style (`var`, `function`), ~230 lines |

Engine symbols you will hook into: `DECK` (config), `slides` (array), `N`, `cur`, `go(i,fromHash)`, `load(i)` (lazy iframes + templates), `fit()`, `overview(on)`, `measure()`/`audit()` (D key), keydown `switch`, `on/off/emit` (F0 hooks), `window.Lectern` public API `{go,next,prev,overview,check,on,off,presenter,math,state}`.

## 3 · Non-negotiable invariants (the reminders)

1. **One file, no dependencies.** No npm, no build, no fetches. A CDN reference is allowed only if the feature degrades gracefully without it (pattern: §7·F3). Never a hard requirement.
2. **Fixed canvas.** 1280×720 via `--W`/`--H`. `.stage` and `.slide` are `overflow:hidden`; anything past the bottom edge is invisible. If your feature adds slide content or chrome, it must fit the budgets in §4 and pass the D audit.
3. **Hidden slides keep layout.** Non-current slides are `visibility:hidden`, **never** `display:none`. `measure()` depends on every slide being measurable at all times. Fragments, themes, anything you add: reveal with visibility/opacity/transform only.
4. **Tokens only.** Colours exclusively via the CSS custom properties (`--paper --ink --ink-2 --lapis --lapis-soft --rubric --rule --rule-strong --wash`), fonts via `--serif --sans --mono`. No new hex values in feature CSS; extend the token block if a theme genuinely needs one.
5. **Restraint.** Hairline borders, small caps kickers, rubric red only for the one thing that matters. No gradients, no new shadows beyond the two existing ones, no emoji in deck UI.
6. **Print owns `.slide::before/::after`** (runhead + folio from `data-runhead`/`data-n`/`data-tot`). Any screen-side pseudo-element on `.slide` must sit inside `@media screen{}` (see the author-aid block for the pattern).
7. **Every overlay hides in overview and print.** Follow the `.ovfbadge` pattern: hide under `.is-overview`, hide in `@media print`.
8. **Hash = slide id, nothing more.** Deep links (`#frames`) must stay clean and shareable. Feature state (fragment index, ink, theme) does not go in the URL.
9. **Keyboard guard.** The keydown handler ignores events with meta/ctrl/alt and events targeting `input/textarea/contenteditable`. Register new keys inside the existing `switch`; check §5 for reservations. Remember the documented caveat: focus inside an iframe swallows keys — never make a feature's *only* trigger a keystroke if it matters mid-talk (provide a click path too).
10. **Engine script hygiene.** Inside the engine `<script>`, never emit the literal sequence `</script>` (build it as `'<'+'/script>'` if ever needed). Slide-visible code samples are HTML-escaped (`&lt;`).
11. **Accessibility floor.** New interactive elements get `aria-label`s; state toggles update `aria-hidden`/`aria-pressed`; keep `:focus-visible` outlines working.
12. **Style match.** ES5 (`var`, `function`), single-quote strings, one-line CSS declarations, section banner comments `/* ── name ─── */`. Additions go: CSS before the `/* ── overview` banner; JS after the feature it extends; keys into the switch; public API onto `window.Lectern`.

## 4 · Geometry budgets (memorise these before adding UI or slides)

- Canvas 1280×720. Side padding `--pad:84px` → content width **1112px**.
- Vertical: header chrome 58 + 30 padding, footer chrome 58 + 26 padding → content box **548px** tall.
- A standard header block (kicker + h2 + rule) costs ≈ **125px**, or ≈ **117px** with `h-compact`.
- `.cols` column width **530px** (gap 52). `.wires` cell **≈351px**.
- Body text 24px/1.52 → one wrapped line ≈ 36.5px; `pre.code` line ≈ 22.5px + 28px padding.
- Verify with **D** (badge + dashed budget line + console table) or `Lectern.check()` → `[{slide,id,overflow}]`.

## 5 · Key map (current + reserved)

| Key | Now | Reserved by roadmap |
|---|---|---|
| ← → ↑ ↓ Space PgUp PgDn | navigate | F1 makes →/↓/Space fragment-aware; PgUp/PgDn stay slide-level |
| Home / End | first / last | — |
| O / Esc | overview / close | Esc gains: close search → close overview (in that order) |
| F | fullscreen | — |
| N | speaker notes | — |
| D | overflow audit | — |
| P | — | F2 presenter window |
| B | — | F2 blackout |
| / | — | F5 search overlay |
| G | — | F4 agenda popover |
| L, I, C | — | F7 laser / ink / clear |
| T | — | F8 theme cycle |

## 6 · Validation ritual (run after every change; all four must pass)

1. Extract each `<script>` block → `node --check` (zero tolerance).
2. Parse the whole file with `html5lib` (Python) — must parse; slide `id`s unique.
3. In a browser: press **D**, walk all slides — badge must read *fits ✓* everywhere; console table empty.
4. Print preview (Ctrl/Cmd+P): every page shows runhead + folio, no feature chrome visible; then toggle overview (O) — no feature chrome visible there either.
Also keep total file size < 100 KB and update the quick-start comment + shortcuts slide (13) for any new key.

## 7 · Roadmap

| # | Feature | Phase | Depends on |
|---|---|---|---|
| F0 | Engine event hooks | P0 — do first | — |
| F1 | Fragments (step reveals) | P0 | F0 |
| F2 | Presenter window + blackout | P0 | F0 |
| F3 | Math (KaTeX, optional) | P0 | — |
| F4 | Auto agenda + section popover | P1 | F0 |
| F5 | In-deck search | P1 | F0 |
| F6 | Media component (video/audio) | P1 | — |
| F7 | Ink & laser overlay | P2 | F0 |
| F8 | Themes (slate / sepia) | P2 | — |
| F9 | Handout print (notes pages) | P2 · stretch | — |

Shipped: **F0–F9 (v2.0)** — the roadmap below is fully implemented; `LECTERN-DEVNOTES.md` carries the release entry and per-feature decisions. Each feature is independently mergeable; conflicts are confined to the four shared hook points (keydown switch, end of `go()`, `window.Lectern`, CSS insertion before overview banner). Implement in table order.

---

## 8 · Feature specifications

### F0 · Engine event hooks — tiny emitter (infrastructure)

**Goal.** One shared notification point so F1/F2/F4/F5/F7 don't each patch `go()`.
**Spec.** Inside the IIFE: `var hooks={};` plus `on(ev,fn)` and `emit(ev,data)` (≤10 lines). `go()` emits `slide` with `{i,id,el}` after the runhead update; `overview()` emits `overview` with `{on}`. Expose `on` as `Lectern.on`.
**Accept.** `Lectern.on('slide',console.log)` logs on every navigation; no behaviour change otherwise.

### F1 · Fragments — step reveals

**Authoring.** `class="frag"` on any element inside a slide; optional `data-frag="2"` for explicit order (default: DOM order, ties share a step). Modifier `frag--dim`: earlier steps drop to 55% opacity instead of full visibility when passed.
**Behaviour.** →/↓/Space reveal the next fragment before advancing the slide; ←/↑ hide the last visible fragment before retreating; PgDn/PgUp always move whole slides. Entering a slide forward starts at step 0; entering backward (via ←) starts fully revealed. Hash never encodes the step (invariant 8).
**Rendering.** Reveal with `visibility` + `opacity` + ≤6px translateY, transition ≈ .2s; **`display:none` is forbidden** (invariant 3). Respect `prefers-reduced-motion` (existing pattern near `.slide` transition). Overview and print show all fragments revealed. `aria-hidden` mirrors visibility.
**Engine.** Track `fragCur` per slide (array indexed like `slides`); reset logic in `go()`; intercept in the keydown cases before `next()/prev()`. Progress bar may interpolate within a slide — optional, behind one boolean.
**Accept.** A demo added to slide 05 (three list items as fragments) fits the budget (D passes), prints fully revealed, and swiping on touch still changes slides.

### F2 · Presenter window + blackout

**Trigger.** Key **P** and a small `⧉` button appended to `.foot__nav` (click path — invariant 9). Key **B** toggles blackout: a `--ink` full-stage cover with 0.15s fade; any nav key or B lifts it.
**Popup.** `window.open('about:blank')`, content written by the opener (no second file). Layout: big timer (start/pause/reset buttons + elapsed), wall clock, "slide n / N" + current slide title, the current slide's `aside.notes` HTML, next slide's title. Two live preview iframes (`location.href + '#' + id` for current and next) are **progressive enhancement**: on `file://` some browsers block them — the text/notes/timer core must work standalone. Detect failure via iframe `onerror`/timeout and collapse the panes.
**Sync.** Direct object references (popup was opened by us; `about:blank` inherits our origin — works on `file://` where BroadcastChannel does not). Opener pushes state via F0 `slide` hook; popup buttons call `Lectern.next/prev`. Clean up on `beforeunload` of either window.
**Accept.** Works from a double-clicked local file in Chrome and Firefox; closing the popup never errors the deck; blackout hides in print/overview.

### F3 · Math — optional KaTeX, honest fallback

**Authoring.** Explicit elements only (no document-wide delimiter scanning): `<span class="math">a^2+b^2=c^2</span>` inline, `<div class="math math--display">…</div>` block. Optional numbered variant `math--eq` gets a right-aligned `(n)` via a pure-CSS counter (works with or without KaTeX; mirror the `.block` counter pattern).
**Loading.** A clearly-commented **optional** CDN pair (`katex.min.css` + `katex.min.js` defer) in `<head>`, same contract as the fonts link: delete it and the deck still works — unrendered `.math` displays the raw TeX in `--mono` on `--wash`, which is legible and honest. Never fetch programmatically.
**Rendering.** Lazily in `load(i)` (current ±1), `throwOnError:false`; render **all** on `beforeprint`. Mark rendered nodes with `data-mathed` to avoid re-render.
**Accept.** With CDN line present: crisp math, print correct. With it deleted: mono fallback, zero console errors, offline works.

### F4 · Auto agenda + section popover

**Agenda slide.** `<section class="slide slide--agenda" data-agenda>` is populated at init from the `data-section` slides: section number, title, slide count, each row a deep link (reuse hash nav). Style: booktabs-like hairline rows, `--lapis` numerals; must fit 548px for ≤6 sections.
**Popover.** Clicking the header's `#runSection` label (make it a `<button>`, keep visual style) or key **G** opens a small anchored list of sections for mid-talk jumps; closes on Esc/click-out. Follows `.ovfbadge` hide rules (invariant 7).
**Accept.** Adding/removing a section slide changes both agenda and popover with no other edits; demo deck gains the agenda as new slide 02 (renumber checks: D passes everywhere, print folios correct).

### F5 · In-deck search

**Trigger.** Key **/** (and it must not fire while typing — the existing target guard covers the search input itself). Overlay styled like the notes card, centered top; hides per invariant 7.
**Behaviour.** Live filter over a prebuilt index `{i, title (h2/h1), text (textContent, collapsed)}`; show ≤8 hits as "n · section · title — …context…"; ↑/↓ select, Enter jumps (existing `go`), Esc closes (order: search → overview). Highlighting inside slides is out of scope — jump only.
**Accept.** Index builds once (<5 ms for 14 slides); no scroll leaks to the deck; works in fullscreen.

### F6 · Media component

**Authoring.** `<figure class="frame"><figcaption class="frame__bar">…</figcaption><video data-src="talk.mp4" poster="…" controls playsinline></video></figure>`; `frame--fill` and `--ratio` behave as for iframes.
**Engine.** Extend `load(i)` to promote `video[data-src]/audio[data-src]`. In `go()` (or via F0 hook) **pause every playing medium in the slide being left** — non-negotiable. Never autoplay with sound.
**Print.** Poster (or empty frame) only. **Accept.** Leaving mid-playback pauses; returning resumes position; D passes.

### F7 · Ink & laser overlay

**Placement.** One `<canvas id="ink">` appended **inside `#stage`** so it inherits the scale transform — draw in design-space (1280×720) coordinates; convert pointer coords by dividing by current scale `k` (derive from `stage.getBoundingClientRect().width / 1280`). z-index above slides, below chrome.
**Modes.** **L** laser: rubric dot trailing the pointer, ~0.5s fade, nothing stored. **I** ink: draw with pointer (2.5px `--lapis`; hold Shift → `--rubric`); strokes stored **per slide index** and redrawn on `slide` hook. **C** clears current slide's strokes. While ink is armed, suppress swipe navigation (guard the pointerdown that seeds `tx/ty`) and set `cursor:crosshair`.
**Exclusions.** Hidden in overview + print (invariant 7); strokes are session-only (no persistence, no URL — invariant 8). Footer gains two small toggle buttons mirroring L/I (click path).
**Accept.** Drawing at any window size lands exactly under the pointer (the coordinate-space test); nav keys still work while laser is on; D unaffected.

### F8 · Themes

**Spec.** Token overrides only: `html[data-theme="slate"]{…}` (dark: paper→#14181F, ink→#E8ECF2, wash/rule adjusted, lapis lightened for contrast) and `sepia`. Key **T** cycles default→slate→sepia (announce via a 1s toast reusing badge styling). Persist in `localStorage('lectern-theme')` with try/catch (private-mode safe). `@media print` pins the light tokens regardless of theme. Charts/inline SVGs already use tokens or neutral hexes — audit slide 07's SVG and swap its literals to `currentColor`/vars as part of this task.
**Accept.** AA contrast for body text in every theme; print stays white; no hex values outside the token blocks.

### F9 · Handout print (stretch)

**Spec.** `deck.html?handout` → after each slide page, emit a generated notes page (slide title + `aside.notes` content, typeset like the paper, same runhead/folio scheme with "n·notes"). Implementation: on load with the flag, clone notes into `.handout-page` elements appended after each slide; pages exist only under `@media print` + flag class. No effect on normal viewing.
**Accept.** 14-slide demo prints 14 or 28 pages depending on the flag; folios stay correct in both.

---

## 9 · Non-goals

No frameworks or build tooling; no telemetry; no server features (comments, analytics, remote control beyond F2's same-machine popup); no WYSIWYG editing; no font inlining tooling (document the manual base64 route in the quick-start comment instead, if asked).

## 10 · Definition of done (per feature)

Feature works from a double-clicked local file offline (except the two marked optional-CDN behaviours) · §6 ritual passes · quick-start comment and slide 13 shortcut table updated · demo usage added to the deck only if it fits its slide's budget · `window.Lectern` additions documented in the comment header.
