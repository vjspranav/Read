import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { markFor, useTrackProgress } from './useProgress.js';

beforeEach(() => { localStorage.clear(); vi.useRealTimers(); });

describe('reading progress', () => {
  it('records how far someone got', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTrackProgress('s1', 20));
    act(() => result.current(7));
    act(() => { vi.advanceTimersByTime(700); });
    expect(markFor('s1')?.line).toBe(7);
    expect(markFor('s1')?.done).toBe(false);
  });

  it('only ever moves forward — re-reading the opening keeps your place', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTrackProgress('s1', 20));
    act(() => result.current(12));
    act(() => { vi.advanceTimersByTime(700); });
    act(() => result.current(2));
    act(() => { vi.advanceTimersByTime(700); });
    expect(markFor('s1')?.line).toBe(12);
  });

  it('marks a story done at the last line, and keeps it done', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTrackProgress('s1', 10));
    act(() => result.current(9));
    act(() => { vi.advanceTimersByTime(700); });
    expect(markFor('s1')?.done).toBe(true);

    act(() => result.current(1));
    act(() => { vi.advanceTimersByTime(700); });
    expect(markFor('s1')?.done).toBe(true);   // still read
  });

  it('throttles writes rather than saving on every scroll tick', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(localStorage, 'setItem');
    const { result } = renderHook(() => useTrackProgress('s1', 50));
    act(() => { for (let i = 0; i < 30; i++) result.current(i); });
    expect(spy).not.toHaveBeenCalled();          // nothing yet
    act(() => { vi.advanceTimersByTime(700); });
    expect(spy).toHaveBeenCalledTimes(1);        // one write for the lot
    expect(markFor('s1')?.line).toBe(29);
    spy.mockRestore();
  });

  it('keeps stories separate', () => {
    vi.useFakeTimers();
    const a = renderHook(() => useTrackProgress('s1', 20));
    act(() => a.result.current(5));
    act(() => { vi.advanceTimersByTime(700); });
    const b = renderHook(() => useTrackProgress('s2', 20));
    act(() => b.result.current(11));
    act(() => { vi.advanceTimersByTime(700); });
    expect(markFor('s1')?.line).toBe(5);
    expect(markFor('s2')?.line).toBe(11);
  });

  it('survives localStorage being unavailable', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('nope'); });
    vi.useFakeTimers();
    const { result } = renderHook(() => useTrackProgress('s1', 20));
    expect(() => {
      act(() => result.current(3));
      act(() => { vi.advanceTimersByTime(700); });
    }).not.toThrow();
    spy.mockRestore();
  });
});
