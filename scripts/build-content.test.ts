import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { build as runBuild } from './build-content.js';

/**
 * These are the safety-net tests: each one breaks the content on purpose and
 * checks the build refuses it. A silently-wrong story is the failure mode that
 * matters most here, so every one of these must stay red-when-broken.
 */

const HEAD = `---
id: t
title: Titre
titleEn: Title
length: one-page
tone: everyday
summary: A summary.
---
`;

let dir: string | null = null;
afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = null; });

function build(story: string, lexicon: string, rules: Record<string, string> = {}) {
  dir = mkdtempSync(join(tmpdir(), 'read-'));
  mkdirSync(join(dir, 'stories')); mkdirSync(join(dir, 'rules')); mkdirSync(join(dir, 'lexicon'));
  writeFileSync(join(dir, 'stories', 't.txt'), story);
  writeFileSync(join(dir, 'lexicon', 'core.txt'), lexicon);
  for (const [id, body] of Object.entries(rules)) {
    writeFileSync(join(dir, 'rules', `${id}.md`), `---\nid: ${id}\nname: A rule\ncategory: verbs\n---\n${body}`);
  }
  return runBuild(dir, join(dir, 'out'));
}

const OK_STORY = HEAD + `
fr  Dehors, il pleuvait encore.
en  Outside, it was still raining.
?   pleuvait | imparfait
    It was going on, not finished.
`;
const OK_LEX = 'dehors = outside\nil = it\npleuvait = was-raining\nencore = still\n';

describe('build-content', () => {
  it('builds clean content and glosses every word', () => {
    const b = build(OK_STORY, OK_LEX, { imparfait: 'The imparfait sets a scene.' });
    expect(b.stories).toHaveLength(1);
    expect(b.stories[0].lines[0].fr.map((t: any) => t.g)).toEqual(['outside', 'it', 'was-raining', 'still']);
    expect(b.stories[0].lines[0].notes[0].ruleId).toBe('imparfait');
    expect(b.occurrences).toHaveLength(1);
  });

  it('FAILS on a span that is not in the line', () => {
    const s = HEAD + '\nfr  Dehors, il pleuvait encore.\nen  Outside.\n?   chien | imparfait\n    A note.\n';
    expect(() => build(s, OK_LEX, { imparfait: 'x' })).toThrow(/does not appear in this line/);
  });

  it('FAILS on an ambiguous span with no occurrence', () => {
    const s = HEAD + '\nfr  La porte de la maison.\nen  The door.\n?   la | imparfait\n    A note.\n';
    expect(() => build(s, 'porte = door\nde = of\nmaison = house\nla = the\n', { imparfait: 'x' }))
      .toThrow(/appears 2 times/);
  });

  it('FAILS on a rule id with no file', () => {
    const s = HEAD + '\nfr  Dehors, il pleuvait encore.\nen  Outside.\n?   pleuvait | no-such-rule\n    A note.\n';
    expect(() => build(s, OK_LEX)).toThrow(/has no file at content\/rules\/no-such-rule\.md/);
  });

  it('FAILS on an ambiguous word left without a gloss override', () => {
    const s = HEAD + '\nfr  La porte.\nen  The door.\n';
    expect(() => build(s, 'la = the | ambiguous\nporte = door\n'))
      .toThrow(/marked ambiguous in the lexicon, so this line needs an override/);
  });

  it('accepts that same word once the line overrides it', () => {
    const s = HEAD + '\nfr  La porte.\nen  The door.\n=   la | the\n';
    const b = build(s, 'la = the | ambiguous\nporte = door\n');
    expect(b.stories[0].lines[0].fr[0].g).toBe('the');
  });

  it('FAILS on an override for a word that is not in the line', () => {
    const s = HEAD + '\nfr  La porte.\nen  The door.\n=   chien | dog\n';
    expect(() => build(s, 'la = the\nporte = door\n'))
      .toThrow(/that word is not in this line/);
  });

  it('FAILS on an empty note', () => {
    const s = HEAD + '\nfr  Dehors, il pleuvait encore.\nen  Outside.\n?   pleuvait | imparfait\n';
    expect(() => build(s, OK_LEX, { imparfait: 'x' })).toThrow(/the note for "pleuvait" is empty/);
  });

  it('leaves an unglossed word unglossed rather than guessing', () => {
    const b = build(HEAD + '\nfr  Dehors, il pleuvait encore.\nen  Outside.\n', 'dehors = outside\n');
    const g = b.stories[0].lines[0].fr.map((t: any) => t.g);
    expect(g).toEqual(['outside', undefined, undefined, undefined]);
  });
});
