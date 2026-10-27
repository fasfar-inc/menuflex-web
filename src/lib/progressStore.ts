/**
 * Minimal external store for a scroll-driven progress value (0–1).
 * GSAP writes to it; React Three Fiber reads it every frame without
 * triggering React re-renders.
 */
export type ProgressStore = {
  get: () => number;
  set: (value: number) => void;
  subscribe: (listener: (value: number) => void) => () => void;
};

export function createProgressStore(initial = 0): ProgressStore {
  let value = initial;
  const listeners = new Set<(value: number) => void>();
  return {
    get: () => value,
    set: (next) => {
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l(value));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
