// Weight-loss prediction from logged calorie deficits, using ~7,700 kcal per kg of body fat.
// Weeks run Monday–Sunday. A "logged day" has both a watch total and some food entered.

import { addDays } from "./date";

export const KCAL_PER_KG = 7700;
export const FORECAST_WEEKS = 4;
export const PAST_WEEKS = 4;

export interface DayEnergy {
  date: string;
  /** Watch total calories burned. */
  burned: number;
  /** Food logged. */
  eaten: number;
}

export interface WeighIn {
  date: string;
  kg: number;
}

export interface WeekRow {
  start: string;
  end: string;
  /** Days in the week with both calories burned and food logged (before today). */
  loggedDays: number;
  /** Positive = kg lost. Null when there's nothing to base it on. */
  predictedLossKg: number | null;
  /** Predicted weight at the end of the week (current and future weeks only). */
  predictedEndKg: number | null;
  /** Real change between weigh-ins: negative = lost (past weeks only). */
  actualChangeKg: number | null;
}

export interface Prediction {
  /** Average daily deficit over the most recent logged days, or null if none. */
  avgDeficit: number | null;
  avgDays: number;
  past: WeekRow[];
  current: WeekRow;
  future: WeekRow[];
  /** Date the target weight is predicted to be reached, "reached", or null if not predictable. */
  targetDate: string | "reached" | null;
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}

function latestOnOrBefore(weights: WeighIn[], date: string): WeighIn | null {
  let best: WeighIn | null = null;
  for (const w of weights) if (w.date <= date && (!best || w.date > best.date)) best = w;
  return best;
}

export function buildPrediction(input: {
  today: string;
  days: DayEnergy[];
  weights: WeighIn[];
  targetKg: number | null;
  avgOver?: number;
}): Prediction {
  const { today, weights, targetKg } = input;
  const avgOver = input.avgOver ?? 7;

  // Completed logged days only: today's watch total is still climbing.
  const logged = new Map<string, number>();
  for (const d of input.days) {
    if (d.burned > 0 && d.eaten > 0 && d.date < today) logged.set(d.date, d.burned - d.eaten);
  }

  const recent = [...logged.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, avgOver);
  const avgDeficit = recent.length ? recent.reduce((s, [, v]) => s + v, 0) / recent.length : null;

  // Best guess for any day: the logged deficit if we have one, else the recent average.
  const deficitOn = (date: string): number | null => (date < today && logged.has(date) ? logged.get(date)! : avgDeficit);

  const sumDeficit = (from: string, to: string): number | null => {
    let total = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const v = deficitOn(d);
      if (v == null) return null;
      total += v;
    }
    return total;
  };

  // Projected weight at the end of `date`, starting from the latest weigh-in (taken in the morning).
  const anchor = latestOnOrBefore(weights, today);
  const projectedKg = (date: string): number | null => {
    if (!anchor) return null;
    if (date < anchor.date) return null;
    const total = sumDeficit(anchor.date, date);
    return total == null ? null : anchor.kg - total / KCAL_PER_KG;
  };

  const loggedIn = (start: string, end: string) =>
    [...logged.keys()].filter((d) => d >= start && d <= end).length;

  const thisMonday = mondayOf(today);

  const past: WeekRow[] = [];
  for (let i = PAST_WEEKS; i >= 1; i--) {
    const start = addDays(thisMonday, -7 * i);
    const end = addDays(start, 6);
    const daysLogged = [...logged.entries()].filter(([d]) => d >= start && d <= end);
    const before = latestOnOrBefore(weights, addDays(start, -1));
    const after = latestOnOrBefore(weights, end);
    past.push({
      start,
      end,
      loggedDays: daysLogged.length,
      predictedLossKg: daysLogged.length ? daysLogged.reduce((s, [, v]) => s + v, 0) / KCAL_PER_KG : null,
      predictedEndKg: null,
      actualChangeKg: before && after && after.date > before.date ? after.kg - before.kg : null,
    });
  }

  const weekRow = (start: string): WeekRow => {
    const end = addDays(start, 6);
    const total = sumDeficit(start, end);
    return {
      start,
      end,
      loggedDays: loggedIn(start, end),
      predictedLossKg: total == null ? null : total / KCAL_PER_KG,
      predictedEndKg: projectedKg(end),
      actualChangeKg: null,
    };
  };

  const current = weekRow(thisMonday);
  const future = Array.from({ length: FORECAST_WEEKS }, (_, i) => weekRow(addDays(thisMonday, 7 * (i + 1))));

  let targetDate: Prediction["targetDate"] = null;
  const nowKg = anchor ? (anchor.date < today ? projectedKg(addDays(today, -1)) : anchor.kg) : null;
  if (targetKg != null && nowKg != null) {
    if (nowKg <= targetKg) targetDate = "reached";
    else if (avgDeficit != null && avgDeficit > 0) {
      targetDate = addDays(today, Math.ceil(((nowKg - targetKg) * KCAL_PER_KG) / avgDeficit));
    }
  }

  return { avgDeficit, avgDays: recent.length, past, current, future, targetDate };
}
