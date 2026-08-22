import { useEffect, useState } from 'react';

export type Reveal = 'always' | 'tap' | 'hidden';
export type Size = 0 | 1 | 2 | 3;

export interface Settings {
  reveal: Reveal;
  /** The interlinear literal gloss under each French word. Opt in. */
  gloss: boolean;
  /** The faint dotted underline under words that carry a note. */
  hints: boolean;
  size: Size;
  /** Whether the first-visit nudge has been dismissed. */
  greeted: boolean;
}

const DEFAULTS: Settings = { reveal: 'tap', gloss: false, hints: true, size: 1, greeted: false };
const KEY = 'read.settings';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Settings live in the browser. No accounts, nothing to sign into. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  }, [settings]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  return { settings, set };
}

export const SIZES = ['18px', '20.5px', '23px', '26px'];
