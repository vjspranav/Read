import { describe, expect, it } from 'vitest';
import { punctAfter, spaceBefore } from './Line.js';
import { tokenize } from '../../scripts/tokenize.js';

/** What the reader actually paints on screen, spaces and all. */
function rendered(french: string): string {
  const toks = tokenize(french);
  return toks
    .map((t, i) => (spaceBefore(toks, i) ? ' ' : '') + (t.before ?? '') + t.t + (t.after ? punctAfter(t.after) : ''))
    .join('');
}

describe('the French renders as written French', () => {
  it('puts spaces between ordinary words', () => {
    expect(rendered('Le vieil homme ferma la porte sans bruit.'))
      .toBe('Le vieil homme ferma la porte sans bruit.');
  });

  it('keeps an elided prefix joined to its word', () => {
    expect(rendered("Elle ne l'avait pas entendu partir."))
      .toBe("Elle ne l'avait pas entendu partir.");
  });

  it("keeps jusqu'à joined", () => {
    expect(rendered("Il marcha jusqu'à la gare, les mains dans les poches."))
      .toBe("Il marcha jusqu'à la gare, les mains dans les poches.");
  });

  it('keeps inversion hyphens tight', () => {
    expect(rendered('Va-t-il partir ?')).toBe('Va-t-il partir\u202F?');
    expect(rendered('Est-ce que tu viens ?')).toBe('Est-ce que tu viens\u202F?');
    expect(rendered('Dis-moi tout.')).toBe('Dis-moi tout.');
  });

  it('handles quotation marks', () => {
    expect(rendered('Il dit « bonjour ».')).toBe('Il dit «bonjour\u202F».');
  });

  it('round-trips every line of every story', async () => {
    const { stories } = await import('../content.js');
    for (const story of stories) {
      for (const line of story.lines) {
        const text = line.fr
          .map((t, i) => (spaceBefore(line.fr, i) ? ' ' : '') + (t.before ?? '') + t.t + (t.after ? punctAfter(t.after) : ''))
          .join('');
        // No word may be glued to the next one.
        expect(text).not.toMatch(/[a-zà-ÿ]{25,}/i);
        expect(text.length).toBeGreaterThan(10);
      }
    }
  });
});
