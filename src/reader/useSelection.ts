import { useCallback, useState } from 'react';

export interface Selection { line: number; from: number; to: number; }

/**
 * Tap-to-select, rather than native text selection.
 *
 * Native selection on a phone fights the OS menu, drags handles around, and
 * grabs half a word as often as a whole one. Owning it makes phone and desktop
 * behave identically and always land on token boundaries.
 */
export function useSelection() {
  const [sel, setSel] = useState<Selection | null>(null);

  const tap = useCallback((line: number, i: number) => {
    setSel((cur) => {
      if (!cur || cur.line !== line) return { line, from: i, to: i };
      if (cur.from === i && cur.to === i) return null;            // tap again to clear
      return { line, from: Math.min(cur.from, i), to: Math.max(cur.to, i) };
    });
  }, []);

  const clear = useCallback(() => setSel(null), []);

  const has = (line: number, i: number) =>
    !!sel && sel.line === line && i >= sel.from && i <= sel.to;

  return { sel, tap, clear, has, setSel };
}
