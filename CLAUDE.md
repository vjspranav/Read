# Read — a French reading site

Live at `read.vjspranav.dev`. Repo: `github.com/vjspranav/Read`.

## What this is and why

Fluency in a first language comes from reading and watching it, not from studying rules.
Most people learning a second language never get that, so they end up with the vocabulary
present and the assembly wrong — speaking French the way a non-native speaker speaks English.

This site is a test of that theory. It is a **reading site** for people who already know
French words but cannot put them together. Not a course. Not for beginners.

Reader level: **A2 heading to B1**. Someone who knows words, has met the present tense and
the passé composé, and stalls the moment a sentence has more than one moving part.

## The three layers

Every French line can carry three layers of text:

1. **The French** — the primary text
2. **A literal word-by-word gloss** — how French assembles the thought
3. **The natural English translation** — what it means

Layer 3 is dimmed and reveals on tap by default. Layer 2 is opt-in. Layer 1 is always there.

The gloss is the layer that makes grammar visible:

```
Elle    ne     l'    avait   pas    entendu   partir.
she   not-1   him     had   not-2    heard   to-leave
She hadn't heard him leave.
```

You can see the negation straddle `avait` instead of `entendu`. The natural translation
hides that. The gloss is where assembly becomes legible.

## The two writing rules

These govern everything a reader ever sees. They are not style preferences.

### English is plain

Grammar notes are written the way you would explain something to a friend at a table.

- No linguistic jargon. No "partitive determiner", no "anterior nasal vowel", no "clitic".
  If a term is genuinely unavoidable, define it in plain words in the same sentence.
- No filler, no cheerleading, no "Great question!", no "Let's dive in".
- Say the thing. A note is two to four sentences. If it needs more, it is really a rule
  and belongs in the rule library.
- Contractions are fine. Write like a person.

Bad: "The partitive article is elided before a vocalic onset."
Good: "«de» loses its vowel before another vowel and becomes «d'». «de eau» is impossible
to say, so it contracts to «d'eau»."

### French is proper

- Real, idiomatic French, as a French person would actually write it.
- Never English sentences with French words substituted in.
- Never simplified into something no native speaker would say. If a structure is too hard
  for the level, **write a different sentence** — do not write broken French.
- Accents, spacing, and « » quotation marks are correct, always.

## Content model

Stories are authored as plain text and compiled to typed JSON at build time. The runtime
never parses story files; it reads finished data from `src/generated/`.

```
content/
  stories/*.txt     one file per story
  rules/*.md        the grammar rule library, one file per concept
  lexicon/*.txt     French word -> literal gloss, shared across every story
```

### Story format

```
---
id: le-train-de-7h12
title: Le train de 7h12
titleEn: The 7:12 train
length: one-page          # one-page | two-page | chapter
tone: everyday
summary: A man misses the same train twice in one week, and the second time is deliberate.
---

fr  Elle ne l'avait pas entendu partir.
en  She hadn't heard him leave.
?   ne ... pas | negation-wraps-verb
    Negation is two pieces that sandwich the conjugated verb. Here the verb is «avait»,
    not «entendu», so the pair wraps «avait» and leaves the participle outside.
=   la | her
```

- `fr` — the French line
- `en` — the natural translation
- `?` — an annotation: **span** `|` **rule id**, then the note in prose
- `=` — a gloss override for an ambiguous word on this line

### Spans resolve to word positions

The build tokenizes each French line, then locates each annotation's span within those
tokens. **The build fails** if a span is not found, matches twice without an `occurrence:`
qualifier, or names a rule that does not exist. Bad annotations never reach the site.

Tokenizing splits apostrophes and hyphens into separate tokens — `l'` + `avait`,
`va` + `-t-` + `il`, `est` + `-ce` + `que`. This is deliberate: elision and euphonic `-t-`
are exactly what readers select and ask about, so they must be selectable alone.
`aujourd'hui` is one token, not two.

