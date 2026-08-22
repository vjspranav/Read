import type { Line as LineData, Token } from '../content.js';

interface Props {
  line: LineData;
  index: number;
  revealed: boolean;
  annotated: Set<number>;
  isSelected: (i: number) => boolean;
  onTapWord: (i: number) => void;
  onTapLine: () => void;
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

/**
 * French sets a narrow no-break space before ? ! ; : and », where English
 * sets none. The tokenizer drops the original spacing, so put it back here.
 */
export function punctAfter(after: string): string {
  return /^[?!;:\u00BB]/.test(after) ? '\u202F' + after : after;
}

/** One French line, with its gloss and translation underneath. */
export function Line({ line, index, revealed, annotated, isSelected, onTapWord, onTapLine }: Props) {
  return (
    <div className={`line${revealed ? ' on' : ''}`} data-line={index} onClick={onTapLine}>
      <div className="fr">
        {line.fr.map((tok, i) => (
          <span className="w" key={i} data-tok={i}>
            {spaceBefore(line.fr, i) && (
              <span className={`sp${isSelected(i) && isSelected(i - 1) ? ' sel' : ''}`}> </span>
            )}
            {tok.before && <span className="punct">{tok.before}</span>}
            <span
              className={`f${annotated.has(i) ? ' ann' : ''}${isSelected(i) ? ' sel' : ''}`}
              onClick={(e) => { e.stopPropagation(); onTapWord(i); }}
            >
              {tok.t}
            </span>
            {tok.after && <span className="punct">{punctAfter(tok.after)}</span>}
            <span className="g" aria-hidden="true">{tok.g ?? ''}</span>
          </span>
        ))}
      </div>
      <div className="en">{line.en}</div>
    </div>
  );
}
