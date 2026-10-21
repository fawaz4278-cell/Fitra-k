"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { addDays, formatShortDate, todayISO } from "@/lib/date";
import { PAST_WEEKS, buildPrediction, mondayOf, type DayEnergy, type WeekRow } from "@/lib/prediction";

const weekLabel = (w: WeekRow) => `${formatShortDate(w.start)} – ${formatShortDate(w.end)}`;

/** Weight change as kg, with a sign: −0.6 kg lost, +0.2 kg gained. */
function changeText(kg: number | null) {
  if (kg == null) return "–";
  const r = Math.round(kg * 10) / 10;
  return `${r > 0 ? "+" : r < 0 ? "−" : "±"}${Math.abs(r).toFixed(1)}`;
}
const changeTone = (kg: number | null) =>
  kg == null ? "text-ios-label3" : kg < -0.05 ? "text-ios-green" : kg > 0.05 ? "text-ios-orange" : "";

/** Predicted weight loss from logged calorie deficits, with past weeks compared against real weigh-ins. */
export function PredictionCard({ weights, targetKg }: { weights: { date: string; kg: number }[]; targetKg: number | null }) {
  const today = todayISO();
  const [days, setDays] = useState<DayEnergy[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const since = addDays(mondayOf(today), -7 * PAST_WEEKS - 7);
    const supabase = createClient();
    Promise.all([
      supabase.from("daily_logs").select("date, kcal_burned").gte("date", since),
      supabase.from("food_logs").select("date, kcal").gte("date", since),
    ]).then(([logs, food]) => {
      const err = logs.error ?? food.error;
      if (err) return setError(err.message);
      const eaten = new Map<string, number>();
      for (const f of food.data ?? []) eaten.set(f.date, (eaten.get(f.date) ?? 0) + f.kcal);
      const dates = new Set([...(logs.data ?? []).map((l) => l.date), ...eaten.keys()]);
      const burned = new Map((logs.data ?? []).map((l) => [l.date, l.kcal_burned]));
      setDays([...dates].map((date) => ({ date, burned: burned.get(date) ?? 0, eaten: eaten.get(date) ?? 0 })));
    });
  }, [today]);

  const p = useMemo(
    () => (days ? buildPrediction({ today, days, weights, targetKg }) : null),
    [days, today, weights, targetKg],
  );

  if (error) return <p className="mx-4 mb-6 text-[15px] text-ios-red">{error}</p>;
  if (!p) return <div className="mx-4 mb-6 h-40 animate-pulse surface" />;

  // Predicted loss is positive kg lost; show it as a weight change (negative = down).
  const forecast = [{ ...p.current, label: "This week" }, ...p.future.map((w) => ({ ...w, label: weekLabel(w) }))];
  const anyPast = p.past.some((w) => w.loggedDays > 0 || w.actualChangeKg != null);

  return (
    <div className="mx-4 mb-6 space-y-3">
      <Card>
        <div className="mb-1 text-[15px] font-semibold">Prediction</div>
        {p.avgDeficit == null ? (
          <p className="text-[15px] text-ios-label2">
            Log your Polar calories and food on Today for a day or two, and your forecast will show up here.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[13px] text-ios-label2">
              Average {p.avgDeficit >= 0 ? "deficit" : "surplus"} of{" "}
              <span className="font-semibold text-white">{Math.abs(Math.round(p.avgDeficit)).toLocaleString("en-SG")} kcal/day</span>{" "}
              over your last {p.avgDays} logged day{p.avgDays === 1 ? "" : "s"}. 7,700 kcal ≈ 1 kg.
            </p>
            <table className="w-full text-[15px] tabular-nums">
              <thead>
                <tr className="text-[12px] text-ios-label2">
                  <th className="pb-1 text-left font-normal">Week</th>
                  <th className="pb-1 text-right font-normal">Change</th>
                  <th className="pb-1 text-right font-normal">Weight</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((w, i) => {
                  const change = w.predictedLossKg == null ? null : -w.predictedLossKg;
                  return (
                    <tr key={w.start} className="border-t hairline">
                      <td className="py-2">
                        {w.label}
                        {i === 0 && <div className="text-[11px] text-ios-label2">{w.loggedDays} day{w.loggedDays === 1 ? "" : "s"} logged so far</div>}
                      </td>
                      <td className={`py-2 text-right ${changeTone(change)}`}>{changeText(change)} kg</td>
                      <td className="py-2 text-right">{w.predictedEndKg == null ? "–" : `${w.predictedEndKg.toFixed(1)} kg`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {targetKg != null && (
              <p className="mt-3 border-t hairline pt-3 text-[15px]">
                Target {targetKg.toFixed(1)} kg:{" "}
                <span className="font-semibold">
                  {p.targetDate === "reached"
                    ? "reached 🎉"
                    : p.targetDate
                      ? `around ${formatShortDate(p.targetDate, true)}`
                      : "not on track at this rate"}
                </span>
              </p>
            )}
            {weights.length === 0 && (
              <p className="mt-3 text-[13px] text-ios-label2">Log a weigh-in to see predicted weights.</p>
            )}
          </>
        )}
      </Card>

      {anyPast && (
        <Card>
          <div className="mb-1 text-[15px] font-semibold">Predicted vs actual</div>
          <p className="mb-3 text-[13px] text-ios-label2">
            Predicted change counts only logged days. Actual is between weigh-ins either side of the week.
          </p>
          <table className="w-full text-[15px] tabular-nums">
            <thead>
              <tr className="text-[12px] text-ios-label2">
                <th className="pb-1 text-left font-normal">Week</th>
                <th className="pb-1 text-right font-normal">Logged</th>
                <th className="pb-1 text-right font-normal">Predicted</th>
                <th className="pb-1 text-right font-normal">Actual</th>
              </tr>
            </thead>
            <tbody>
              {p.past.map((w) => {
                const predicted = w.predictedLossKg == null ? null : -w.predictedLossKg;
                return (
                  <tr key={w.start} className="border-t hairline">
                    <td className="py-2">{weekLabel(w)}</td>
                    <td className="py-2 text-right text-ios-label2">{w.loggedDays}/7</td>
                    <td className={`py-2 text-right ${changeTone(predicted)}`}>{changeText(predicted)}</td>
                    <td className={`py-2 text-right ${changeTone(w.actualChangeKg)}`}>{changeText(w.actualChangeKg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
