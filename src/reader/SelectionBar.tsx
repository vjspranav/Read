import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Pos { left: number; top: number; }
interface Props { anchor: string; onWhy: () => void; onListen: () => void; }

const same = (a: Pos | null, b: Pos | null) =>
  a === b || (!!a && !!b && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5);

/**
 * Floats above the selection, positioned from the selected tokens' real
 * rectangles so it follows the words rather than guessing.
 *
 * `anchor` changes whenever the selection changes; the effect keys off it, and
 * the position is only written when it actually moved. Both matter — writing
 * state unconditionally on every render is an infinite loop.
 */
export function SelectionBar({ anchor, onWhy, onListen }: Props) {
  const [pos, setPos] = useState<Pos | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const marks = document.querySelectorAll('.f.sel');
    if (!marks.length) { setPos((p) => (p === null ? p : null)); return; }

    let left = Infinity, right = -Infinity, top = Infinity;
    marks.forEach((m) => {
      const r = m.getBoundingClientRect();
      left = Math.min(left, r.left); right = Math.max(right, r.right); top = Math.min(top, r.top);
    });

    // The bar is centred on `left`, so half of it hangs either side. Clamp
    // with its real width so it can never run off a narrow screen.
    const half = (barRef.current?.offsetWidth ?? 150) / 2;
    const edge = 8;
    const next: Pos = {
      left: Math.max(half + edge, Math.min(window.innerWidth - half - edge, (left + right) / 2)),
      // Above the words, unless that would run off the top — then below.
      top: top > 96 ? top - 46 : top + 38,
    };
    setPos((p) => (same(p, next) ? p : next));
  }, []);

  useLayoutEffect(place, [place, anchor]);

  useEffect(() => {
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [place]);

  // Rendered even before it is positioned, but hidden: the clamp needs the
  // bar's real width, and the width only exists once it is in the document.
  return (
    <div
      className="actionbar"
      ref={barRef}
      style={{
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? 'visible' : 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onWhy}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" /><path d="M6.2 6.1a1.9 1.9 0 1 1 2.4 1.85c-.4.12-.6.4-.6.8v.35" />
          <circle cx="8" cy="11.6" r=".7" fill="currentColor" stroke="none" />
        </svg>
        Why?
      </button>
      <span className="div" />
      <button onClick={onListen}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M8.5 3 5 6H2.5v4H5l3.5 3z" strokeLinejoin="round" />
          <path d="M11 5.8a3.2 3.2 0 0 1 0 4.4" />
        </svg>
        Listen
      </button>
    </div>
  );
}
