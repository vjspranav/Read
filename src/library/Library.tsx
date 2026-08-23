import { useState } from 'react';
import { Link } from 'react-router-dom';
import { stories } from '../content.js';
import { useProgress } from '../settings/useProgress.js';
import './library.css';

type Filter = 'all' | 'one-page' | 'two-page' | 'chapter';
const FILTERS: [Filter, string][] = [
  ['all', 'Everything'], ['one-page', 'One page'], ['two-page', 'Two pages'], ['chapter', 'Chapters'],
];
const TICKS: Record<string, number> = { 'one-page': 1, 'two-page': 2, chapter: 3 };
const LABEL: Record<string, string> = { 'one-page': 'One page', 'two-page': 'Two pages', chapter: 'Chapter' };

export function Library() {
  const [filter, setFilter] = useState<Filter>('all');
  const progress = useProgress();
  const shown = stories.filter((s) => filter === 'all' || s.length === filter);

  // The most recently opened story that is not finished.
  const resume = stories
    .filter((s) => progress[s.id] && !progress[s.id].done && progress[s.id].line > 1)
    .sort((a, b) => progress[b.id].at - progress[a.id].at)[0];

  return (
    <div className="shell">
      <div className="topbar">
        <span className="t" style={{ margin: 0, fontSize: 15, color: 'var(--ink)' }}>Read</span>
        <Link className="ic navlink" to="/rules" style={{ marginLeft: 'auto' }}>Grammar</Link>
      </div>

      <div className="page">
        <header className="masthead">
          <h1>French, line&nbsp;by&nbsp;line</h1>
          <p className="lede">
            Short stories with the English underneath. Select any phrase and ask why it is
            written the way it is — the answer is written by hand, not guessed.
          </p>
        </header>

        {resume && (
          <Link className="resume" to={`/story/${resume.id}`}>
            <span className="rk">Continue</span>
            <span className="rt">{resume.title}</span>
            <span className="rp">
              line {progress[resume.id].line + 1} of {resume.lines.length}
            </span>
          </Link>
        )}

        <div className="shelfhead">
          <h2>Stories</h2>
          <p className="levelnote">
            A2 is the plain end — everyday words, present and past. B1 asks more of you.
          </p>
          <div className="filters">
            {FILTERS.map(([v, label]) => (
              <button key={v} className={`chip${filter === v ? ' on' : ''}`}
                aria-pressed={filter === v} onClick={() => setFilter(v)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="shelf">
          {shown.map((s) => {
            const mark = progress[s.id];
            const pct = mark ? Math.round(((mark.line + 1) / s.lines.length) * 100) : 0;
            return (
              <Link className="book" to={`/story/${s.id}`} key={s.id}>
                <span className="sub">{s.titleEn}</span>
                <span className="mid">
                  <span className="bt">{s.title}</span>
                  <span className="bs">{s.summary}</span>
                </span>
                {mark && (
                  <span className="state">
                    {mark.done ? 'Read' : `${pct}% read`}
                    <span className="meter"><i style={{ width: `${mark.done ? 100 : pct}%` }} /></span>
                  </span>
                )}
                <span className="len">
                  <span className={`lv lv-${s.level.toLowerCase()}`}>{s.level}</span>
                  <span className="ticks">
                    {[0, 1, 2].map((i) => <i key={i} className={i < (TICKS[s.length] ?? 1) ? 'f' : ''} />)}
                  </span>
                  {s.chapters ? `${s.chapters.length} chapters` : (LABEL[s.length] ?? s.length)}
                </span>
              </Link>
            );
          })}
        </div>

        {shown.length === 0 && <p className="empty">Nothing of that length yet.</p>}
      </div>
    </div>
  );
}
