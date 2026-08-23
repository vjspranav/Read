# Brief for writing a story

Read `FORMAT.md` (the authoring spec), `../CLAUDE.md` (the two writing rules),
and `stories/sous-le-meme-parapluie.txt` as the worked example of the voice and
difficulty you are aiming at.

## The reader

A2 heading to B1. Knows French words. Has met the present tense and the passé
composé. Stalls the moment a sentence has more than one moving part. Not a
beginner, and will be insulted by baby French.

## Difficulty — this matters most

Everything on this shelf is **A2**. Not "roughly A2". A2.

### Vocabulary

Use the plainest word that does the job. Before writing any word longer than
about six letters, ask: would someone in their first year of French know this?
If not, say it another way.

**Abstract words are the trap.** These all appeared in earlier stories and are
too hard — the plain version is always available:

| Too hard | Say instead |
|---|---|
| le propriétaire | à qui est le chat |
| ça appartient à | c'est à |
| un désastre | très difficile à lire |
| sa réaction | ce qu'elle va dire |
| improviser | faire avec |
| ressembler à | on dirait |
| éclater de rire | rire très fort |

**Concrete things are fine even when the word is long**, if the story is about
them: a story about leeks may say «poireaux», an umbrella may be a «parapluie»,
a cat may sleep on «le rebord de la fenêtre». The test is abstract versus
concrete, not short versus long.

**A simpler word must still be correct French.** «le rebord» became «la
fenêtre» once, and left a cat sleeping *on a window* — plainer, and wrong.
If the plain version is not something a French person would say, keep the
original word and simplify a different part of the sentence.

### Grammar

- **Présent and passé composé.** Imparfait only where it genuinely contrasts
  with the passé composé — that contrast is worth teaching. **No passé simple.**
- **Short sentences.** Mostly one clause, sometimes two joined by `et`, `mais`,
  `parce que`, `quand`. Never three subordinate clauses stacked up.
- Simple is not childish. A French adult would write these sentences; they are
  just plain ones. If a plain sentence sounds flat, fix it with a better image,
  never with a harder word.

## Shape

18–24 French lines. Everyday slice-of-life, warm rather than sad. Something
small shifts by the end — do not just describe a scene. The turn should land
without being explained.

## Annotations

**32 to 40 of them** — most lines should carry something. Do not pad: if a line
genuinely has nothing worth explaining, leave it alone and put the effort into a
line that does. Annotate what actually blocks someone at this level: gender,
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
phrases. A name may share its spelling with an ordinary word — `Petit` the
surname and `petit` the adjective both work, because lookup tries the exact
spelling before the case-folded one. Never rename a character to dodge a
lexicon clash. Imparfait forms are glossed `was-...` for verbs that take it, so the
contrast with other past tenses stays visible.

**Do not mark anything `| ambiguous` in your own file — the build refuses it.**
Ambiguity is a decision about the whole library: it forces an override wherever
that word appears in *every* story, so only `core.txt` may declare it. If you
believe a word truly needs it, say so in your report and leave it alone.

Words already marked ambiguous (`il`, `la`, `le`, `les`, `est`, `son`, `sa`,
`y`, `en`, `même`, `personne`, and others) need an `=` override on every line
where they appear, or the build fails. That is deliberate: a
confidently wrong gloss teaches the wrong thing.

## Finish by verifying

Run `npm run build:content` until it reports **no problems** and **100% gloss
coverage**. Then `npx vitest run` and confirm the suite still passes.

**Other stories are being written concurrently.** If the build reports a problem
in a file that is not yours, ignore it — fix only your own. If the whole build
is blocked by someone else's half-written file, wait a moment and run it again.