### Rules are shared, notes are local

A **note** says why *this* sentence does it. A **rule** explains the general pattern once,
and the site links every place across the library where that rule fires. Seeing elision
happen in six different stories is how it stops being a rule and becomes an instinct.

Never write the general pattern into a note. Put it in the rule and reference it.

### The lexicon proposes, a human confirms

Glosses are hyphenated single concepts — `to-leave`, `not-1`, `of-the` — never phrases.
They sit under one French word without wrapping, and their job is to expose structure,
not to read well.

The build glosses each story from the shared lexicon and prints every token it could not
gloss. Auto-glossing is a labour-saving default, **not an authority**. Every story gets a
pass where glosses are read in context and overridden where they mislead. Each override
found that way promotes its word to the ambiguous list, so the same mistake cannot recur
silently later.

Ambiguous words (`la` = "the" or "her") **fail the build** without a per-line `=` override.
A confidently wrong gloss teaches the wrong thing, which is worse than no gloss at all.

## How selection works

**Tap-to-select tokens, not native text selection.** Every word is a span; the French text
carries `user-select: none`. Tap a word to select, tap an adjacent word to extend, tap away
to clear. Desktop adds shift-click and drag.

This is deliberate. Native selection on iOS fights the OS menu, drags handles around, and
grabs half a word as often as a whole one. Owning selection makes phone and desktop
identical and always lands on token boundaries.

The action bar offers **Why?** and **Listen**. Listen uses browser speech synthesis with a
French voice — no audio files, no per-story cost. Recorded audio can replace it later
without changing the interface.

Annotated spans carry a faint dotted underline, toggleable, on by default. Without it
nobody discovers the feature; too strong and the page stops looking like prose.

### The Why panel always reads in this order

1. **The selection, glossed word by word** — shown for any selection, note or not
2. **The note** — why this sentence does it this way
3. **The rule** — the general pattern, collapsed by default
4. **Other occurrences** — every other place in the library where the rule fires

Step 1 means selecting is never a dead end. With no note written you still learn what the
words literally say and how they are ordered.

When there is no note, say so plainly and offer "Ask about this" — a prefilled GitHub issue
naming the story, line, and phrase. No backend, and it becomes a ranked queue of exactly
which annotations to write next.

## Stack and structure

Vite + React + TypeScript. Static build. No framework. No backend. No accounts —
settings and reading progress live in `localStorage`.

```
scripts/
  build-content.ts   parse -> tokenize -> gloss -> resolve spans -> validate -> emit JSON
  tokenize.ts        French tokenizer
  gloss.ts           lexicon lookup, ambiguity checks, coverage report
src/
  generated/         committed build output; the runtime reads only this
  reader/            Reader, Line, TokenSpan, GlossLine, SelectionBar, WhyPanel, Listen
  library/           shelf, filters, story cards
  rules/             rule index, rule detail with cross-story occurrences
  settings/          reveal mode, interlinear, hints, text size
  app/               routes, layout, theme
```

Routes: `/` · `/stories` · `/story/:id` · `/story/:id/:chapter` · `/rules` · `/rules/:ruleId`

## Commands

```
npm run dev             vite dev server
npm run build:content   compile content/ -> src/generated/ (run before build)
npm run build           build:content, then vite build
npm run test            tokenizer and build-script tests
```

## Deploy

GitHub Actions builds on push to `main` and publishes to `gh-pages`.
`public/CNAME` holds `read.vjspranav.dev` so the custom domain survives every deploy.
Vite `base: '/'` — this serves from a domain root, not a project path.

## Working on this

- Design quality is a stated requirement, not a nice-to-have. This should feel like a
  well-made object.
- Mobile first. Most reading will happen on a phone.
- The content **is** the product. A thin or vague annotation is worse than no annotation.
  Never generate French prose or grammar notes on a fast, cheap model.
- Run `npm run build:content` after any content change. It is the safety net.
