# The Lectern Outline Language — v1 reference

One plain-text file describes a whole talk. This is the canonical, append-only
reference (rule R2): every construct below keeps its meaning forever; new syntax
may only be added behind previously-improbable sigils. Downloaded decks embed
their outline as `lectern-outline:v1:<base64>`; Import reads any `v<n>:` and
the legacy unversioned form.

## Header block (before the first `#`)

`key: value` lines. Unknown keys are kept as text (first bare line becomes the
subtitle). Keys:

| key | effect |
|---|---|
| `title:` `subtitle:` `authors:` `venue:` `contact:` | title + end slides |
| `short:` | running-head title (defaults to `title`) |
| `byline:` | footer byline (defaults to `authors · venue`) |
| `lang: zh` | Chinese deck strings (议程 · 问答与讨论 · 页 · CJK ids) |
| `time: 25m` | talk budget; spreads over slides without their own `@Xm` |
| `link: https://…` | QR code + visible URL on the end slide |
| `theme: slate` \| `sepia` | initial theme (viewer's stored `T` choice wins) |
| `refs:` | opens the reference block — see Citations |

## Structure

```
# Section Title            one divider slide; numbered § 01, 02 …
# Appendix ::backup        this and everything after it is appendix:
                           outside the count/bar/agenda/pacing; PgDn,
                           search and the G menu still reach it
## Slide Title @4m         one slide; optional minute budget
```
An agenda slide self-inserts after the title when ≥ 2 non-backup sections
exist. Ids are slugs of the titles (CJK kept), deduplicated.

## Inside a slide

| line starts with | meaning |
|---|---|
| plain text | paragraph — the first one is the styled lead |
| `- ` | bullet (two leading spaces nest one level) |
| `+ ` | bullet revealed on `→` (a *fragment*) |
| `++ ` | fragment that dims once passed |
| `> ` | speaker note (press `N`; feeds `?handout` printing) |
| `![name \| caption]` | figure — `name` is a pasted asset or an `https://` URL |
| `![name \| caption \| fill]` | figure stretches to fill its column |
| `!video[url \| caption]` | lazy external video in a frame |
| `\|` alone | split the slide into two columns (once per slide) |
| `\| a \| b \|` | table row — see Tables |
| `$$ TeX $$` | numbered display equation |
| `::compact` | tighter header (one bounded density step) |
| `::fx slide` \| `none` | transition variant (`::` words never error) |

Inline, inside any text: `**bold**` · `*italic*` · `` `code` `` · `$TeX$` ·
`[@key]` citation.

## Tables

Contiguous `|` rows form a booktabs table. A `|---|---:|` line after the first
row marks it as the header; a trailing `:` right-aligns that column (numbers).
`|= Caption text` on the next line becomes the numbered caption
(`Table n — …` / 表 n). No row or column spans, by design.

## Citations

```
refs:
  knuth84: Knuth, D. (1984). Literate Programming. The Computer Journal.
```
Indented `key: formatted text` lines; dedent ends the block. `[@knuth84]`
renders `[n]` numbered by first use; unknown keys show `[?key]` in red. If any
citation fired and you didn't write a `## References` (or 参考文献) slide, one
is appended before the end slide — two columns past six entries. Paste
formatted strings; this is deliberately not BibTeX.

## Figures & media

Paste or drop an image into Compose: it is downscaled, stored as `pic-n`, and
`![pic-n | caption]` lands at the cursor. Captions are numbered
(`Figure n` / 图 n). `https://` names render externally and add a persistent
*not self-contained* lint — the **Archive** chip fetches them into the file
(per-URL honest failures). Placement words `left / right / full` are reserved
no-ops today.

## Reserved & HTML-layer

Reserved slide ids: `title agenda end references 参考文献 ink toc find toast
ovf veil stage deck slides`. A few deck features are reachable only from the
HTML layer (documented, not gaps in v1): hand-tuned `--ratio` frames, inner
`<template data-page>` pages, per-element `data-frag` ordering.

## Compatibility promise

Old outlines import forever. Anything that parsed as a paragraph in v1 will
never silently change meaning; grammar fixtures in `smoke.test.js` enforce it.
