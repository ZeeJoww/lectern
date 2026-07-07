# Lectern v1.0.0

*Public release, 2026-07-06 · internal build v2.26 · MIT*

Lectern is an academic slide system where the deck is **one HTML file** — no
build step, no server, no runtime dependencies — and where a talk is written
as **plain text**: open `compose.html`, type an outline, download a finished
deck that presents in any browser, prints to exact-size PDF with running heads
and folios, and stays readable in a decade.

## Highlights

**Writing.** A napkin-sized grammar (`GRAMMAR.md`): sections, slides,
fragments (`+`, dimming `++`), two-column layouts with placed figures, pasted
images (auto-downscaled, embedded), booktabs tables, citations with an
auto-built references slide, numbered display math with an honest no-network
fallback, per-slide time budgets, appendix sections held in reserve, a QR to
your paper. The live preview *is* the deck, and it warns — while you type —
if a slide outgrows the 1280×720 canvas, with one-click Split/Compact fixes.
Fully bilingual (EN / 中文).

**Presenting.** Presenter window with notes, timer, pacing against your plan,
next-step preview, and rehearsal recording (kept local, last three runs);
blackout; laser and ink; keyboard-navigable overview; in-deck search; section
jump menu; three themes; speaker-note handout printing; deep links per slide.

**Trust.** 99 behaviour tests; a strict headless proof that renders every
slide at real font metrics and fails on overflow; an axe-core accessibility
gate across six surfaces plus arithmetic contrast checks on all themes; a
137-slide scale probe. CI reproduces the entire ladder on every push. During
release hardening, an adversarial-import audit found and fixed two injection
vectors (a `</script>` splice via header fields; an unescaped external image
URL) — both are pinned by hostile fixtures and never appeared in a release.

## Maintenance policy

- **Grammar is append-only.** Outlines written today import forever.
- **Pinned externals** (optional KaTeX CDN pair, vendored QR encoder, STIX
  archive in CI) are refreshed on release or on a security advisory, never
  silently.
- Each release runs `MANUAL-QA.md`, including the WebKit/Safari matrix, and
  records which lines were exercised.

## Upgrading / tagging

```
git tag v1.0.0 && git push --tags
```
Internal history (every decision, with its why) lives in
`LECTERN-DEVNOTES.md`.
