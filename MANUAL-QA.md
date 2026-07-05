# Lectern — Manual QA (the ~5 minutes machines cannot see)

Run per release when the touched area applies; note the lines run in the devnotes entry.
Everything else is covered by the ladder: smoke → statics → render-proof → --strict → a11y.

- [ ] **Ink under the pointer** — draw at a small and a maximised window; strokes land exactly under the cursor (I, Shift-red, C, L laser fade).
- [ ] **Presenter from `file://`** — double-click the deck, press P, in Chrome *and* Firefox: previews or graceful text fallback; ‹ › and keys sync; **● rec** through 3 slides → report lists dwell vs plan; *copy report* works; pace line colours past +2:00.
- [ ] **Next-step preview** — on a fragment slide, presenter "next" shows `step k / K — …`; appendix slides show the `· appendix` chip.
- [ ] **Overview keyboard, real geometry** — O, then ↑↓ jump *rows* (not ±1), ring visible, Enter lands, announcer audible with a screen reader if available.
- [ ] **Print eyeball** — Ctrl+P normal and `?handout`: runheads + folios everywhere; appendix pages read `A1 / N`; no feature chrome.
- [ ] **Themes** — T through paper/slate/sepia at a glance; a `theme: slate` deck opens dark on a fresh profile.
- [ ] **Touch** — swipe changes slides on a phone; pinch not hijacked.
- [ ] **QR** — `link:` on the end slide decodes with a phone camera from the projector distance you'd actually use.
- [ ] **Offline math** — download with *Embed math* checked, go offline (devtools), reload: formulas render; no console 404s.
- [ ] **Compose preview keys** — click the preview, present with the full key map inside the srcdoc frame.
