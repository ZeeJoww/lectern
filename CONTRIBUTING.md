# Contributing to Lectern

Read, in order: `LECTERN-SPEC.md` §1–§6 · `GRAMMAR.md` · the two newest entries
in `LECTERN-DEVNOTES.md`. Then the rules, compressed:

**R1** Every deck feature ships its plain-text grammar in the same change, or
says "HTML-only" and why. **R2** Grammar is append-only — old outlines import
forever; new syntax hides behind previously-improbable sigils; fixtures in
`smoke.test.js` enforce it. **R3** Every UI/deck string lands in `STR.en` *and*
`STR.zh` (`DECKSTR` likewise). **R4** `lectern.html` ≤ 100 KB, hard; generated
decks show their size honestly instead of capping. **R5** The ladder is the
definition of done. **R6** Rehearsal-style data never leaves the machine.
**R7** Runtime deck dependencies are zero, forever; pinned build/test-time
vendoring is fine (`vendor-qrcode.js` is the pattern).

## The ladder

```
npm install
npm run statics     # node --check + html5lib on every page
npm run gated       # 99 behaviour tests + strict proof, SMOKE_STRICT=1
npm run a11y        # axe-core over six surfaces + token contrast
npm run strict      # per-slide overflow at real font metrics, three decks
```
Green **before** you edit (proves the baseline) and green after. `MANUAL-QA.md`
is the human rung — note which lines you ran in your devnotes entry.

## Conventions that keep the covenant

- `compose.html` is generated — edit **`build-compose.py`** only, then rebuild.
  Beware two recorded traps: the `\uXXXX` safety pass at the bottom decodes
  escapes in the template (build code-bearing escapes via `String.fromCharCode`),
  and `String.replace` treats `$` in replacements specially (use split/join).
- Engine edits go to **both** `lectern.html` and `starter.html`; the deck's
  quick-start `Build vX.Y` line tracks the last release that touched it.
- Every grammar addition: fixture + both locales + a `GRAMMAR.md` row + a line
  in the Compose cheat strings.
- **All** user text is hostile. Markup goes through `escT`/`fmt`; attribute
  values through `escT`; anything spliced into a `<script>` string through
  `jq` (which also neutralises `<`). The hostile-import fixtures in smoke are
  the regression net — extend them when you add a splice site.
- Each change lands with a prepended `LECTERN-DEVNOTES.md` entry (template at
  its bottom): decisions *with the why*, testing evidence, size delta.

## Scope

Deferred ideas live at the bottom of `LECTERN-ROADMAP-3.md` **with their
reasons**; re-open one by refuting its reason, not by re-proposing it. New
feature ideas start as a roadmap-style design (goal, decisions, acceptance),
not as a pull request.
