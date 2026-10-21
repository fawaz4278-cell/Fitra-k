import type { DailyLog } from "./types";
import { addDays, todayISO } from "./date";

/** A day is compliant when both half rice and no sweet drinks are ticked. */
export function isCompliant(log: Pick<DailyLog, "half_rice" | "no_sweet_drinks">): boolean {
  return log.half_rice && log.no_sweet_drinks;
}

/**
 * Consecutive compliant days ending today. If today isn't compliant (yet), the streak
 * counts back from yesterday so an unfinished day doesn't reset it.
 */
export function complianceStreak(
  logs: Pick<DailyLog, "date" | "half_rice" | "no_sweet_drinks">[],
  today: string = todayISO(),
): number {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  let day = today;
  const t = byDate.get(today);
  if (!t || !isCompliant(t)) day = addDays(today, -1);
  let streak = 0;
  for (;;) {
    const log = byDate.get(day);
    if (!log || !isCompliant(log)) break;
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
