/** Shared shapes. `scripts/` produces these; `src/` only ever reads them. */

export interface Token {
  /** The token text as it appears, minus surrounding punctuation. */
  t: string;
  /** Punctuation that precedes this token, rendered but not selectable. */
  before?: string;
  /** Punctuation that trails this token, rendered but not selectable. */
  after?: string;
  /** Literal gloss. Absent when the lexicon had nothing to say. */
  g?: string;
}

export interface Annotation {
  /** Inclusive token range this note covers. */
  from: number;
  to: number;
  ruleId: string;
  note: string;
}

export interface Line {
  fr: Token[];
  en: string;
  notes: Annotation[];
}

export type StoryLength = 'one-page' | 'two-page' | 'chapter';

export interface Story {
  id: string;
  title: string;
  titleEn: string;
  length: StoryLength;
  tone: string;
  summary: string;
  lines: Line[];
}

export interface Rule {
  id: string;
  name: string;
  category: string;
  /** Markdown body. */
  body: string;
}

/** Where a rule fires, for the cross-story occurrence list. */
export interface Occurrence {
  ruleId: string;
  storyId: string;
  storyTitle: string;
  lineIndex: number;
  /** The French span, joined for display. */
  span: string;
}

export interface Bundle {
  stories: Story[];
  rules: Rule[];
  occurrences: Occurrence[];
}
