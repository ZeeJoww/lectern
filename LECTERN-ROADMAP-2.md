# Lectern — Roadmap 2 (design)

Issued 2026-07-04 against release **v2.4** (F0–F9 complete, Compose shipped). Same contract style as `LECTERN-SPEC.md` §7–8: each item is an independently dispatchable work order. SPEC §1–§6 invariants still bind; §0 below **adds** rules that exist because the system now has two authoring surfaces.

---

## 0 · New cross-cutting rules

**R1 — The two-surface rule.** Compose is the primary way decks get made. Every deck-visible feature must ship with its Compose grammar *in the same release*, or its spec must state "HTML-only" and why. A feature a speaker cannot reach from plain text is half-shipped.

**R2 — Grammar is append-only.** Outlines are stored inside downloaded decks and must re-import forever. New syntax may be added; existing lines may never change meaning. Any token that parsed as a paragraph yesterday and gains meaning tomorrow needs a leading sigil that was previously improbable (`::`, `![`, `|` at line start, `[@`). Fixture outlines live in `smoke.test.js`; structural assertions, not output hashes.

**R3 — Bilingual by construction.** Every new UI string lands in both `STR.en` and `STR.zh`; every new deck-side string in both `DECKSTR` locales. A release with an untranslated string fails review.

**R4 — Size classes, stated honestly.** Engine deck (`lectern.html`) ≤ 100 KB — unchanged, hard. Text-only generated decks ≤ 150 KB. Image decks have **no hard cap** but Compose must show the truth (G8 meter): a speaker choosing a 6 MB deck should choose it knowingly.

**R5 — Verification ladder.** Every change passes, in order: smoke (jsdom, behavior) → statics (node --check, html5lib) → render-proof structural (pages, order, folios) → **render-proof --strict** (G0: per-slide overflow with real fonts) → human browser pass only for what the ladder can't see (pointer feel, popup UX, contrast taste). Each rung added shrinks the human rung.

---

## 1 · Roadmap

| # | Item | Phase | Surfaces | Depends |
|---|---|---|---|---|
| G0 | Strict render-proof (headless overflow truth) | P0 | tooling | — |
| G1 | Outline ⇄ preview sync | P0 | compose | — |
| G2 | One-click overflow fixes (Split / Compact) | P0 | compose | G0 or preview check |
| G3 | Columns & placed figures grammar | P1 | compose + deck CSS | G1 |
| G4 | Tables grammar (booktabs) | P1 | compose | — |
| G5 | Citations & references | P1 | compose (+ deck CSS) | — |
| G6 | Accessibility workstream | P1 | deck + compose + tooling | — |
| G7 | Pacing (time budgets in presenter) | P2 | compose + engine | — |
| G8 | External media by URL + size meter | P2 | compose | — |
| G9 | Slide-transition variants | P2 | deck + compose | — |

**Status: COMPLETE — G0–G2 (v2.5–2.7), G3–G9 (v2.8–2.14). See devnotes for the integrated P1+P2 entry.** Order G0→G9; versions continue v2.x per merged item; every item lands with a devnotes entry, smoke growth, and (if Compose is touched) a `build-compose.py` run.

---

## 2 · Item designs

### G0 · Strict render-proof — headless overflow truth

**Goal.** Close the biggest verification gap: pixel budgets currently need a human D-walk because WeasyPrint used fallback fonts and `overflow:hidden` suppresses the spill signal.
**Design decisions.**
1. Real metrics: install `fonts-stix`, `fonts-inter`, `fonts-jetbrains-mono` via apt (all packaged in Ubuntu 24). If any is missing, tool prints the fallback caveat and downgrades to structural mode rather than lying.
2. Spill as signal: in `--strict` snapshots, strip the two `overflow:hidden` guards from `.stage`/`.slide` — an overflowing slide then *fragments* to a second page, which is machine-detectable. (This inversion is exactly what run 1 of the proof showed accidentally.)
3. Isolation: render each slide alone (inject `style` hiding the rest), assert **1 page each**; report offenders as `#id (+2nd page)`. O(N) renders ≈ 20 s for 15 slides — acceptable for a gate.
4. Tolerance: font hinting differs from Chrome by ±1 line worst case; a slide flagged only in strict mode is a *warning*, D-key in a browser remains the tiebreaker. Say so in the output.
**Accept.** `node render-proof.js lectern.html --strict` exits 0 on the demo/starter decks; a deliberately overstuffed fixture exits 1 naming the slide; wired as an optional smoke step when weasyprint is present.

