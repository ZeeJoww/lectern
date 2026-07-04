# Lectern

A slide system for academic talks that is **one HTML file**. No build step, no server, no dependencies — open `lectern.html` in a browser and present; send the same file to share the talk.

The deck you have *is* the documentation: its 15 slides demonstrate every component, with usage snippets.

## Quick start

1. Open `lectern.html` — it runs from a double-click (`file://`) or any static host.
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
| `lectern.html` | The deck + engine. The only file you ship. |
| `LECTERN-SPEC.md` | Contracts: invariants, pixel budgets, feature specs. Read §1–§6 before editing. |
| `LECTERN-DEVNOTES.md` | Living changelog — decisions with their *why*, per release. |
| `smoke.test.js` | 40 automated checks. `npm i jsdom && node smoke.test.js lectern.html` (exit code = failures). |

## Extend

`window.Lectern` exposes `go(n) · next() · prev() · overview() · presenter() · math(i) · check() · on(event, fn) / off`. Events: `"slide" {i, id, el, frag, frags}` (plus `step:true` for in-slide reveals) and `"overview" {on}`. Every change should keep the smoke test green and land with a devnotes entry.

*Build v2.0 — see `LECTERN-DEVNOTES.md` for history.*
