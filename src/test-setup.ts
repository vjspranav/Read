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

  // jsdom has no IntersectionObserver. This stub reports every observed line
  // as visible once, which is what the progress tracker reads.
  if (typeof window.IntersectionObserver === 'undefined') {
    class IO {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(el: Element) {
        this.cb([{ target: el, isIntersecting: true } as IntersectionObserverEntry], this as never);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null; rootMargin = ''; thresholds = [];
    }
    Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IO });
    Object.defineProperty(globalThis, 'IntersectionObserver', { writable: true, value: IO });
  }

  // jsdom has no speech synthesis; the reader must not crash without it.
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: { speak: () => {}, cancel: () => {}, getVoices: () => [], addEventListener: () => {} },
  });
  // @ts-expect-error test stub
  window.SpeechSynthesisUtterance = class { constructor(public text: string) {} };
}
