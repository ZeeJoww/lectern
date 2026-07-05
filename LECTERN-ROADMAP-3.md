# Lectern — Roadmap 3 (plan)

Issued 2026-07-05 against **v2.14** (Roadmaps 1–2 complete). Same contract as before: SPEC §1–6 and ROADMAP-2 §0 (R1–R5) bind; §0 here adds two rules the new items make necessary. Each H-item is an independently dispatchable work order with its decisions already made.

**Where the product stands.** Writing (Compose grammar, sync, one-click fixes) and verification (smoke · strict proof · a11y gate) are strong. The remaining value clusters in three places: the **rehearsal loop** (pacing exists, but nothing *remembers* a run), **longevity** (external URLs and the KaTeX CDN are the last things that can rot), and two honest **debts** (overview is mouse-only; the human QA pass has no script).

---

## 0 · Rules addendum

**R6 — Recordings stay local.** Anything resembling telemetry (rehearsal timings, run history) lives in `localStorage` or in text the speaker explicitly copies out. Nothing ever leaves the machine; no timestamps in the deck file itself.

**R7 — Vendoring line.** Runtime deck dependencies remain **zero**, forever. Build-time and test-time vendoring is allowed when pinned and licensed (axe-core set the precedent): Compose may embed an MIT QR encoder (H6), and may *fetch-and-inline* the already-referenced KaTeX at download time (H4) — that converts an optional runtime reference into bytes, which is the opposite of adding a dependency.

---

## 1 · Roadmap

| # | Item | Phase | Surfaces | Depends |
|---|---|---|---|---|
| H0 | Overview keyboard navigation | P0 | engine | — |
| H1 | Backup / appendix slides | P0 | engine + compose | — |
| H2 | Rehearsal recording + report | P0 | presenter | — |
| H3 | Archive external images into the file | P1 | compose | — |
| H4 | Embed the math renderer at download | P1 | compose | — |
| H5 | Outline export · plain-text import | P1 | compose | — |
| H6 | QR on the end slide (`link:`) | P2 | compose (vendored encoder) | R7 |
| H7 | Presenter: next-step + backup badges | P2 | presenter | H1 |
| H8 | Proof tooling: `--only`, `--jobs`, MANUAL-QA.md | P2 | tooling | — |
| H9 | Download options row (`theme:` key, math embed) | P2 | compose | H4 |

**Status: COMPLETE — H0–H9 shipped as v2.15–v2.24; see the devnotes release entry.** Order H0→H9; versions continue v2.x per merged item. Ladder (R5) is the definition of done throughout.

---

## 2 · Item designs

### H0 · Overview keyboard navigation

**Gap.** Overview is click-only; a keyboard user can open the grid but not use it — the one hole G6 left.
**Design.** `ovSel` initialises to `cur` on open. While `ovOn`: ←→ move ±1; ↑↓ move by *row* (compare `offsetTop` of thumbnails — column count varies with viewport, geometry is the truth); Home/End first/last; Enter commits (`go(ovSel)` + close); Esc unchanged. Visual: `.is-overview .slide.is-sel{outline:3px solid var(--lapis);outline-offset:2px}`. The announcer reads "n · title — overview". Selection is *not* focus (thumbnails stay inert-free but untabbable; one roving ring, no 15-stop tab order).
**Anchors.** Keydown switch: the existing `if(!ovOn)` guards grow `else` branches; `overview()` seeds/clears `ovSel`.
**Accept.** Smoke: open → arrows move the ring (including a row jump asserted via two thumbnails with different offsetTop… jsdom has no layout, so row-jump is asserted as "falls back to ±1 when geometry is flat" and the real row jump joins MANUAL-QA (H8)); Enter lands and closes; axe stays at zero.

### H1 · Backup / appendix slides

