"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import { addDays, dayFractionSG, daysBetween, formatShortDate, todayISO } from "@/lib/date";
import { complianceStreak } from "@/lib/streak";
import { energyBalance, weightOn } from "@/lib/energy";
import { AWARD_LABELS, type DailyLog, type Goals, type IpptAttempt, type IpptAward, type StashItem, type Weight } from "@/lib/types";
import { LargeTitle } from "@/components/ui";

interface Dashboard {
  ippt: IpptAttempt | null;
  weights: Pick<Weight, "date" | "kg">[];
  goals: Pick<Goals, "target_kg" | "height_cm" | "birth_year"> | null;
  eatenToday: number;
  logs: Pick<DailyLog, "date" | "steps" | "kcal_burned" | "half_rice" | "no_sweet_drinks">[];
  stash: Pick<StashItem, "booking_start" | "qty_left">[];
}

const AWARD_COLORS: Record<IpptAward, string> = {
  gold: "text-ios-yellow",
  silver: "text-[#d1d1d6]",
  pass: "text-ios-green",
  fail: "text-ios-red",
};

const fmtKg = (n: number) => Number(n).toFixed(1);

export default function HomePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [ippt, weights, goals, logs, stash, food] = await Promise.all([
        supabase.from("ippt_attempts").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("weights").select("date, kg").gte("date", addDays(today, -60)).order("date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("goals").select("target_kg, height_cm, birth_year").maybeSingle(),
        supabase.from("daily_logs").select("date, steps, kcal_burned, half_rice, no_sweet_drinks").gte("date", addDays(today, -365)).order("date", { ascending: false }),
        supabase.from("stash_items").select("booking_start, qty_left").order("booking_start", { ascending: false }),
        supabase.from("food_logs").select("kcal").eq("date", today),
      ]);
      const err = ippt.error ?? weights.error ?? goals.error ?? logs.error ?? stash.error ?? food.error;
      if (err) {
        setError(err.message);
        return;
      }
      setData({
        ippt: ippt.data as IpptAttempt | null,
        weights: (weights.data ?? []).map((w) => ({ date: w.date, kg: Number(w.kg) })),
        goals: goals.data
          ? {
              target_kg: goals.data.target_kg == null ? null : Number(goals.data.target_kg),
              height_cm: goals.data.height_cm == null ? null : Number(goals.data.height_cm),
              birth_year: goals.data.birth_year,
            }
          : null,
        eatenToday: (food.data ?? []).reduce((sum, f) => sum + f.kcal, 0),
        logs: logs.data ?? [],
        stash: stash.data ?? [],
      });
    })();
  }, [today]);

  return (
    <>
      <LargeTitle title="Home" />
      <p className="-mt-1 mb-4 px-4 text-[15px] text-ios-label2">{formatShortDate(today, true)}</p>

      {error ? (
        <p className="mx-4 rounded-[14px] bg-ios-card p-4 text-[15px] text-ios-red">Couldn&apos;t load: {error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          <IpptCard data={data} />
          <BalanceCard data={data} today={today} />
          <WeightCard data={data} today={today} />
          <TodayCard data={data} today={today} />
          <StreakCard data={data} today={today} />
          <StashCard data={data} />
        </div>
      )}
    </>
  );
}

function Tile({ href, title, wide, children }: { href: string; title: string; wide?: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={`block rounded-[14px] bg-ios-card p-4 active:opacity-70 ${wide ? "col-span-2" : ""}`}>
      <div className="mb-2 flex items-center justify-between text-[13px] font-semibold uppercase tracking-wide text-ios-label2">
        <span>{title}</span>
        <span aria-hidden className="text-ios-label3">›</span>
      </div>
      {children}
    </Link>
  );
}

function Skeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2" aria-label="Loading">
      <div className="h-8 w-24 rounded-md bg-ios-card2" />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <div key={i} className="h-3.5 w-32 max-w-full rounded bg-ios-card2" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[15px] text-ios-label2">{children}</p>;
}

function Big({ children, unit }: { children: ReactNode; unit?: string }) {
  return (
    <div className="text-[30px] font-bold leading-none tabular-nums">
      {children}
      {unit && <span className="ml-1 text-[17px] font-semibold text-ios-label2">{unit}</span>}
    </div>
  );
}

function IpptCard({ data }: { data: Dashboard | null }) {
  const a = data?.ippt;
  return (
    <Tile href="/ippt" title="Latest IPPT" wide>
      {!data ? (
        <Skeleton />
      ) : !a ? (
        <Empty>No IPPT logged yet. Tap to log your first attempt.</Empty>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div>
            <Big unit="pts">{a.total}</Big>
            <div className={`mt-1.5 text-[17px] font-semibold ${AWARD_COLORS[a.award]}`}>{AWARD_LABELS[a.award]}</div>
          </div>
          <div className="text-right text-[13px] leading-5 text-ios-label2 tabular-nums">
            <div>{formatShortDate(a.date, true)}</div>
            <div>
              PU {a.pu_pts} · SU {a.su_pts} · Run {a.run_pts}
            </div>
          </div>
        </div>
      )}
    </Tile>
  );
}

