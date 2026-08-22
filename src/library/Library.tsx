import { useState } from 'react';
import { Link } from 'react-router-dom';
import { stories } from '../content.js';
import './library.css';

type Filter = 'all' | 'one-page' | 'two-page' | 'chapter';
const FILTERS: [Filter, string][] = [
  ['all', 'Everything'], ['one-page', 'One page'], ['two-page', 'Two pages'], ['chapter', 'Chapters'],
];
const TICKS: Record<string, number> = { 'one-page': 1, 'two-page': 2, chapter: 3 };
const LABEL: Record<string, string> = { 'one-page': 'One page', 'two-page': 'Two pages', chapter: 'Chapter' };

export function Library() {
  const [filter, setFilter] = useState<Filter>('all');
  const shown = stories.filter((s) => filter === 'all' || s.length === filter);

  return (
    <div className="shell">
      <div className="topbar">
        <span className="t" style={{ margin: 0, fontSize: 15, color: 'var(--ink)' }}>Stories</span>
        <Link className="ic" to="/rules" style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 500 }}>
          Grammar
        </Link>
      </div>

      <div className="page">
        <div className="shelfhead">
          <h2>Stories</h2>
          <div className="filters">
            {FILTERS.map(([v, label]) => (
              <button key={v} className={`chip${filter === v ? ' on' : ''}`}
                aria-pressed={filter === v} onClick={() => setFilter(v)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="shelf">
          {shown.map((s) => (
            <Link className="book" to={`/story/${s.id}`} key={s.id}>
              <span className="sub">{s.titleEn}</span>
              <span className="mid">
                <span className="bt">{s.title}</span>
                <span className="bs">{s.summary}</span>
              </span>
              <span className="len">
                <span className="ticks">
                  {[0, 1, 2].map((i) => <i key={i} className={i < (TICKS[s.length] ?? 1) ? 'f' : ''} />)}
                </span>
                {LABEL[s.length] ?? s.length}
              </span>
            </Link>
          ))}
        </div>

        {shown.length === 0 && <p className="empty">Nothing of that length yet.</p>}
      </div>
    </div>
  );
}
