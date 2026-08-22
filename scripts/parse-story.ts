import { tokenize } from './tokenize.js';
import { lexKey } from './gloss.js';
import type { Line, Story, StoryLength } from './types.js';

export interface RawNote { span: string; ruleId: string; occurrence: number; explicit: boolean; note: string; }
export interface RawOverride { word: string; gloss: string; }
export interface RawBlock { fr: string; en: string; notes: RawNote[]; overrides: RawOverride[]; line: number; }

const LENGTHS: StoryLength[] = ['one-page', 'two-page', 'chapter'];

function frontmatter(text: string, where: string): [Record<string, string>, string, number] {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error(`${where}  missing the --- frontmatter block at the top`);

  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const c = line.indexOf(':');
    if (c < 0) throw new Error(`${where}  frontmatter line has no ":":  ${line}`);
    meta[line.slice(0, c).trim()] = line.slice(c + 1).trim();
  }
  const consumed = m[0].split(/\r?\n/).length - 1;
  return [meta, text.slice(m[0].length), consumed];
}

/** Split the body into blocks and read the fr / en / ? / = directives. */
export function parseBlocks(body: string, where: string, offset: number): RawBlock[] {
  const blocks: RawBlock[] = [];
  let cur: RawBlock | null = null;
  let pending: RawNote | null = null;

  const push = () => { if (cur) { blocks.push(cur); cur = null; } pending = null; };
  const lines = body.split(/\r?\n/);

  lines.forEach((raw, i) => {
    const no = offset + i + 1;

    if (!raw.trim()) { push(); return; }
    if (raw.trimStart().startsWith('#')) return;

    // A continuation line: indented, and we are inside a note.
    if (/^\s{4,}\S/.test(raw) && pending) {
      pending.note += (pending.note ? ' ' : '') + raw.trim();
      return;
    }

    const m = raw.match(/^(fr|en|\?|=)\s+(.*)$/);
    if (!m) throw new Error(`${where}:${no}  cannot read this line — expected fr, en, ? or =:\n    ${raw}`);

    const [, kind, value] = m;
    if (kind !== '?') pending = null;

    if (kind === 'fr') {
      if (cur) throw new Error(`${where}:${no}  a second "fr" before a blank line — one French line per block`);
      cur = { fr: value.trim(), en: '', notes: [], overrides: [], line: no };
      return;
    }
    if (!cur) throw new Error(`${where}:${no}  "${kind}" before any "fr" line`);

    if (kind === 'en') {
      if (cur.en) throw new Error(`${where}:${no}  two "en" lines in one block`);
      cur.en = value.trim();
      return;
    }
    if (kind === '=') {
      const p = value.split('|').map((s) => s.trim());
      if (p.length !== 2 || !p[0] || !p[1]) throw new Error(`${where}:${no}  "=" needs  word | gloss`);
      cur.overrides.push({ word: p[0], gloss: p[1] });
      return;
    }
    // kind === '?'
    const p = value.split('|').map((s) => s.trim());
    if (p.length < 2 || !p[0] || !p[1]) throw new Error(`${where}:${no}  "?" needs  span | rule-id`);
    const occurrence = p[2] ? Number(p[2]) : 1;
    if (p[2] && (!Number.isInteger(occurrence) || occurrence < 1)) {
      throw new Error(`${where}:${no}  occurrence must be a whole number 1 or greater, got "${p[2]}"`);
    }
    pending = { span: p[0], ruleId: p[1], occurrence, explicit: Boolean(p[2]), note: '' };
    cur.notes.push(pending);
  });

  push();
  return blocks;
}

export function parseStory(text: string, where: string) {
  const [meta, body, consumed] = frontmatter(text, where);

  for (const k of ['id', 'title', 'titleEn', 'length', 'tone', 'summary']) {
    if (!meta[k]) throw new Error(`${where}  frontmatter is missing "${k}"`);
  }
  if (!LENGTHS.includes(meta.length as StoryLength)) {
    throw new Error(`${where}  length is "${meta.length}" — must be one of ${LENGTHS.join(', ')}`);
  }

  const blocks = parseBlocks(body, where, consumed);
  if (!blocks.length) throw new Error(`${where}  has no French lines`);
  for (const b of blocks) {
    if (!b.en) throw new Error(`${where}:${b.line}  this block has no "en" translation`);
  }

  return { meta, blocks };
}

export { tokenize, lexKey };
export type { Line, Story };
