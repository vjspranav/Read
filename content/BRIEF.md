# Brief for writing a story

Read `FORMAT.md` (the authoring spec), `../CLAUDE.md` (the two writing rules),
and `stories/sous-le-meme-parapluie.txt` as the worked example of the voice and
difficulty you are aiming at.

## The reader

A2 heading to B1. Knows French words. Has met the present tense and the passé
composé. Stalls the moment a sentence has more than one moving part. Not a
beginner, and will be insulted by baby French.

## Difficulty — this matters most

These stories sit at the front of the shelf, so they must be **easy**.

- **Vocabulary: high-frequency words only.** House, street, bread, water,
  morning, friend, door, hand, eat, walk, look, wait, forget, buy. If you reach
  for an uncommon or literary word, choose a plainer one.
- **Tenses: présent and passé composé.** Imparfait only where it genuinely
  contrasts with the passé composé — that contrast is worth teaching.
  **No passé simple anywhere.**
- **Short sentences.** Mostly one clause, sometimes two joined by `et`, `mais`,
  `parce que`, `quand`. Never three subordinate clauses stacked up.
- Simple is not childish. A French adult would write these sentences; they are
  just plain ones.

## Shape

18–24 French lines. Everyday slice-of-life, warm rather than sad. Something
small shifts by the end — do not just describe a scene. The turn should land
without being explained.

## Annotations

20–28 of them. Annotate what actually blocks someone at this level: gender,
elision, `de` after a negative, the partitive, passé composé with `avoir` or
`être` and its agreement, object pronouns before the verb, adjective position
and agreement, `il y a`, and prepositions that do not map onto English.

Each note is two to four sentences of plain English saying why *this* sentence
does it this way. The general pattern belongs in the rule file, never the note.
No jargon; define any unavoidable term in the same sentence in ordinary words.

Write spans as normal French — `jusqu'à`, `n'y a pas`, `s'il` all resolve.

## Rules

**34 rules already exist in `rules/`. Read that directory first and reuse them
by id.** Only write a new rule file for a genuinely new concept, and check the
directory again before choosing its filename.

## Lexicon

`lexicon/core.txt` holds 200+ entries — **reuse them**. Put any words you add in
**your own file**, named in your task. Do not edit `core.txt`; other stories are
being written at the same time and you would clobber each other.

Glosses are hyphenated single concepts (`to-leave`, `of-the`, `not-1`), never
phrases. Imparfait forms are glossed `was-...` for verbs that take it, so the
contrast with other past tenses stays visible.

Ambiguous forms (`il`, `la`, `le`, `les`, `est`, `son`, `sa`, `y`, `en`,
`même`, `personne`, and others marked in the lexicon) need an `=` override on
every line where they appear, or the build fails. That is deliberate: a
confidently wrong gloss teaches the wrong thing.

## Finish by verifying

Run `npm run build:content` until it reports **no problems** and **100% gloss
coverage**. Then `npx vitest run` and confirm the suite still passes.

**Other stories are being written concurrently.** If the build reports a problem
in a file that is not yours, ignore it — fix only your own. If the whole build
is blocked by someone else's half-written file, wait a moment and run it again.
