import { Link } from 'react-router-dom';
import { countFor, getRule, matchNotes, spanText, type Line, type Story } from '../content.js';

interface Props {
  story: Story;
  line: Line;
  lineIndex: number;
  from: number;
  to: number;
  onClose: () => void;
}

const ISSUE_BASE = 'https://github.com/vjspranav/Read/issues/new';

/** Turn **bold** into the serif emphasis the rule bodies use. */
function markup(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>,
  );
}

function RuleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/);
  return (
    <div className="rbody">
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter(Boolean);
        if (lines.every((l) => l.trimStart().startsWith('-'))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{markup(l.replace(/^\s*-\s*/, ''))}</li>)}</ul>;
        }
        return <p key={i} style={i ? { marginTop: 10 } : undefined}>{markup(b.replace(/\n/g, ' '))}</p>;
      })}
    </div>
  );
}

/**
 * Always reads top to bottom in the same order: what was selected, why this
 * sentence does it, the general rule, then everywhere else it fires.
 */
export function WhyPanel({ story, line, lineIndex, from, to, onClose }: Props) {
  const notes = matchNotes(line, from, to);
  const selected = line.fr.slice(from, to + 1);
  const phrase = spanText(line, from, to);

  const issue =
    `${ISSUE_BASE}?title=${encodeURIComponent(`Why: « ${phrase} »`)}` +
    `&body=${encodeURIComponent(
      `Story: ${story.title} (${story.id})\nLine ${lineIndex + 1}: ${line.en}\nPhrase: « ${phrase} »\n\nWhat I'd like explained:\n`,
    )}`;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Why is it written this way">
        <div className="grab" />

        {/* 1 — the selection, glossed word by word */}
        <div className="selstrip">
          <div className="story gloss-on">
            <div className="fr">
              {selected.map((tok, i) => (
                <span className="w" key={i}>
                  <span className="f">{tok.t}</span>
                  <span className="g">{tok.g ?? ''}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {notes.length === 0 && (
          <p className="nonote">
            No note here yet. The words above show what this literally says.
            {' '}
            <a className="ask" href={issue} target="_blank" rel="noreferrer">Ask about this →</a>
          </p>
        )}

        {notes.map((n, i) => {
          const rule = getRule(n.ruleId);
          const count = countFor(n.ruleId) - 1;
          return (
            <div className="notegroup" key={i}>
              {/* 2 — why this sentence does it this way */}
              <p className="note">{n.note}</p>

              {/* 3 — the general pattern, collapsed */}
              {rule && (
                <details className="disc">
                  <summary>
                    <span className="rname">{rule.name}</span>
                    <svg className="chev" width="14" height="14" viewBox="0 0 16 16" fill="none"
                      stroke="currentColor" strokeWidth="1.5"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
                  </summary>
                  <RuleBody body={rule.body} />
                </details>
              )}

              {/* 4 — everywhere else it fires */}
              {rule && count > 0 && (
                <Link className="occ" to={`/rules/${rule.id}`} onClick={onClose}>
                  This same rule appears in {count} other place{count === 1 ? '' : 's'}
                  <span className="arrow">→</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
