import { useCallback, useEffect, useRef, useState } from 'react';

export interface Mark {
  /** Furthest line index reached. */
  line: number;
  /** Reached the end at least once. */
  done: boolean;
  /** When it was last opened, for ordering "continue reading". */
  at: number;
}

export type Progress = Record<string, Mark>;

const KEY = 'read.progress';

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

function save(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}

/** Read-only view, for the shelf. */
export function useProgress(): Progress {
  const [progress, setProgress] = useState<Progress>(load);
  useEffect(() => {
    const sync = () => setProgress(load());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return progress;
}

export function markFor(storyId: string): Mark | undefined {
  return load()[storyId];
}

/**
 * Records how far through a story someone got.
 *
 * Only ever moves forward — re-reading the opening should not throw away that
 * you once finished it. Writes are throttled, because this fires on scroll.
 */
export function useTrackProgress(storyId: string | undefined, total: number) {
  const pending = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (!storyId || pending.current === null) return;
    const line = pending.current;
    pending.current = null;

    const all = load();
    const prev = all[storyId];
    all[storyId] = {
      line: Math.max(prev?.line ?? 0, line),
      done: (prev?.done ?? false) || line >= total - 1,
      at: Date.now(),
    };
    save(all);
  }, [storyId, total]);

  const report = useCallback((line: number) => {
    pending.current = Math.max(pending.current ?? 0, line);
    if (timer.current) return;
    timer.current = setTimeout(() => { timer.current = null; flush(); }, 600);
  }, [flush]);

  // Do not lose the last position when the reader unmounts.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    flush();
  }, [flush]);

  return report;
}
