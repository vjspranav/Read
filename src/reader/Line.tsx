import type React from 'react';
import type { Line as LineData, Token } from '../content.js';

interface Props {
  line: LineData;
  index: number;
  revealed: boolean;
  annotated: Set<number>;
  isSelected: (i: number) => boolean;
  onTapWord: (i: number) => void;
  onTapLine: () => void;
  onKey: (e: React.KeyboardEvent) => void;
}

/**
 * Whether a space belongs before token `i`.
 *
 * The tokenizer splits `l'avait` and `va-t-il` apart so each piece can be
 * selected on its own, but they must still render as written French: no space
 * after an elided prefix, and none around a hyphen.
 */
export function spaceBefore(tokens: Token[], i: number): boolean {
  if (i === 0) return false;
  const prev = tokens[i - 1].t;
  const cur = tokens[i].t;
  if (/['’-]$/.test(prev)) return false;   // l' avait  ·  va-t- il
  if (/^-/.test(cur)) return false;        // est -ce
  return true;
}

const NARROW = '\u202F';   // narrow no-break space

/**
 * French sets a narrow no-break space before ? ! ; : and », where English sets
 * none — and inside an opening guillemet. The tokenizer drops the original
 * spacing, so put it back.
 *
 * Applies to every mark in a run, not just the first: `?»` has to come out as
 * ` ? »`, while `.` and `,` take no space at all.
 */
export function punctAfter(after: string): string {
  return [...after].map((c) => (/[?!;:\u00BB]/.test(c) ? NARROW + c : c)).join('');
}

/** An opening guillemet is followed by a narrow space: « comme ceci ». */
export function punctBefore(before: string): string {
  return /[\u00AB]$/.test(before) ? before + NARROW : before;
}

/** One French line, with its gloss and translation underneath. */
export function Line({ line, index, revealed, annotated, isSelected, onTapWord, onTapLine, onKey }: Props) {
  return (
    <div
      className={`line${revealed ? ' on' : ''}`}
      data-line={index}
      onClick={onTapLine}
      onKeyDown={onKey}
      tabIndex={0}
      role="group"
      aria-label={`Line ${index + 1}. ${line.en}`}
    >
      <div className="fr">
        {line.fr.map((tok, i) => (
          <span className="w" key={i} data-tok={i}>
            {spaceBefore(line.fr, i) && (
              <span className={`sp${isSelected(i) && isSelected(i - 1) ? ' sel' : ''}`}> </span>
            )}
            {tok.before && <span className="punct">{punctBefore(tok.before)}</span>}
            <span
              className={`f${annotated.has(i) ? ' ann' : ''}${isSelected(i) ? ' sel' : ''}`}
              onClick={(e) => { e.stopPropagation(); onTapWord(i); }}
              role="button"
              aria-pressed={isSelected(i)}
              aria-label={tok.g ? `${tok.t}, ${tok.g}` : tok.t}
            >
              {tok.t}
            </span>
            {tok.after && <span className="punct">{punctAfter(tok.after)}</span>}
            <span className="g" aria-hidden="true">{tok.g ?? ''}</span>
          </span>
        ))}
      </div>
      {/* The faded English is itself the reveal target. Tapping "the line"
          mostly means tapping a word, and a word tap selects instead. */}
      <div
        className="en"
        onClick={(e) => { e.stopPropagation(); onTapLine(); }}
        role="button"
        tabIndex={-1}
        aria-label={revealed ? line.en : `Reveal the translation of line ${index + 1}`}
      >
        {line.en}
      </div>
    </div>
  );
}
