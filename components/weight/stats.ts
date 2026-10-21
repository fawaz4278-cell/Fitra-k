import { addDays, daysBetween } from "@/lib/date";
import type { Weight } from "@/lib/types";

export interface WeightPoint {
  date: string;
  kg: number;
  avg7: number;
}

/**
 * One point per logged day (multiple entries on a day are averaged), each with the mean of all
 * entries in the trailing 7 calendar days (that day and the 6 before it).
 */
export function withMovingAverage(weights: Pick<Weight, "date" | "kg">[]): WeightPoint[] {
  const byDay = new Map<string, number[]>();
  for (const w of weights) byDay.set(w.date, [...(byDay.get(w.date) ?? []), Number(w.kg)]);
  const days = [...byDay.keys()].sort();
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return days.map((date) => {
    const from = addDays(date, -6);
    const window = days.filter((d) => d >= from && d <= date).flatMap((d) => byDay.get(d)!);
    return { date, kg: round2(mean(byDay.get(date)!)), avg7: round2(mean(window)) };
  });
}

/**
 * Weekly rate of change in kg/week from a least-squares fit over the last `windowDays` days.
 * Negative = losing. Null with fewer than 2 points or under 3 days of span.
 */
export function weeklyRate(points: Pick<WeightPoint, "date" | "kg">[], windowDays = 28): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1].date;
  const recent = points.filter((p) => daysBetween(p.date, last) < windowDays);
  if (recent.length < 2) return null;
  const xs = recent.map((p) => daysBetween(recent[0].date, p.date));
  if (xs[xs.length - 1] < 3) return null;
  const ys = recent.map((p) => p.kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : round2((num / den) * 7);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
