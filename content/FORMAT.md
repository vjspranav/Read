# Authoring format

Frozen spec. The parser in `scripts/` and every story file must agree with this.

## Story — `content/stories/<id>.txt`

```
---
id: le-train-de-7h12
title: Le train de 7h12
titleEn: The 7:12 train
length: one-page          # one-page | two-page | chapter
level: A2                 # A2 | A2-B1 | B1
order: 20                 # shelf position, lowest first; omit to sort last
tone: everyday            # everyday | literary | humour
summary: One plain-English sentence.
---

fr  Le vieil homme ferma la porte sans bruit.
en  The old man closed the door without a sound.
?   vieil | adjective-before-vowel
    «vieux» would put two vowel sounds back to back in «vieux homme», so French
    swaps in the special form «vieil».
=   la | the

fr  Elle ne l'avait pas entendu partir.
en  She hadn't heard him leave.
?   ne ... pas | negation-wraps-verb
    The pair wraps «avait», not «entendu».
```

Rules of the format:

- A **blank line** separates blocks. One block = one French line.
- `fr` — the French. Required, exactly one per block.
- `en` — the natural translation. Required, exactly one per block.
- `?` — an annotation: `span | rule-id`, then the note on following lines
  indented by 4 spaces. Zero or more per block.
- `=` — a gloss override: `word | gloss`. Zero or more per block.
- Directive and value are separated by whitespace; two spaces is conventional.
- `#` at the start of a line is a comment.
- Multi-word spans are written literally: `ne ... pas` matches the tokens
  `ne` and `pas` and everything between them.
- **Write spans as normal French.** The span goes through the same tokenizer as
  the line, so `jusqu'à`, `s'était arrêté` and `n'y avait plus` all resolve.
  You never need to put a space after an elided prefix.
- If a span appears more than once in the line, disambiguate with
  `span | rule-id | 2` — the trailing number is the occurrence.

## Rule — `content/rules/<id>.md`

```
---
id: negation-wraps-verb
name: Negation wraps the conjugated verb
category: negation        # articles | negation | verbs | pronouns | adjectives | agreement | prepositions
---

French negates with a pair: «ne» before the verb, «pas» after it. In compound
tenses the pair closes around the helping verb, not the participle.

- Je **ne** mange **pas**. — I'm not eating.
- Je **n'**ai **pas** mangé. — I haven't eaten. Never «je n'ai mangé pas».
```

## Lexicon — `content/lexicon/<group>.txt`

```
# one entry per line: form = gloss
sans      = without
ferma     = closed
partir    = to-leave
ne        = not-1
pas       = not-2

# a form whose gloss depends on context is marked ambiguous.
# the build FAILS if it appears in a line without an `=` override.
la        = the | ambiguous
```

Glosses are hyphenated single concepts — `to-leave`, `of-the`, `not-1` — never
phrases. They sit under one French word without wrapping.

## Tokenizing

- Apostrophes split: `l'avait` → `l'` + `avait`. Also `qu'`, `d'`, `n'`, `j'`, `c'`, `s'`, `m'`, `t'`, `jusqu'`.
- Hyphens split, keeping the hyphen with the middle piece: `va-t-il` → `va` + `-t-` + `il`; `est-ce` → `est` + `-ce`.
- `aujourd'hui` is ONE token. So is `quelqu'un`.
- Punctuation is never part of a token. It rides alongside in `before` / `after`
  so it renders in place but is never selectable and never breaks a span match.
- Dialogue works: `« Tu es rentré tôt », dit-elle.` tokenizes to
  `Tu es rentré tôt dit -elle`, with the guillemets carried as punctuation.

## Chapters

A story whose `length` is `chapter` divides itself with `==` lines:

```
== Le premier matin | The first morning

fr  ...
en  ...

== Ce que le facteur a vu | What the postman saw

fr  ...
en  ...
```

- The English half after `|` is optional.
- A chapter story needs at least two of them, and a story that is not
  `length: chapter` may not have any — the build enforces both.
- Chapters are ranges over the story's lines, so reading progress and the
  rule occurrence lists carry on addressing lines by one index throughout.