function WeightCard({ data, today }: { data: Dashboard | null; today: string }) {
  let body: ReactNode = <Skeleton lines={3} />;
  if (data) {
    const [latest] = data.weights;
    if (!latest) {
      body = <Empty>No weigh-ins yet.</Empty>;
    } else {
      // Entry closest to 7 days before the latest weigh-in (must be at least 3 days older).
      const target = addDays(latest.date, -7);
      const prior = data.weights
        .filter((w) => daysBetween(w.date, latest.date) >= 3)
        .sort((x, y) => Math.abs(daysBetween(x.date, target)) - Math.abs(daysBetween(y.date, target)))[0];
      const change = prior ? latest.kg - prior.kg : null;
      const target_kg = data.goals?.target_kg ?? null;
      const gap = target_kg != null ? latest.kg - target_kg : null;
      body = (
        <>
          <Big unit="kg">{fmtKg(latest.kg)}</Big>
          <div className="mt-1.5 space-y-0.5 text-[13px] tabular-nums">
            {change != null ? (
              <div className={change <= 0 ? "text-ios-green" : "text-ios-red"}>
                {change > 0 ? "+" : change < 0 ? "−" : "±"}
                {fmtKg(Math.abs(change))} kg vs {daysBetween(prior!.date, latest.date)}d ago
              </div>
            ) : (
              <div className="text-ios-label2">No weekly change yet</div>
            )}
            {gap != null && (
              <div className="text-ios-label2">{gap > 0 ? `${fmtKg(gap)} kg to goal` : "Goal reached 🎉"}</div>
            )}
            {latest.date !== today && <div className="text-ios-label3">{formatShortDate(latest.date)}</div>}
          </div>
        </>
      );
    }
  }
  return (
    <Tile href="/weight" title="Weight">
      {body}
    </Tile>
  );
}

function TodayCard({ data, today }: { data: Dashboard | null; today: string }) {
  const log = data?.logs.find((l) => l.date === today);
  return (
    <Tile href="/today" title="Today">
      {!data ? (
        <Skeleton lines={3} />
      ) : !log ? (
        <Empty>Nothing logged today.</Empty>
      ) : (
        <>
          <Big>{log.steps.toLocaleString("en-SG")}</Big>
          <div className="mt-1 text-[13px] text-ios-label2">steps</div>
          <div className="mt-1.5 text-[15px] font-semibold tabular-nums text-ios-orange">
            {log.kcal_burned.toLocaleString("en-SG")} kcal
          </div>
        </>
      )}
    </Tile>
  );
}

function StreakCard({ data, today }: { data: Dashboard | null; today: string }) {
  const streak = data ? complianceStreak(data.logs, today) : 0;
  return (
    <Tile href="/today" title="Streak">
      {!data ? (
        <Skeleton lines={2} />
      ) : (
        <>
          <Big unit={streak === 1 ? "day" : "days"}>{streak}</Big>
          <div className="mt-1.5 text-[13px] text-ios-label2">Half rice + no sweet drinks</div>
        </>
      )}
    </Tile>
  );
}

function StashCard({ data }: { data: Dashboard | null }) {
  const latest = data?.stash[0]?.booking_start;
  const left = latest ? data!.stash.filter((s) => s.booking_start === latest).reduce((sum, s) => sum + s.qty_left, 0) : 0;
  return (
    <Tile href="/stash" title="Stash">
      {!data ? (
        <Skeleton lines={2} />
      ) : !latest ? (
        <Empty>No booking stash yet.</Empty>
      ) : (
        <>
          <Big unit="left">{left}</Big>
          <div className="mt-1.5 text-[13px] text-ios-label2">Booking {formatShortDate(latest)}</div>
        </>
      )}
    </Tile>
  );
}

function BalanceCard({ data, today }: { data: Dashboard | null; today: string }) {
  let body: ReactNode = <Skeleton lines={2} />;
  if (data) {
    const b = energyBalance({
      date: today,
      weightKg: weightOn(data.weights, today),
      heightCm: data.goals?.height_cm ?? null,
      birthYear: data.goals?.birth_year ?? null,
      watchKcal: data.logs.find((l) => l.date === today)?.kcal_burned ?? 0,
      eatenKcal: data.eatenToday,
      dayFraction: dayFractionSG(),
    });
    body =
      b.deficit == null ? (
        <Empty>Enter your Polar calories on Today to see your deficit.</Empty>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div>
            <Big unit="kcal">{Math.abs(b.deficit).toLocaleString("en-SG")}</Big>
            <div className={`mt-1.5 text-[17px] font-semibold ${b.deficit >= 0 ? "text-ios-green" : "text-ios-orange"}`}>
              {b.deficit >= 0 ? "Deficit" : "Surplus"}
            </div>
          </div>
          <div className="text-right text-[13px] leading-5 text-ios-label2 tabular-nums">
            <div>
              Burned {b.burned!.toLocaleString("en-SG")}
              {b.source === "estimate" ? " so far (est.)" : ""}
            </div>
            <div>Eaten {b.eaten.toLocaleString("en-SG")}</div>
          </div>
        </div>
      );
  }
  return (
    <Tile href="/today" title="Calorie balance" wide>
      {body}
    </Tile>
  );
}