### G1 · Outline ⇄ preview sync

**Goal.** Editing a 40-slide outline currently means scrolling two panes independently.
**Design decisions.**
1. Parser gains provenance: each slide records `{lineStart, lineEnd}` (cheap — the line loop already exists).
2. Caret → slide: on textarea `keyup/click` (debounced 150 ms), map caret line → slide → `pv.contentWindow.Lectern.go(n)` (try-guarded). Never while the preview iframe has focus.
3. Slide → outline: subscribe `Lectern.on('slide')` inside the preview after each rebuild; when the change *originated in the preview* (textarea not focused — the loop guard), scroll the textarea so the block's first line is visible. **Never move the caret or steal focus** — scrollTop only. Rejected: gutter highlighting (textarea has no gutter; a mirrored `<pre>` overlay costs more than it pays here).
4. Rebuild keeps place: after `refresh()`, restore the previewed slide by id (ids are stable slugs), falling back to nearest index.
**Accept.** Smoke: provenance map correct for the fixtures; moving a simulated caret into block 3 drives the preview to slide 3; a preview-side `go` scrolls (assert scrollTop changed) without focus/caret change.

### G2 · One-click overflow fixes

**Goal.** The warning says "slide 04 is 62 px too tall"; the speaker should not have to invent the remedy.
**Design decisions.**
1. Each warning row gains two chips: **Split** and **Compact**. Both are *text edits to the outline* — visible, undoable, honest. Rejected: silent font shrinking (violates the typography restraint that makes the deck look designed).
2. Split: move the trailing ⌈half⌉ of the slide's body lines into a new `## <title> — cont.` block inserted after (localised suffix: `（续）`). Re-render; if still tall the chip persists — convergent by construction.
3. Compact: insert the per-slide directive line `::compact` (new grammar, R2-safe sigil) → renderer adds `h-compact`. One bounded density step, never a second.
4. Apply edits with `setRangeText`/`execCommand('insertText')` so the speaker's **undo stack survives**.
**Accept.** Smoke: `::compact` parses to the class; a synthetic overflowing fixture, after programmatic Split, yields two slides whose combined body equals the original; strict proof (G0) goes green on the split result.

### G3 · Columns & placed figures

