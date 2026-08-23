import { describe, expect, it } from 'vitest';
import { parseStory } from './parse-story.js';

const HEAD = `---
id: t
title: Titre
titleEn: Title
length: one-page
level: A2
tone: everyday
summary: A summary.
---
`;

describe('parseStory', () => {
  it('reads blocks, notes and overrides', () => {
    const { meta, blocks } = parseStory(HEAD + `
fr  Elle ne l'avait pas entendu partir.
en  She hadn't heard him leave.
?   ne ... pas | negation-wraps-verb
    The pair wraps the helping verb,
    not the participle.
=   la | her

fr  Dehors, il pleuvait encore.
en  Outside, it was still raining.
`, 'x');

    expect(meta.id).toBe('t');
    expect(blocks).toHaveLength(2);
    expect(blocks[0].notes[0].ruleId).toBe('negation-wraps-verb');
    expect(blocks[0].notes[0].note).toBe('The pair wraps the helping verb, not the participle.');
    expect(blocks[0].overrides[0]).toEqual({ word: 'la', gloss: 'her' });
    expect(blocks[1].fr).toBe('Dehors, il pleuvait encore.');
  });

  it('records an explicit occurrence', () => {
    const { blocks } = parseStory(HEAD + `
fr  La porte de la maison.
en  The door of the house.
?   la | elision | 2
    The second one.
`, 'x');
    expect(blocks[0].notes[0].occurrence).toBe(2);
    expect(blocks[0].notes[0].explicit).toBe(true);
  });

  it('FAILS when a block has no translation', () => {
    expect(() => parseStory(HEAD + '\nfr  Bonjour.\n', 'story.txt'))
      .toThrow(/has no "en" translation/);
  });

  it('FAILS on frontmatter that is missing a field', () => {
    expect(() => parseStory('---\nid: t\n---\nfr  A.\nen  B.\n', 'story.txt'))
      .toThrow(/missing "title"/);
  });

  it('FAILS on an unknown level', () => {
    expect(() => parseStory(HEAD.replace('level: A2', 'level: C1') + '\nfr  A.\nen  B.\n', 'story.txt'))
      .toThrow(/must be one of A2, A2-B1, B1/);
  });

  it('FAILS on an unknown length', () => {
    expect(() => parseStory(HEAD.replace('one-page', 'novella') + '\nfr  A.\nen  B.\n', 'story.txt'))
      .toThrow(/must be one of one-page, two-page, chapter/);
  });

  it('FAILS on an unreadable directive', () => {
    expect(() => parseStory(HEAD + '\nfr  A.\nen  B.\nxx  huh\n', 'story.txt'))
      .toThrow(/expected fr, en, \? or =/);
  });

  it('FAILS when "?" has no rule id', () => {
    expect(() => parseStory(HEAD + '\nfr  A.\nen  B.\n?   A\n', 'story.txt'))
      .toThrow(/needs  span \| rule-id/);
  });

  it('FAILS on two fr lines in one block', () => {
    expect(() => parseStory(HEAD + '\nfr  A.\nen  B.\nfr  C.\n', 'story.txt'))
      .toThrow(/one French line per block/);
  });

  it('ignores comment lines', () => {
    const { blocks } = parseStory(HEAD + '\n# a comment\nfr  A.\nen  B.\n', 'x');
    expect(blocks).toHaveLength(1);
  });
});
