import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStory, lineText, spanText } from '../content.js';
import { SIZES, useSettings } from '../settings/useSettings.js';
import { markFor, useTrackProgress } from '../settings/useProgress.js';
import { useSelection } from './useSelection.js';
import { Line } from './Line.js';
import { SelectionBar } from './SelectionBar.js';
import { SettingsPopover } from './Settings.js';
import { WhyPanel } from './WhyPanel.js';
import { speak } from './speak.js';
import './reader.css';

export function Reader() {
  const { id } = useParams();
  const story = id ? getStory(id) : undefined;

  const { settings, set } = useSettings();
  const { sel, tap, clear, has } = useSelection();
  const [why, setWhy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [reached, setReached] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const report = useTrackProgress(id, story?.lines.length ?? 0);

  // Which token indices carry a note, per line — for the dotted underline.
  const annotated = useMemo(() => {
    const map = new Map<number, Set<number>>();
    story?.lines.forEach((line, li) => {
      const s = new Set<number>();
      line.notes.forEach((n) => { for (let i = n.from; i <= n.to; i++) s.add(i); });
      map.set(li, s);
    });
    return map;
  }, [story]);

  // Which line is the reader looking at? Whichever is nearest the top of the
  // viewport but still on screen.
  useEffect(() => {
    if (!story || !bodyRef.current) return;
    // Progress tracking is a nicety; without it the story must still read.
    if (typeof IntersectionObserver === 'undefined') return;
    const lines = [...bodyRef.current.querySelectorAll('.line')];
    if (!lines.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        let furthest = -1;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.line);
          if (Number.isFinite(i)) furthest = Math.max(furthest, i);
        }
        if (furthest >= 0) {
          setReached((r) => Math.max(r, furthest));
          report(furthest);
        }
      },
      { rootMargin: '0px 0px -55% 0px' },
    );
    lines.forEach((l) => io.observe(l));
    return () => io.disconnect();
  }, [story, report]);

  // Pick up where they left off.
  useEffect(() => {
    if (!story || !id) return;
    const mark = markFor(id);
    if (!mark || mark.line < 2 || mark.done) return;
    const el = document.querySelector(`.line[data-line="${mark.line}"]`);
    el?.scrollIntoView({ block: 'center' });
  }, [story, id]);

  if (!story) {
    return (
      <div className="shell"><div className="page">
        <p className="storyhead" style={{ paddingTop: 60 }}>
          That story is not here. <Link to="/" style={{ color: 'var(--accent)' }}>See all stories →</Link>
        </p>
      </div></div>
    );
  }

  const revealed = (i: number) =>
    settings.reveal === 'always' ? true : settings.reveal === 'hidden' ? false : tapped.has(i);

  const toggleLine = (i: number) => {
    if (settings.reveal !== 'tap') return;
    setTapped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selLine = sel ? story.lines[sel.line] : null;

  return (
    <div className={`shell${why ? ' panel-open' : ''}`} onClick={() => { clear(); }}>
      <div className="topbar">
        <Link className="ic" to="/" aria-label="All stories">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9.5 3.5 5 8l4.5 4.5" />
          </svg>
        </Link>
        <span className="t">{story.title}</span>
        <span className="popwrap">
          <button className={`gear${showSettings ? ' on' : ''}`} aria-label="Reading settings"
            onClick={(e) => { e.stopPropagation(); setShowSettings((v) => !v); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.1" />
              <path d="M19.1 14.4a1.5 1.5 0 0 0 .3 1.65l.05.06a1.82 1.82 0 1 1-2.58 2.58l-.05-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.91 1.37v.16a1.82 1.82 0 1 1-3.64 0v-.08a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.05a1.82 1.82 0 1 1-2.58-2.58l.06-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.91h-.16a1.82 1.82 0 1 1 0-3.64h.08a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.06a1.82 1.82 0 1 1 2.58-2.58l.05.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .91-1.37v-.16a1.82 1.82 0 1 1 3.64 0v.08a1.5 1.5 0 0 0 .91 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.05a1.82 1.82 0 1 1 2.58 2.58l-.06.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.91h.16a1.82 1.82 0 1 1 0 3.64h-.08a1.5 1.5 0 0 0-1.37.91z" />
            </svg>
          </button>
          {showSettings && (
            <SettingsPopover settings={settings} set={set} onClose={() => setShowSettings(false)} />
          )}
        </span>
        <span
          className="progress"
          style={{ width: `${Math.round(((reached + 1) / story.lines.length) * 100)}%` }}
        />
      </div>

      <div className="page" ref={bodyRef}>
        <div className="storyhead">
          <span className="eyebrow">{story.length.replace('-', ' ')}</span>
          <h1>{story.title}</h1>
          <p className="sub">{story.titleEn}</p>
          <hr />
        </div>

        {!settings.greeted && settings.reveal === 'tap' && (
          <div className="nudge" onClick={(e) => e.stopPropagation()}>
            <p>The English sits right below each line, faded. Tap any line to reveal it — or keep it always on.</p>
            <div className="btns">
              <button className="btn btn-acc" onClick={() => { set('reveal', 'always'); set('greeted', true); }}>
                Always on
              </button>
              <button className="btn" onClick={() => set('greeted', true)}>Got it</button>
            </div>
          </div>
        )}

        <div
          className={
            `story live${settings.gloss ? ' gloss-on' : ''}` +
            `${settings.hints ? '' : ' hints-off'}` +
            ` reveal-${settings.reveal}`
          }
          style={{ ['--fr' as string]: SIZES[settings.size] }}
        >
          {story.lines.map((line, i) => (
            <Line
              key={i}
              line={line}
              index={i}
              revealed={revealed(i)}
              annotated={annotated.get(i) ?? new Set()}
              isSelected={(t) => has(i, t)}
              onTapWord={(t) => tap(i, t)}
              onTapLine={() => toggleLine(i)}
            />
          ))}
        </div>
      </div>

      {sel && selLine && !why && (
        <SelectionBar
          anchor={`${sel.line}:${sel.from}-${sel.to}`}
          onWhy={() => setWhy(true)}
          onListen={() => speak(spanText(selLine, sel.from, sel.to))}
        />
      )}

      {sel && selLine && why && (
        <WhyPanel
          story={story}
          line={selLine}
          lineIndex={sel.line}
          from={sel.from}
          to={sel.to}
          onClose={() => { setWhy(false); clear(); }}
        />
      )}
    </div>
  );
}

export { lineText };