**Goal.** Real talks put a figure beside its argument; Compose today only stacks.
**Design decisions.**
1. Grammar: a line containing only `|` splits the slide body at that point into `.cols` left/right. One split per slide (two columns is the deck's own layout vocabulary; three is rejected as un-typesettable at 1280 px).
2. `![name | caption | fill]` — third field is a placement keyword; MVP supports only `fill` (figure stretches to match its column, mirroring `frame--fill`: `align-self:stretch`, img `object-fit:contain`). `left/right/full` are *reserved words* documented now so R2 holds later.
3. Overflow interplay: columns change the budget shape; G0/preview warnings already measure truthfully, nothing special needed.
**Accept.** Fixture with `text | figure(fill)` renders `.cols` with a stretched figure; boots clean; strict proof one page.

### G4 · Tables

**Goal.** Results tables are the most-pasted academic content.
**Design decisions.** Markdown-familiar, subset only: contiguous `|`-prefixed lines form a table; a `|---|---|` line after row 1 marks the header; `---:` right-aligns a column (numbers); a following `|= Caption text` line becomes the booktabs caption (`Table n —` numbering via the existing CSS-counter pattern). Cells pass through `fmt()` (math in cells works). No row/col spans — rejected, out of typesetting scope.
**Accept.** Fixture renders `.tbl` with header rule, right-aligned numeric column, caption; zh caption label 表.

### G5 · Citations & references

**Goal.** `[@smith2020]` in the text; a references slide for free.
**Design decisions.**
1. Header block gains a multi-line key: `refs:` followed by indented `key: full citation text` lines (parser enters refs-mode until dedent). Rejected: BibTeX parsing — a formatting citadel; the speaker already has formatted strings from their manager of choice.
2. Inline `[@key]` → `<sup class="cite">[n]</sup>`, numbered by first use. Unknown key → rubric `[?key]` (same philosophy as missing images).
3. A `## References` slide is auto-appended before `end` **iff** any citation was used and the author didn't write one; entries at footnote size, two columns when > 6. zh: 参考文献.
**Accept.** Fixture: two citations out of three refs → numbered sups, auto slide lists exactly the two used, in first-use order; unknown key warns; author-provided References slide suppresses the auto one.

### G6 · Accessibility workstream

**Goal.** The deck is keyboard-rich; make it screen-reader honest.
**Design decisions.** (a) visually-hidden `aria-live="polite"` announcer in the stage: "Slide 4 of 15 — Title" on `'slide'` (reuses F0 hooks); (b) focus containment for the search dialog (Tab cycles input↔results) and arrow-key traversal of the section popover; (c) localized `title`/`aria-label` on preview iframe and Compose controls; (d) contrast audit of all three themes at token level (fix by token change only — R-invariant 4). Harness: `a11y.test.js`, axe-core in jsdom, color-contrast + region rules disabled (jsdom can't compute them; contrast is checked arithmetically from the token table instead). Zero remaining violations is the gate.
**Accept.** axe passes on demo, starter, and a generated deck; announcer text asserted in smoke; token contrast table printed by the test.

### G7 · Pacing

**Goal.** Presenter shows whether you're ahead or behind *your own plan*.
**Design decisions.** Outline: `time: 25m` header key; optional per-slide suffix `## Results @4m` (stripped from the title). Unbudgeted slides split the remaining time equally; budgets land as `data-min` on sections. Presenter adds one line — `plan 12:00 · +1:30 behind` — computed at slide entry from cumulative budgets vs the popup's own timer; lapis when ahead/on, rubric past +2 min. Engine change is data-attributes + `_pv()` fields only; the arithmetic lives in the popup. Rejected: auto-advancing or beeping — pacing informs, never drives.
**Accept.** `_pv()` exposes `{plan, elapsedTarget}`; fixture with mixed budgets computes documented targets; no popup = zero cost.

### G8 · External media by URL + size meter

**Goal.** Let big media stay out of the file — as an explicit, visible trade.
**Design decisions.** `![https://…/fig.png | caption]` (name *is* a URL) → external `<img>`; `!video[url | caption]` → the existing lazy `frame` + `video data-src`. Both add a persistent outline lint: "external asset — this deck is no longer self-contained." Status bar always shows generated size (`184 KB` / `6.2 MB`), rubric past 8 MB with an email-attachment hint. Rejected: data-URL video (multi-MB decks by accident) and any uploading (non-goal: no servers).
**Accept.** URL image renders with lint present; size meter matches `Blob.size` ±1 KB; zh lint string exists.

### G9 · Transition variants

**Goal.** The one polish item carried from the v2.0 margins.
**Design decisions.** Slide directive `::fx slide` (or `none`); default remains the current fade. `data-fx` on the section; CSS only (`translateX(24px)` in/out), `prefers-reduced-motion` collapses all to none; print/overview unaffected (invariant 7). No per-fragment effects — rejected as motion noise.
**Accept.** Directive round-trips; reduced-motion snapshot shows `transition:none`; D-audit unaffected (transform doesn't change layout).

---

## 3 · Explored and deferred (so nobody re-litigates silently)

**Cross-device remote control** — no server, no shared origin ⇒ no honest transport; the same-machine presenter popup stands. Revisit only if a WebRTC-without-signaling story appears. **Poster mode (A0)** — the tokens would stretch but the 1280×720 canvas assumption is load-bearing everywhere (audit, print, overview); a sibling template, not a feature. **WYSIWYG editing** — Compose's text-is-truth is the product; direct manipulation would fork the source of truth. **Font inlining tooling** — still a documentation problem, not a feature. **PWA/manifest** — the file already works offline; ceremony without capability.

## 4 · Dispatch notes

Attach per agent: this file (their G-item + §0), `LECTERN-SPEC.md` §1–6, `LECTERN-DEVNOTES.md` (newest two entries), the four runtime files, `smoke.test.js`. Baseline must be green before edits (SPEC dispatch rule 2). Compose edits happen **only** in `build-compose.py`; engine edits go to both `lectern.html` and `starter.html`; grammar edits add a fixture. The ladder (R5) is the definition of done.
