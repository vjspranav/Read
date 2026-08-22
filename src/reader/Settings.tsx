import { useEffect, useRef } from 'react';
import type { Reveal, Settings as S, Size } from '../settings/useSettings.js';

interface Props {
  settings: S;
  set: <K extends keyof S>(k: K, v: S[K]) => void;
  onClose: () => void;
}

const REVEALS: [Reveal, string][] = [['always', 'Always'], ['tap', 'On tap'], ['hidden', 'Hidden']];

export function SettingsPopover({ settings, set, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    // Defer, so the click that opened this does not immediately close it.
    const t = setTimeout(() => document.addEventListener('mousedown', away), 0);
    document.addEventListener('keydown', esc);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div className="pop" ref={ref} role="dialog" aria-label="Reading settings">
      <div className="srow">
        <div className="h"><span className="name">Reveal the English</span></div>
        <div className="seg">
          {REVEALS.map(([v, label]) => (
            <button key={v} className={settings.reveal === v ? 'on' : ''}
              aria-pressed={settings.reveal === v} onClick={() => set('reveal', v)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="srow">
        <div className="h">
          <span className="name">Literal gloss</span>
          <span className={`sw${settings.gloss ? ' on' : ''}`} role="switch" aria-checked={settings.gloss}
            onClick={() => set('gloss', !settings.gloss)} />
        </div>
        <p className="hint">A literal word under each French word, showing how the sentence is put together.</p>
      </div>

      <div className="srow">
        <div className="h">
          <span className="name">Hints</span>
          <span className={`sw${settings.hints ? ' on' : ''}`} role="switch" aria-checked={settings.hints}
            onClick={() => set('hints', !settings.hints)} />
        </div>
        <p className="hint">A faint dotted underline under words that have a note behind them.</p>
      </div>

      <div className="srow">
        <div className="h"><span className="name">Text size</span></div>
        <div className="sizes">
          {[0, 1, 2, 3].map((n) => (
            <button key={n} className={settings.size === n ? 'on' : ''}
              aria-pressed={settings.size === n} onClick={() => set('size', n as Size)}>A</button>
          ))}
        </div>
      </div>
    </div>
  );
}
