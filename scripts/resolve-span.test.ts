import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize.js';
import { findSpans, resolveSpan } from './resolve-span.js';

const toks = (s: string) => tokenize(s).map((t) => t.t);

describe('findSpans', () => {
  const line = toks("Elle ne l'avait pas entendu partir.");

  it('finds a single word', () => {
    expect(findSpans(line, 'entendu')).toEqual([{ from: 5, to: 5 }]);
  });

  it('finds an elided token', () => {
    expect(findSpans(line, "l'")).toEqual([{ from: 2, to: 2 }]);
  });

  it('matches ne ... pas across the words between', () => {
    expect(findSpans(line, 'ne ... pas')).toEqual([{ from: 1, to: 4 }]);
  });

  it('finds a consecutive run', () => {
    const l = toks('Il marcha jusqu\'à la gare, les mains dans les poches.');
    expect(findSpans(l, 'les mains dans les poches')).toEqual([{ from: 6, to: 10 }]);
  });

  it('ignores case and punctuation', () => {
    expect(findSpans(toks('Dehors, il pleuvait encore.'), 'dehors')).toEqual([{ from: 0, to: 0 }]);
  });

  it('reports every occurrence', () => {
    const l = toks('La porte de la maison.');
    expect(findSpans(l, 'la')).toEqual([{ from: 0, to: 0 }, { from: 3, to: 3 }]);
  });

  it('returns nothing when absent', () => {
    expect(findSpans(line, 'chien')).toEqual([]);
  });
});

describe('spans written as natural French', () => {
  it("matches jusqu'à written solid, not just jusqu' à", () => {
    const l = toks("Il marcha jusqu'à la gare.");
    expect(findSpans(l, "jusqu'à")).toEqual([{ from: 2, to: 3 }]);
    expect(findSpans(l, "jusqu' à")).toEqual([{ from: 2, to: 3 }]); // both forms work
  });

  it("matches a multi-word span containing elision", () => {
    const l = toks("Il s'était arrêté au coin de la rue.");
    expect(findSpans(l, "s'était arrêté")).toEqual([{ from: 1, to: 3 }]);
  });

  it("matches n'y avait plus", () => {
    const l = toks("Il n'y avait plus de bureau.");
    expect(findSpans(l, "n'y avait plus")).toEqual([{ from: 1, to: 4 }]);
  });

  it('ignores punctuation inside a span', () => {
    const l = toks('Ce matin-là, il rentra à onze heures.');
    expect(findSpans(l, 'matin-là')).toEqual([{ from: 1, to: 2 }]);
  });
});

describe('resolveSpan — the build’s safety net', () => {
  const line = toks("Elle ne l'avait pas entendu partir.");

  it('resolves a clean span', () => {
    expect(resolveSpan(line, 'ne ... pas', 1, false, 'x')).toEqual({ from: 1, to: 4 });
  });

  it('FAILS when the span is not in the line', () => {
    expect(() => resolveSpan(line, 'le chien', 1, false, 'story.txt:12'))
      .toThrow(/does not appear in this line/);
  });

  it('FAILS on an ambiguous span with no occurrence given', () => {
    const l = toks('La porte de la maison.');
    expect(() => resolveSpan(l, 'la', 1, false, 'story.txt:3')).toThrow(/appears 2 times/);
  });

  it('accepts an ambiguous span once an occurrence is given', () => {
    const l = toks('La porte de la maison.');
    expect(resolveSpan(l, 'la', 2, true, 'x')).toEqual({ from: 3, to: 3 });
  });

  it('FAILS when the occurrence asked for does not exist', () => {
    expect(() => resolveSpan(line, 'entendu', 3, true, 'x')).toThrow(/occurrence 3 was asked for/);
  });

  it('names the line’s words in the error, so the fix is obvious', () => {
    expect(() => resolveSpan(line, 'lavait', 1, false, 'x')).toThrow(/l' and avait/);
  });
});
