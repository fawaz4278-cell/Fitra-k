"use client";

import type { CSSProperties } from "react";
import type { DailyLog } from "@/lib/types";
import { addDays, todayISO } from "@/lib/date";
import { complianceStreak, isCompliant } from "@/lib/streak";
import { Card, CountUp, FlameIcon } from "@/components/ui";

type StreakLog = Pick<DailyLog, "date" | "half_rice" | "no_sweet_drinks">;

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

/** Compliance streak (half rice + no sweet drinks) with a 7-day dot strip. */
export function StreakCard({ logs, today = todayISO() }: { logs: StreakLog[]; today?: string }) {
  const streak = complianceStreak(logs, today);
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <Card className="mx-4 mb-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">Compliance streak</div>
          <div className="mt-2 flex items-end gap-2.5">
            <FlameIcon lit={streak > 0} size={30} />
            <span className="num text-[40px] font-semibold leading-none"><CountUp value={streak} duration={800} /></span>
            <span className="mb-0.5 text-[16px] font-medium text-white/50">{streak === 1 ? "day" : "days"}</span>
          </div>
        </div>
        <div className="text-right text-[12px] leading-snug text-white/50">
          Half rice
          <br />+ no sweet drinks
        </div>
      </div>
      <div className="mt-5 flex justify-between">
        {days.map((d, i) => {
          const log = byDate.get(d);
          const done = log ? isCompliant(log) : false;
          const partial = log ? !done && (log.half_rice || log.no_sweet_drinks) : false;
          const weekday = WEEKDAY[new Date(`${d}T00:00:00Z`).getUTCDay()];
          return (
            <div key={d} className="animate-rise flex flex-col items-center gap-2" style={{ "--i": i + 1 } as CSSProperties}>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] ${
                  done
                    ? "bg-gradient-to-b from-[#ffb340] to-[#ff6a1f] text-black shadow-[0_4px_14px_-2px_rgba(255,122,47,0.7)]"
                    : partial
                      ? "bg-[#ff7a2f]/20 text-[#ffb340]"
                      : "bg-white/[0.06] text-white/30"
                } ${d === today ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#0e0e11]" : ""}`}
                title={d}
              >
                {done ? "✓" : partial ? "½" : ""}
              </span>
              <span className={`text-[11px] font-medium ${d === today ? "text-white" : "text-white/40"}`}>{weekday}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
