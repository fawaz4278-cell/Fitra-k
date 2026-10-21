// Date helpers. All app dates are local calendar dates in Asia/Singapore as ISO strings (YYYY-MM-DD).

export const APP_TZ = "Asia/Singapore";

/** Today's date in Singapore as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ }).format(now);
}

/** Add (or subtract) whole days to a YYYY-MM-DD string. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** e.g. "21 Oct" (or "21 Oct 2025" with year). */
export function formatShortDate(iso: string, withYear = false): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** 611 -> "10:11" */
export function formatRunTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