**Gap.** Every real talk carries slides you hope not to show. Today they inflate the count, the progress bar, and the pacing spread.
**Design.**
1. Grammar: `# Appendix ::backup` — a section-line suffix (sections gain the same `::` suffix parsing slides have). All its slides, and *everything after the first backup section*, are backup; Compose **lints** if a normal `#` follows a backup one (trailing-only, enforced socially not silently).
2. Engine: `data-backup` inherited like runheads. `Nmain` = index of the first backup slide (or N). Folio: main slides unchanged over `Nmain`; backups read `A1 · appendix` (localised 附录 via the existing splice channel). Progress bar clamps at 100 % from the last main slide onward; `End` goes to `Nmain−1`; PgDn past the last main slide *still enters* backups (deliberate — the escape hatch must exist).
3. Reachability: agenda **excludes** backup sections; the G-popover **includes** them under a muted rule (that is the designed access path), search and `#hash` work as always. Pacing (`time:`) spreads over main slides only. Print and `?handout` include backups (archival completeness) — printing "main only" is a `--strict`-style non-goal, revisit on demand.
**Accept.** Fixture with 2 main + 1 backup section: counter says main total; backup folio `A1`; agenda 2 rows, popover 3; `End` stops before appendix; PgDn crosses into it; pacing ignores it; strict proof still per-slide green.

### H2 · Rehearsal recording + report

**Gap.** G7 tells you you're behind *now*; nothing tells you tomorrow where you always run long.
**Design.** Presenter gains **● rec**: while on, log `{i, id, ms}` on every `'slide'` push; stopping stores the run under `localStorage['lectern-runs:'+shortTitle]` (keep last 3, R6). A collapsible report pane lists per-slide actual vs `data-min` plan with a lapis/rubric Δ, totals, and a **copy report** button producing plain text (`04 #frames  2:10 / plan 3:00  −0:50`). In-slide fragment steps are folded into their slide's dwell. No engine change — everything rides `_pv()` + the F0 push the popup already receives.
**Accept.** Popup-less environments untouched; a simulated run (three pushes with fake clocks) yields the documented report string; storage capped at 3 runs; nothing about runs appears in the deck file.

### H3 · Archive external images into the file

**Gap.** G8 made external media honest; this makes it fixable in one click.
**Design.** When lints include external *images*, the lint block gains **Archive** (归档): for each `![https://… | cap]`, `fetch` → blob → the existing downscale pipeline → `ASSETS['pic-n']`, and the outline token is rewritten `![pic-n | cap]` via the undo-preserving edit path (G2's). Per-URL results reported honestly — CORS-blocked hosts fail *by name* and their tokens stay untouched. Videos are excluded by design (size); their lint remains.
**Accept.** Mock-fetch test: two URLs, one succeeding → token rewritten + asset present + lint gone; one failing → token intact + named failure line; round-trip (Import) recovers the archived image.

### H4 · Embed the math renderer at download

**Gap.** The KaTeX `<link>+<script>` pair is the deck's last network reference.
**Design.** A Download-options checkbox (H9 row): *Embed math renderer (+≈400 KB, fully offline)*. On download: fetch the two pinned URLs already present in the shell; **rewrite the CSS's `url(fonts/…woff2)` references to base64 data-URIs** (fetch each referenced woff2 — this, not the JS, is the real work; without it "offline math" is a lie). Inline as `<style>` + `<script>`, deleting the CDN lines. Two guards: any fetch failure ⇒ abort cleanly, keep CDN lines, tell the speaker; if the JS source ever contains the literal `</script` ⇒ same abort (SPEC invariant 10 — do not "escape and hope"). Size meter reflects the result; the embed choice is *not* stored in the outline (it's a packaging decision, re-tickable on re-download).
**Accept.** With mocked fetches: output has zero `http` references in head, `.math` renders offline in a browser check (MANUAL-QA line); failure path leaves a byte-identical-to-unchecked deck plus a message.

### H5 · Outline export · plain-text import

