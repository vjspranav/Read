import bundle from './generated/content.json';
import type { Annotation, Bundle, Line, Occurrence, Rule, Story, Token } from '../scripts/types.js';

export type { Annotation, Line, Occurrence, Rule, Story, Token };

const data = bundle as unknown as Bundle;

export const stories: Story[] = data.stories;
export const rules: Rule[] = data.rules;
export const occurrences: Occurrence[] = data.occurrences;

const byStory = new Map(stories.map((s) => [s.id, s]));
const byRule = new Map(rules.map((r) => [r.id, r]));

export const getStory = (id: string) => byStory.get(id);
export const getRule = (id: string) => byRule.get(id);

/** Every place a rule fires, for the cross-story occurrence list. */
export function occurrencesOf(ruleId: string): Occurrence[] {
  return occurrences.filter((o) => o.ruleId === ruleId);
}

export function countFor(ruleId: string): number {
  return occurrencesOf(ruleId).length;
}

/** Rules grouped by category, for the index page. */
export function rulesByCategory(): [string, Rule[]][] {
  const groups = new Map<string, Rule[]>();
  for (const r of rules) {
    if (!groups.has(r.category)) groups.set(r.category, []);
    groups.get(r.category)!.push(r);
  }
  for (const list of groups.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return [...groups].sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Notes relevant to a token selection, best match first.
 *
 * A selection is never a dead end: even with nothing here, the panel still
 * shows the literal gloss of what was selected.
 */
export function matchNotes(line: Line, from: number, to: number): Annotation[] {
  const rank = (n: Annotation): number => {
    if (n.from === from && n.to === to) return 0;        // exact
    if (n.from <= from && n.to >= to) return 1;          // contains the selection
    if (n.from >= from && n.to <= to) return 2;          // sits inside it
    if (n.from <= to && n.to >= from) return 3;          // merely overlaps
    return 99;
  };
  return line.notes
    .map((n) => ({ n, r: rank(n) }))
    .filter((x) => x.r < 99)
    .sort((a, b) => a.r - b.r || (a.n.to - a.n.from) - (b.n.to - b.n.from))
    .map((x) => x.n);
}

/** The plain French of a token range, for display and for speech. */
export function spanText(line: Line, from: number, to: number): string {
  return line.fr.slice(from, to + 1).map((t) => t.t).join(' ').replace(/\s+(?=')/g, '');
}

/** The whole French line as a sentence, punctuation included. */
export function lineText(line: Line): string {
  return line.fr.map((t) => (t.before ?? '') + t.t + (t.after ?? '')).join(' ');
}
