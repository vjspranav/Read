import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize.js';

const w = (s: string) => tokenize(s).map((t) => t.t);

describe('tokenize', () => {
  it('splits a plain line into words', () => {
    expect(w('Dehors, il pleuvait encore.')).toEqual(['Dehors', 'il', 'pleuvait', 'encore']);
  });

  it('keeps trailing punctuation out of the token but renders it', () => {
    const t = tokenize('Dehors, il pleuvait encore.');
    expect(t[0]).toEqual({ t: 'Dehors', after: ',' });
    expect(t[3]).toEqual({ t: 'encore', after: '.' });
  });

  it('splits elision so l’ can be selected alone', () => {
    expect(w("Elle ne l'avait pas entendu partir.")).toEqual(
      ['Elle', 'ne', "l'", 'avait', 'pas', 'entendu', 'partir'],
    );
  });

  it('splits jusqu’à', () => {
    expect(w("Il marcha jusqu'à la gare.")).toEqual(['Il', 'marcha', "jusqu'", 'à', 'la', 'gare']);
  });

  it('handles the typographic apostrophe the same way', () => {
    expect(w('Elle l’avait vu.')).toEqual(['Elle', 'l’', 'avait', 'vu']);
  });

  it("keeps aujourd'hui as one word", () => {
    expect(w("Aujourd'hui il pleut.")).toEqual(["Aujourd'hui", 'il', 'pleut']);
  });

  it("keeps quelqu'un as one word", () => {
    expect(w("Quelqu'un a frappé.")).toEqual(["Quelqu'un", 'a', 'frappé']);
  });

  it('splits euphonic -t- in inversion', () => {
    expect(w('Va-t-il partir ?')).toEqual(['Va', '-t-', 'il', 'partir']);
  });

  it('splits est-ce que', () => {
    expect(w('Est-ce que tu viens ?')).toEqual(['Est', '-ce', 'que', 'tu', 'viens']);
  });

  it('splits imperative pronouns', () => {
    expect(w('Dis-moi tout.')).toEqual(['Dis', '-moi', 'tout']);
  });

  it('does NOT split lexical hyphens', () => {
    expect(w('Peut-être demain.')).toEqual(['Peut-être', 'demain']);
    expect(w('Au-dessus de la porte.')).toEqual(['Au-dessus', 'de', 'la', 'porte']);
  });

  it('leaves quotation marks unselectable rather than making them words', () => {
    // Guillemets are punctuation: they render, but nobody selects them.
    expect(w('Il dit « bonjour ».')).toEqual(['Il', 'dit', 'bonjour']);
  });

  it('keeps an opening guillemet that starts the line, rather than dropping it', () => {
    const t = tokenize('« Tu es rentré tôt », dit-elle.');
    expect(t.map((x) => x.t)).toEqual(['Tu', 'es', 'rentré', 'tôt', 'dit', '-elle']);
    expect(t[0].before).toBe('«');          // it survives
    expect(t[3].after).toBe('»,');          // and closes where it should
  });

  it('never folds punctuation into the word itself', () => {
    // Token text stays clean so gloss lookup and span matching are exact.
    for (const tok of tokenize('« Dehors », il pleuvait.')) {
      expect(tok.t).not.toMatch(/[«».,]/);
    }
  });

  it('splits a longer inversion chain correctly', () => {
    expect(w('Parle-t-elle français ?')).toEqual(['Parle', '-t-', 'elle', 'français']);
    expect(w('Dit-il vrai ?')).toEqual(['Dit', '-il', 'vrai']);
  });

  it('handles an empty line', () => {
    expect(w('')).toEqual([]);
  });
});
