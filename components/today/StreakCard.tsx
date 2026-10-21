"use client";

import type { DailyLog } from "@/lib/types";
import { addDays, todayISO } from "@/lib/date";
import { complianceStreak, isCompliant } from "@/lib/streak";
import { Card } from "@/components/ui";

type StreakLog = Pick<DailyLog, "date" | "half_rice" | "no_sweet_drinks">;

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

/** Compliance streak (half rice + no sweet drinks) with a 7-day dot strip. */
export function StreakCard({ logs, today = todayISO() }: { logs: StreakLog[]; today?: string }) {
  const streak = complianceStreak(logs, today);
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <Card className="mx-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] uppercase text-ios-label2">Compliance streak</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[40px] font-bold leading-none" aria-hidden>
              {streak > 0 ? "🔥" : "🌱"}
            </span>
            <span className="text-[40px] font-bold leading-none tabular-nums">{streak}</span>
            <span className="text-[17px] text-ios-label2">{streak === 1 ? "day" : "days"}</span>
          </div>
          <div className="mt-1 text-[13px] text-ios-label2">Half rice + no sweet drinks</div>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        {days.map((d) => {
          const log = byDate.get(d);
          const done = log ? isCompliant(log) : false;
          const partial = log ? !done && (log.half_rice || log.no_sweet_drinks) : false;
          const weekday = WEEKDAY[new Date(`${d}T00:00:00Z`).getUTCDay()];
          return (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span
                className={`h-3.5 w-3.5 rounded-full ${
                  done ? "bg-ios-green" : partial ? "bg-ios-orange" : "bg-ios-card2"
                } ${d === today ? "ring-2 ring-white/70 ring-offset-2 ring-offset-ios-card" : ""}`}
                title={d}
              />
              <span className={`text-[11px] ${d === today ? "text-white" : "text-ios-label2"}`}>{weekday}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
