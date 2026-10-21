// Per-day local tally of kcal eaten from the stash. There's no eaten-log table, so this
// lives in localStorage keyed by date; every access is guarded since storage can be unavailable.

const key = (date: string) => `fitrack:stash-kcal:${date}`;

export function readTally(date: string): number {
  try {
    const n = Number(window.localStorage.getItem(key(date)) ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function addToTally(date: string, delta: number): number {
  const next = Math.max(0, readTally(date) + delta);
  try {
    window.localStorage.setItem(key(date), String(next));
  } catch {
    // Storage unavailable: the tally just won't persist.
  }
  return next;
}
