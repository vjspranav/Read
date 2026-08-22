import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Without globals:true, Testing Library does not auto-unmount between tests.
afterEach(cleanup);

if (typeof window !== 'undefined') {
  /**
   * jsdom under vitest does not expose Storage, whatever the origin. This is a
   * faithful in-memory stand-in, so the settings code under test is the real
   * one — it genuinely reads and writes, and persistence across a remount is
   * genuinely verified.
   */
  if (typeof window.localStorage === 'undefined') {
    const mem = new Map<string, string>();
    const storage: Storage = {
      get length() { return mem.size; },
      key: (i) => [...mem.keys()][i] ?? null,
      getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k, v) => { mem.set(k, String(v)); },
      removeItem: (k) => { mem.delete(k); },
      clear: () => { mem.clear(); },
    };
    Object.defineProperty(window, 'localStorage', { value: storage, writable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true });
  }

  // jsdom has no speech synthesis; the reader must not crash without it.
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: { speak: () => {}, cancel: () => {}, getVoices: () => [], addEventListener: () => {} },
  });
  // @ts-expect-error test stub
  window.SpeechSynthesisUtterance = class { constructor(public text: string) {} };
}
