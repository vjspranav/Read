import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface LexEntry {
  gloss: string;
  /** Context-dependent. Requires a per-line `=` override wherever it appears. */
  ambiguous: boolean;
}

export type Lexicon = Map<string, LexEntry>;

/** Lexicon keys ignore case and normalise the two apostrophe characters. */
export function lexKey(word: string): string {
  return word.toLowerCase().replace(/’/g, "'").replace(/^[«"'“‘(\[]+/, '');
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

    lex.set(lexKey(form), { gloss: rest, ambiguous });
  });

  return lex;
}

export function loadLexicon(dir: string): Lexicon {
  const merged: Lexicon = new Map();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
    for (const [k, v] of parseLexicon(readFileSync(join(dir, f), 'utf8'), `lexicon/${f}`)) {
      merged.set(k, v);
    }
  }
  return merged;
}
