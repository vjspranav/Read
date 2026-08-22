import { lexKey } from './gloss.js';
import { tokenize } from './tokenize.js';

/** Normalise for comparison: case, apostrophe shape, surrounding punctuation. */
export function norm(word: string): string {
  return lexKey(word).replace(/[.,;:!?…»"'”’)\]]+$/, '');
}

function findRun(hay: string[], needle: string[], from = 0): number {
  outer: for (let i = from; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

export interface Span { from: number; to: number; }

/**
 * Break a span into comparable words using the SAME tokenizer as the line.
 * This is what lets an author write `jusqu'à` naturally instead of `jusqu' à`.
 */
function spanWords(span: string): string[] {
  return tokenize(span).map((t) => norm(t.t)).filter(Boolean);
}

/**
 * Locate an annotation span within a line's tokens.
 *
 * `ne ... pas` matches `ne`, then the next `pas` after it, and covers
 * everything between. Everything else is a straight consecutive run.
 *
 * Returns every match, in order, so the caller can pick an occurrence and
 * complain precisely when the span is ambiguous or absent.
 */
export function findSpans(tokens: string[], span: string): Span[] {
  const hay = tokens.map(norm);
  const out: Span[] = [];

  if (span.includes('...')) {
    const [headRaw, tailRaw] = span.split('...');
    const head = spanWords(headRaw);
    const tail = spanWords(tailRaw);
    if (!head.length || !tail.length) throw new Error(`span "${span}" needs words on both sides of "..."`);

    let i = 0;
    while (i < hay.length) {
      const h = findRun(hay, head, i);
      if (h < 0) break;
      const t = findRun(hay, tail, h + head.length);
      if (t < 0) break;
      out.push({ from: h, to: t + tail.length - 1 });
      i = h + 1;
    }
    return out;
  }

  const needle = spanWords(span);
  if (!needle.length) throw new Error('empty span');

  let i = 0;
  while (i < hay.length) {
    const h = findRun(hay, needle, i);
    if (h < 0) break;
    out.push({ from: h, to: h + needle.length - 1 });
    i = h + 1;
  }
  return out;
}

/** Pick one occurrence, failing loudly when the author's span does not land. */
export function resolveSpan(
  tokens: string[],
  span: string,
  occurrence: number,
  explicit: boolean,
  where: string,
): Span {
  const hits = findSpans(tokens, span);

  if (!hits.length) {
    throw new Error(
      `${where}  span "${span}" does not appear in this line.\n` +
      `    the line's words are: ${tokens.join(' ')}\n` +
      `    remember l'avait is two tokens, l' and avait`,
    );
  }
  if (hits.length > 1 && !explicit) {
    throw new Error(
      `${where}  span "${span}" appears ${hits.length} times in this line.\n` +
      `    say which one you mean:  ${span} | <rule-id> | 2`,
    );
  }
  if (occurrence > hits.length) {
    throw new Error(
      `${where}  span "${span}" appears ${hits.length} time(s), but occurrence ${occurrence} was asked for`,
    );
  }
  return hits[occurrence - 1];
}
