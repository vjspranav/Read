import type { Line as LineData } from '../content.js';

interface Props {
  line: LineData;
  index: number;
  revealed: boolean;
  annotated: Set<number>;
  isSelected: (i: number) => boolean;
  onTapWord: (i: number) => void;
  onTapLine: () => void;
}

/** One French line, with its gloss and translation underneath. */
export function Line({ line, index, revealed, annotated, isSelected, onTapWord, onTapLine }: Props) {
  return (
    <div className={`line${revealed ? ' on' : ''}`} data-line={index} onClick={onTapLine}>
      <div className="fr">
        {line.fr.map((tok, i) => (
          <span className="w" key={i} data-tok={i}>
            {tok.before && <span className="punct">{tok.before}</span>}
            <span
              className={`f${annotated.has(i) ? ' ann' : ''}${isSelected(i) ? ' sel' : ''}`}
              onClick={(e) => { e.stopPropagation(); onTapWord(i); }}
            >
              {tok.t}
            </span>
            {tok.after && <span className="punct">{tok.after}</span>}
            <span className="g" aria-hidden="true">{tok.g ?? ''}</span>
          </span>
        ))}
      </div>
      <div className="en">{line.en}</div>
    </div>
  );
}
