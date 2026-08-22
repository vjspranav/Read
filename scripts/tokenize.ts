import type { Token } from './types.js';

/**
 * Words that contain an apostrophe but are ONE word. Splitting these would
 * invent a grammar question that does not exist.
 */
const APOSTROPHE_WHOLE = new Set([
  "aujourd'hui", "quelqu'un", "quelqu'une", "quelqu'uns",
  "presqu'île", "entr'acte", "prud'hommes", "d'abord", "d'accord",
]);

/**
 * Elidable prefixes. `l'avait` splits into `l'` + `avait`, because elision is
 * exactly the thing a reader selects and asks about.
 */
const ELIDABLE = new Set([
  "l", "d", "j", "n", "m", "t", "s", "c", "y",
  "qu", "jusqu", "lorsqu", "puisqu", "quoiqu",
]);

/**
 * Pieces that, when they follow a hyphen, mean the hyphen is grammatical
 * rather than lexical — inversion, imperative pronouns, demonstratives.
 * `va-t-il` splits; `peut-être` does not.
 */
const HYPHEN_CLITICS = new Set([
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "moi", "toi", "lui", "leur", "le", "la", "les", "en", "y",
  "ce", "ci", "là", "t",
]);

const LEADING_PUNCT = /^[«"'“‘(\[—–-]+/;
/** Punctuation that belongs to the word BEFORE it, even standing alone. */
const CLOSERS = /^[»”’")\]}.,;:!?…]+/;
const TRAILING_PUNCT = /[.,;:!?…»"'”’)\]—–]+$/;

/** Split a whitespace-delimited chunk on its apostrophe, if it has a live one. */
function splitApostrophe(word: string): string[] {
  const lower = word.toLowerCase();
  if (APOSTROPHE_WHOLE.has(lower)) return [word];

  const i = word.search(/['’]/);
  if (i < 0) return [word];

  const head = word.slice(0, i);
  const rest = word.slice(i + 1);
  if (!ELIDABLE.has(head.toLowerCase()) || rest === '') return [word];

  // Keep the apostrophe attached to the prefix: `l'` + `avait`.
  return [word.slice(0, i + 1), ...splitApostrophe(rest)];
}

/** Split on hyphens, but only where the hyphen carries grammar. */
function splitHyphen(word: string): string[] {
  if (!word.includes('-')) return [word];

  const parts = word.split('-');
  if (parts.length < 2 || parts.some((p) => p === '')) return [word];

  const followers = parts.slice(1).map((p) => p.toLowerCase());
  if (!followers.every((p) => HYPHEN_CLITICS.has(p))) return [word];

  const out: string[] = [parts[0]];
  let hyphenTaken = false; // the previous piece already swallowed the joining hyphen
  for (let i = 1; i < parts.length; i++) {
    // A euphonic `t` sits between two hyphens: va-t-il -> Va, -t-, il
    const bothSides = parts[i].toLowerCase() === 't' && i < parts.length - 1;
    const lead = hyphenTaken ? '' : '-';
    out.push(bothSides ? `${lead}${parts[i]}-` : `${lead}${parts[i]}`);
    hyphenTaken = bothSides;
  }
  return out;
}

/**
 * Turn a French line into selectable tokens.
 *
 * Punctuation rides along in `after` so it renders in place but never becomes
 * part of a selection or an annotation span.
 */
export function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let pendingBefore = '';

  for (const chunk of line.trim().split(/\s+/)) {
    if (!chunk) continue;

    const lead = chunk.match(LEADING_PUNCT)?.[0] ?? '';
    let core = chunk.slice(lead.length);
    const trail = core.match(TRAILING_PUNCT)?.[0] ?? '';
    if (trail) core = core.slice(0, -trail.length);

    if (!core) {
      // A chunk of pure punctuation. Closing marks belong to the word before
      // them; opening marks wait for the word after.
      const close = chunk.match(CLOSERS)?.[0] ?? '';
      if (close && tokens.length) {
        const last = tokens[tokens.length - 1];
        last.after = (last.after ?? '') + close;
      }
      pendingBefore += close && tokens.length ? chunk.slice(close.length) : chunk;
      continue;
    }

    const pieces = splitApostrophe(core).flatMap(splitHyphen);
    const start = tokens.length;
    pieces.forEach((p, i) => {
      const tok: Token = { t: p };
      if (i === pieces.length - 1 && trail) tok.after = trail;
      tokens.push(tok);
    });

    const before = pendingBefore + lead;
    if (before) tokens[start].before = before;
    pendingBefore = '';
  }

  if (pendingBefore) {
    if (tokens.length) {
      const last = tokens[tokens.length - 1];
      last.after = (last.after ?? '') + pendingBefore;
    }
    // A line of nothing but punctuation yields no tokens, which is correct.
  }

  return tokens;
}

/** The plain words of a line, for span matching. */
export function words(tokens: Token[]): string[] {
  return tokens.map((t) => t.t);
}
