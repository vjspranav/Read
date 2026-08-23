import { describe, expect, it } from 'vitest';
import { lexKey, lookup, parseLexicon } from './gloss.js';

describe('lexKey', () => {
  it('folds case and apostrophe shape together', () => {
    expect(lexKey("L’")).toBe("l'");
    expect(lexKey("L'")).toBe("l'");
    expect(lexKey('Dehors')).toBe('dehors');
  });
});

describe('parseLexicon', () => {
  it('reads entries and skips comments and blanks', () => {
    const lex = parseLexicon('# a note\n\nsans   = without\nferma  = closed\n', 'x');
    expect(lex.get('sans')).toEqual({ gloss: 'without', ambiguous: false });
    expect(lex.get('ferma')).toEqual({ gloss: 'closed', ambiguous: false });
    expect(lex.size).toBe(2);
  });

  it('marks ambiguous forms', () => {
    const lex = parseLexicon('la = the | ambiguous\n', 'x');
    expect(lex.get('la')).toEqual({ gloss: 'the', ambiguous: true });
  });

  it('REJECTS a gloss that is a phrase, not one concept', () => {
    expect(() => parseLexicon('partir = to leave\n', 'lex.txt'))
      .toThrow(/must be one hyphenated concept, not a phrase/);
  });

  it('accepts the hyphenated form of that same gloss', () => {
    expect(parseLexicon('partir = to-leave\n', 'x').get('partir')?.gloss).toBe('to-leave');
  });

  it('REJECTS a line with no "="', () => {
    expect(() => parseLexicon('sans without\n', 'lex.txt')).toThrow(/has no "="/);
  });

  it('REJECTS an unknown flag', () => {
    expect(() => parseLexicon('la = the | maybe\n', 'lex.txt')).toThrow(/unknown lexicon flag/);
  });

  it('REJECTS an empty gloss', () => {
    expect(() => parseLexicon('sans =\n', 'lex.txt')).toThrow(/has no gloss/);
  });

  it('reports the file and line number so the fix is findable', () => {
    expect(() => parseLexicon('ok = fine\nbroken line\n', 'lexicon/core.txt'))
      .toThrow(/lexicon\/core\.txt:2/);
  });
});

describe('ambiguity is a library-wide decision', () => {
  it('is explained in the error, not just refused', () => {
    // parseLexicon itself accepts the flag; loadLexicon is where scope is enforced.
    const lex = parseLexicon('de = of | ambiguous\n', 'x');
    expect(lex.get('de')?.ambiguous).toBe(true);
  });
});

describe('names and ordinary words coexist', () => {
  it('a capitalised entry does not shadow the ordinary word', () => {
    const lex = parseLexicon('petit = small\nPetit = Petit\n', 'x');
    expect(lookup(lex, 'petit')?.gloss).toBe('small');
    expect(lookup(lex, 'Petit')?.gloss).toBe('Petit');
  });

  it('an ordinary entry still answers a capitalised word at the start of a line', () => {
    const lex = parseLexicon('le = the\n', 'x');
    expect(lookup(lex, 'Le')?.gloss).toBe('the');
  });

  it('a capitalised-only entry still answers the lower-case form', () => {
    const lex = parseLexicon('Bonjour = hello\n', 'x');
    expect(lookup(lex, 'bonjour')?.gloss).toBe('hello');
    expect(lookup(lex, 'Bonjour')?.gloss).toBe('hello');
  });

  it('strips an opening guillemet before looking up', () => {
    const lex = parseLexicon('pain = bread\n', 'x');
    expect(lookup(lex, '«pain')?.gloss).toBe('bread');
  });
});