**Design.** **Export outline** button downloads the textarea as `<title-slug>.outline.txt` — the git-diffable form of the talk without opening a browser reader. Import accepts `.txt` as a raw outline directly (no comment extraction). Markdown auto-conversion (`#`-level shifting, list-marker mapping) is **deferred**: the heuristics guess wrong often enough to corrupt silently, which violates the spirit of R2 — revisit only with an explicit preview-diff UI.
**Accept.** Export→Import round-trips byte-exact; `.txt` with the sample grammar builds identically to pasting it.

### H6 · QR on the end slide

**Design.** Outline key `link: https://…` → the end slide gains an inline-SVG QR (≈150 px, ink-on-paper, theme-safe via `currentColor`) above the contact line, with the URL printed beneath it (QRs without visible URLs fail the projector-photo test). Encoder: vendor a pinned MIT single-file QR generator into `build-compose.py` (R7); the **deck receives only the SVG string** — zero runtime dependency. Error-correction M; no logos (restraint).
**Accept.** Deterministic fixture: known URL → stable module matrix (snapshot the SVG path data); no `link:` ⇒ byte-identical end slide; decodes with a phone (MANUAL-QA line).

### H7 · Presenter: next-step + backup awareness

**Design.** When the current slide has unrevealed fragments, the "next" pane shows `step k+1 / K — <first 60 chars of the next fragment's text>` instead of the next slide title (the truthful answer to "what happens when I press →"). Slides with `data-backup` render an `appendix` chip beside the position line. `_pv()` gains `nextStep` (null otherwise) — additive, listeners tolerate (F0 rule).
**Accept.** `_pv()` on a mid-fragment slide reports the step preview; on the last step reports the next slide; backup chip asserted on an H1 fixture.

### H8 · Proof tooling + the scripted human pass

**Design.** `render-proof.js` gains `--only id[,id…]` (iterate on one slide in seconds) and `--jobs N` (parallel WeasyPrint spawns; default 4 — a 100-slide deck drops from ~2.5 min to ~40 s). Commit **`MANUAL-QA.md`**: the ~5-minute checklist of everything the ladder cannot see — ink lands under the pointer at two window sizes, presenter popup from `file://` in two browsers, print eyeball (both modes), theme taste, touch swipe, QR decode (H6), offline math (H4). Every release notes which lines were run.
**Accept.** `--only frames` renders one slide; `--jobs 4` matches serial results on the demo; MANUAL-QA.md exists and is referenced from the devnotes template.

### H9 · Download options row

**Design.** A slim options row by the Download button: the H4 math-embed checkbox, and an initial-theme select writing `theme: slate|sepia` into the outline (grammar key). Deck-side: Compose sets `data-theme` statically on `<html>`; the existing pre-paint script only *overrides* when the viewer has a stored preference — initial theme works with **no engine change**. `T` still cycles and persists.
**Accept.** `theme: slate` deck opens dark on a fresh profile, opens per-preference on a used one; grammar key round-trips.

---

## 3 · Explored and deferred

**PPTX import** — client-side Office parsing is a dependency citadel (zip + XML + shape model) for a lossy result; the outline is the migration path. **Markdown auto-convert** — deferred into H5's note: needs a preview-diff to be honest. **Cross-device remote / live collaboration** — still no serverless transport; unchanged verdict. **Rehearsal audio recording** — privacy surface and MediaRecorder codec swamp for marginal value over timings; timings first, revisit on demand. **"Print main slides only"** — a flag nobody has asked for; H1 keeps the door open.

## 4 · Dispatch

As before (ROADMAP-2 §4): one brief per agent + SPEC §1–6 + R1–R7 + newest devnotes; baseline green before edits; Compose only via `build-compose.py`; engine edits to both decks; every grammar addition ships a fixture and both locales; the ladder is the definition of done. Suggested first slice: **H0+H1** (they share the keydown/overview anchors and the folio channel).
