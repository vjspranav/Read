import { Link, useParams } from 'react-router-dom';
import { getRule, getStory, occurrencesOf, rulesByCategory, countFor } from '../content.js';
import './rules.css';

function Bar() {
  return (
    <div className="topbar">
      <Link className="ic" to="/stories" aria-label="All stories">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M9.5 3.5 5 8l4.5 4.5" />
        </svg>
      </Link>
      <span className="t">Grammar</span>
      <span style={{ width: 16 }} />
    </div>
  );
}

/** Every rule, grouped by category, with how often each one fires. */
export function RulesIndex() {
  const groups = rulesByCategory();

  return (
    <div className="shell">
      <Bar />
      <div className="page">
        <div className="rulehead">
          <h2>Grammar</h2>
          <p>Every pattern the stories explain. Each one links to the places it actually happens.</p>
        </div>
        {groups.map(([category, list]) => (
          <section className="rulegroup" key={category}>
            <h3 className="label">{category}</h3>
            {list.map((r) => {
              const n = countFor(r.id);
              return (
                <Link className="ruleitem" to={`/rules/${r.id}`} key={r.id}>
                  <span className="rn">{r.name}</span>
                  <span className="rc">{n} place{n === 1 ? '' : 's'}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

/** One rule, and every line in the library where it fires. */
export function RuleDetail() {
  const { ruleId } = useParams();
  const rule = ruleId ? getRule(ruleId) : undefined;

  if (!rule) {
    return (
      <div className="shell"><Bar /><div className="page">
        <p className="rulehead">That rule is not here. <Link to="/rules" style={{ color: 'var(--accent)' }}>All grammar →</Link></p>
      </div></div>
    );
  }

  const where = occurrencesOf(rule.id);

  return (
    <div className="shell">
      <Bar />
      <div className="page">
        <div className="rulehead">
          <span className="eyebrow">{rule.category}</span>
          <h2>{rule.name}</h2>
        </div>

        <div className="rulebody">
          {rule.body.split(/\n\s*\n/).map((block, i) => {
            const lines = block.split('\n').filter(Boolean);
            if (lines.every((l) => l.trimStart().startsWith('-'))) {
              return (
                <ul key={i}>
                  {lines.map((l, j) => <li key={j}>{l.replace(/^\s*-\s*/, '').replace(/\*\*/g, '')}</li>)}
                </ul>
              );
            }
            return <p key={i}>{block.replace(/\n/g, ' ').replace(/\*\*/g, '')}</p>;
          })}
        </div>

        <h3 className="label" style={{ marginTop: 40 }}>
          Where this happens — {where.length} place{where.length === 1 ? '' : 's'}
        </h3>
        <div className="occlist">
          {where.map((o, i) => {
            const story = getStory(o.storyId);
            const line = story?.lines[o.lineIndex];
            return (
              <Link className="occrow" to={`/story/${o.storyId}`} key={i}>
                <span className="ospan">{o.span}</span>
                <span className="oline">{line?.en}</span>
                <span className="ostory">{o.storyTitle}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
