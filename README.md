# Lectern

A slide system for academic talks that is **one HTML file**. No build step, no server, no dependencies — open `lectern.html` in a browser and present; send the same file to share the talk.

The deck you have *is* the documentation: its 15 slides demonstrate every component, with usage snippets.

## Write your talk — the fast path

Open **`compose.html`**, replace the sample with your own text, click **Download deck**. You only decide what to say on each slide:

```
title: Your Talk Title
authors: F. Lastname (Institute)
venue: Seminar · Month 2026

# First Section
## A claim stated as a sentence
The lead line the room reads first.
- supporting point
+ a point revealed on →
> speaker note (press N / feeds ?handout)
```

`# section` · `## slide @4m` · `- bullet` · `+ step` · `++ dim step` · `$$eq$$` · `> note` · `![name | caption | fill]` figure · `|` alone = two columns · `|a|b|` tables · `[@key]` citations with a `refs:` block · `!video[url]` · `time: 25m` pacing · `::compact` · `::fx slide` · `# Appendix ::backup` · `link:` → QR on the end slide · `theme: slate` · `**bold**` `` `code` `` `$TeX$`. **Paste or drop an image** and Compose inserts it as a captioned figure (auto-downscaled). The live preview *is* your deck — click it and present — and it warns, while you type, if any slide outgrows the canvas. **Import deck** re-opens a downloaded file, recovering outline *and* images. The EN ⇄ 中文 button localises the composer; add `lang: zh` to the outline for a Chinese deck (议程, 问答与讨论, CJK deep links).

## Quick start (HTML path)

1. Open `lectern.html` — it runs from a double-click (`file://`) or any static host, or copy `starter.html` as a skeleton.
2. Edit the `DECK` config at the bottom of the file (title + byline).
3. Duplicate any `<section class="slide">` to add a slide; its `id` becomes the shareable deep link (`deck.html#my-slide`).
4. Mark section starts with `data-section="Name" data-sn="2"` — running heads, the agenda slide, and the jump menu all follow automatically.

## Present

| Key | | Key | |
|---|---|---|---|
| `←` `→` `Space` | navigate (reveals steps first) | `P` | presenter window (timer · notes · next) |
| `PgUp` `PgDn` | whole slides | `B` | blackout |
| `Home` `End` | first / last | `/` | search slides |
| `O` | overview grid | `G` | section jump menu |
| `F` | fullscreen | `L` `I` `C` | laser · ink (Shift = red) · clear |
| `N` | speaker notes | `T` | theme: paper → slate → sepia |
| `Esc` | close popups / overview | `D` | author aid — flags overflowing slides |

In overview, arrows move a selection ring (↑↓ by row) and `Enter` jumps. The presenter adds **● rec** — record a rehearsal and get per-slide dwell vs plan, kept locally (last 3 runs).

## Author

- **Steps:** `class="frag"` reveals on `→`; `data-frag="2"` sets order; `frag--dim` fades passed steps.
- **Math:** `<span class="math">e^{i\pi}+1=0</span>`; block `math--display`, numbered `math--eq`. KaTeX is two optional lines in `<head>` — delete them and the TeX stays readable as a mono chip, fully offline.
- **Embeds:** `<iframe data-src="…">` lazy-loads near its slide; `frame--fill` stretches to the column, `--ratio:16/10` pins an aspect. Same for `<video data-src>` (auto-pauses on slide exit).
- **Inner pages:** author a complete page (own CSS/JS) inside `<template data-page>` — it becomes a sandboxed iframe that travels inside the file.
- **Environments:** `block--def / block--thm / block--note` number themselves via CSS counters; booktabs tables, figures, footnotes, and speaker notes (`<aside class="notes">`) are built in.

The canvas is a fixed 1280 × 720. Press `D` while authoring: it flags any slide taller than the canvas, shows by how much, and draws the budget line.

## Share

Send the file · link a slide by `#id` · print to PDF (`Ctrl/Cmd+P`, pages pre-sized with running heads and folios) · print `deck.html?handout` to add a typeset speaker-notes page after every slide · or embed the whole deck in an `<iframe>`.

## Files

| File | Purpose |
|---|---|
| `lectern.html` | The demo deck + engine — every component shown with usage snippets. |
| `compose.html` | Type a plain-text outline → download a finished deck. Live preview + overflow warnings. |
| `starter.html` | Blank 5-slide skeleton for those who prefer editing HTML directly. |
| `GRAMMAR.md` | The outline language, canonical v1 reference. |
| `showcase.outline.txt` / `showcase.html` | Every construct on one deck — tutorial, fixture, and demo. |
| `LICENSE` · `package.json` · `.github/` | MIT; the ladder as `npm run` scripts; CI running it all + Pages deploy. |
| `statics.py` / `scale-probe.js` | Ladder rung 2 formalised; 137-slide performance probe. |
| `LECTERN-SPEC.md` | Contracts: invariants, pixel budgets, feature specs. Read §1–§6 before editing. |
| `LECTERN-ROADMAP-2.md` | Roadmap 2 (G0–G9) — complete; kept for its design record. |
| `LECTERN-ROADMAP-3.md` | Current plan (H0–H9): rehearsal loop, longevity, overview keyboard, tooling. |
| `LECTERN-DEVNOTES.md` | Living changelog — decisions with their *why*, per release. |
| `smoke.test.js` | 97 automated checks. `npm i jsdom && node smoke.test.js lectern.html` (exit code = failures). |
| `render-proof.js` | Headless proofs: structural snapshot, or `--strict` per-slide overflow truth at real font metrics. |
| `a11y.test.js` | Accessibility gate: axe-core over all four surfaces + token contrast table. |
| `vendor-qrcode.js` | Pinned MIT QR encoder (build-time only; decks receive an inline SVG). |
| `MANUAL-QA.md` | The scripted ~5-minute human pass for what headless tools cannot see. |
| `build-compose.py` | Regenerates `compose.html` after deck changes (embeds the shell as base64). |

## Extend

`window.Lectern` exposes `go(n) · next() · prev() · overview() · presenter() · math(i) · check() · state() · on(event, fn) / off`. Events: `"slide" {i, id, el, frag, frags}` (plus `step:true` for in-slide reveals) and `"overview" {on}`. Every change should keep the smoke test green and land with a devnotes entry.

## Repository

Unzip `lectern-repo.zip`, `git init && git add -A && git commit`, push — CI runs the full ladder (statics → gated smoke → a11y → strict at real font metrics) and deploys the decks to Pages from `main`.

*Release v2.25 — Roadmaps 1–3 complete, packaged. History in `LECTERN-DEVNOTES.md`.*
