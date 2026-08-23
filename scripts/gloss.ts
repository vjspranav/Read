import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface LexEntry {
  gloss: string;
  /** Context-dependent. Requires a per-line `=` override wherever it appears. */
  ambiguous: boolean;
}

export type Lexicon = Map<string, LexEntry>;

/** Normalise apostrophes and strip opening punctuation, keeping case. */
export function exactKey(word: string): string {
  return word.replace(/’/g, "'").replace(/^[«"'“‘(\[]+/, '');
}

/** The case-folded form, used as the fallback so «Le» finds «le». */
export function lexKey(word: string): string {
  return exactKey(word).toLowerCase();
}

/**
 * Look a word up: its exact spelling first, then case-folded.
 *
 * This is what lets a name and an ordinary word coexist — «Petit» the surname
 * beside «petit» the adjective — while a capitalised «Le» at the start of a
 * sentence still finds the ordinary entry.
 */
export function lookup(lex: Lexicon, word: string): LexEntry | undefined {
  return lex.get(exactKey(word)) ?? lex.get(lexKey(word));
}

/**
 * Parse `form = gloss` lines. A trailing `| ambiguous` marks a form whose
 * meaning depends on context.
 */
export function parseLexicon(text: string, where: string): Lexicon {
  const lex: Lexicon = new Map();

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    const eq = line.indexOf('=');
    if (eq < 0) throw new Error(`${where}:${i + 1}  lexicon line has no "=":  ${line}`);

    const form = line.slice(0, eq).trim();
    let rest = line.slice(eq + 1).trim();
    let ambiguous = false;

    const bar = rest.indexOf('|');
    if (bar >= 0) {
      const flag = rest.slice(bar + 1).trim();
      if (flag !== 'ambiguous') {
        throw new Error(`${where}:${i + 1}  unknown lexicon flag "${flag}" (only "ambiguous" exists)`);
      }
      ambiguous = true;
      rest = rest.slice(0, bar).trim();
    }

    if (!form) throw new Error(`${where}:${i + 1}  lexicon entry has no word`);
    if (!rest) throw new Error(`${where}:${i + 1}  "${form}" has no gloss`);
    if (/\s/.test(rest)) {
      throw new Error(
        `${where}:${i + 1}  gloss for "${form}" is "${rest}" — glosses must be one hyphenated concept, not a phrase`,
      );
    }

    // Keyed by exact spelling, so «Petit» the surname and «petit» the
    // adjective can coexist. Each entry also claims its case-folded form
    // unless a differently-cased entry already holds it — that is what lets
    // «Bonjour» answer a lower-case «bonjour», and «le» answer «Le».
    const entry = { gloss: rest, ambiguous };
    const exact = exactKey(form);
    lex.set(exact, entry);
    const folded = exact.toLowerCase();
    if (folded !== exact && !lex.has(folded)) lex.set(folded, entry);
  });

  return lex;
}

export function loadLexicon(dir: string): Lexicon {
  const merged: Lexicon = new Map();

  for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
    const lex = parseLexicon(readFileSync(join(dir, f), 'utf8'), `lexicon/${f}`);

    for (const [k, v] of lex) {
      // Ambiguity is a decision about the whole library, not one story: marking
      // a word ambiguous forces an override on every line it appears in,
      // everywhere. Only the shared lexicon gets to make that call, so a
      // per-story file cannot quietly impose that cost on the rest.
      if (v.ambiguous && f !== 'core.txt') {
        throw new Error(
          `lexicon/${f}  "${k}" is marked ambiguous, but only core.txt may do that.\n` +
          `    marking a word ambiguous forces an override wherever it appears in EVERY story.\n` +
          `    either move the entry to core.txt, or drop the "| ambiguous" flag here`,
        );
      }
      merged.set(k, v);
    }
  }
  return merged;
}
