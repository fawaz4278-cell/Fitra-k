"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import { addDays, dayFractionSG, daysBetween, formatShortDate, todayISO } from "@/lib/date";
import { complianceStreak, isCompliant } from "@/lib/streak";
import { energyBalance, weightOn } from "@/lib/energy";
import { AWARD_LABELS, type DailyLog, type Goals, type IpptAttempt, type IpptAward, type StashItem, type Weight } from "@/lib/types";
import { CountUp, FlameIcon, LargeTitle, Ring, Sparkline, useMounted } from "@/components/ui";

interface Dashboard {
  ippt: IpptAttempt | null;
  weights: Pick<Weight, "date" | "kg">[];
  goals: Pick<Goals, "target_kg" | "height_cm" | "birth_year"> | null;
  eatenToday: number;
  logs: Pick<DailyLog, "date" | "steps" | "kcal_burned" | "pt_sessions" | "half_rice" | "no_sweet_drinks">[];
  stash: Pick<StashItem, "booking_start" | "qty_left" | "qty_bought">[];
}

const AWARD_COLORS: Record<IpptAward, string> = {
  gold: "text-ios-yellow",
  silver: "text-[#d1d1d6]",
  pass: "text-ios-green",
  fail: "text-ios-red",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-SG");
const fmtKg = (n: number) => Number(n).toFixed(1);

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hello, setHello] = useState("Fitrack");
  const today = todayISO();

  useEffect(() => {
    setHello(greeting());
    const supabase = createClient();
    (async () => {
      const [ippt, weights, goals, logs, stash, food] = await Promise.all([
        supabase.from("ippt_attempts").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("weights").select("date, kg").gte("date", addDays(today, -60)).order("date", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("goals").select("target_kg, height_cm, birth_year").maybeSingle(),
        supabase.from("daily_logs").select("date, steps, kcal_burned, pt_sessions, half_rice, no_sweet_drinks").gte("date", addDays(today, -365)).order("date", { ascending: false }),
        supabase.from("stash_items").select("booking_start, qty_left, qty_bought").order("booking_start", { ascending: false }),
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

  const weekday = new Date(`${today}T00:00:00Z`).toLocaleDateString("en-SG", { weekday: "long", timeZone: "UTC" });

  return (
    <>
      <LargeTitle eyebrow={`${weekday} · ${formatShortDate(today)}`} title={hello} />

      {error ? (
        <p className="surface mx-4 p-4 text-[15px] text-ios-red">Couldn&apos;t load: {error}</p>
      ) : (
        <div className="space-y-3 px-4">
          <BalanceCard data={data} today={today} />
          <div className="grid grid-cols-2 gap-3">
            <WeightTile data={data} />
            <IpptTile data={data} />
            <StreakTile data={data} today={today} />
            <StashTile data={data} />
          </div>
        </div>
      )}
    </>
  );
}

function Tile({ href, i, className = "", children }: { href: string; i: number; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`surface pressable animate-rise block p-4 ${className}`}
      style={{ "--i": i } as CSSProperties}
    >
      {children}
    </Link>
  );
}

function TileLabel({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="eyebrow mb-3 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {children}
    </div>
  );
}

function Skeleton({ h = 72 }: { h?: number }) {
  return <div className="shimmer rounded-xl" style={{ height: h }} aria-label="Loading" />;
}

function BalanceCard({ data, today }: { data: Dashboard | null; today: string }) {
  const log = data?.logs.find((l) => l.date === today);
  const b = data
    ? energyBalance({
        date: today,
        weightKg: weightOn(data.weights, today),
        heightCm: data.goals?.height_cm ?? null,
        birthYear: data.goals?.birth_year ?? null,
        watchKcal: log?.kcal_burned ?? 0,
        eatenKcal: data.eatenToday,
        dayFraction: dayFractionSG(),
      })
    : null;
  const deficit = b?.deficit ?? null;
  const good = deficit != null && deficit >= 0;
  const mounted = useMounted(250);
  const eatenShare = mounted && b?.burned ? Math.min(1, b.eaten / b.burned) : 0;

  return (
    <Tile href="/today" i={0} className="relative overflow-hidden p-5">
      <div
        className="animate-float pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ background: good ? "rgba(52,211,153,0.16)" : "rgba(255,159,10,0.14)" }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <TileLabel color="#34d399">Today&apos;s balance</TileLabel>
          {log && (
            <div className="-mt-3 flex gap-1.5 text-[12px] font-medium text-white/70">
              <span className="rounded-full bg-white/[0.07] px-2.5 py-1 num">{fmt(log.steps)} steps</span>
              {log.pt_sessions > 0 && <span className="rounded-full bg-white/[0.07] px-2.5 py-1 num">{log.pt_sessions} PT</span>}
            </div>
          )}
        </div>

        {!data ? (
          <Skeleton h={110} />
        ) : deficit == null ? (
          <p className="text-[15px] leading-snug text-ios-label2">
            Enter your Polar calories and log food on Today to see your deficit.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span
                className="num bg-clip-text text-[56px] font-semibold leading-none text-transparent"
                style={{
                  backgroundImage: good
                    ? "linear-gradient(180deg,#a7f3d0 0%,#34d399 55%,#10b981 100%)"
                    : "linear-gradient(180deg,#ffd8a8 0%,#ff9f0a 100%)",
                }}
              >
                <CountUp value={Math.abs(deficit)} />
              </span>
              <span className="text-[17px] font-medium text-white/60">kcal {good ? "deficit" : "surplus"}</span>
            </div>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="flex h-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ffb340] to-[#ff7a2f] [transition:width_1200ms_cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${eatenShare * 100}%` }}
                />
                {good && (
                  <div
                    className={`ml-0.5 h-full flex-1 rounded-full bg-gradient-to-r from-[#34d399] to-[#10b981] transition-opacity delay-500 duration-700 ${
                      mounted ? "opacity-90" : "opacity-0"
                    }`}
                  />
                )}
              </div>
            </div>
            <div className="mt-2.5 flex justify-between text-[13px] text-white/55">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ff9f0a]" />
                Eaten <span className="num font-semibold text-white/85"><CountUp value={b!.eaten} /></span>
              </span>
              <span>
                Burned <span className="num font-semibold text-white/85"><CountUp value={b!.burned!} /></span>
                {b!.source === "estimate" ? " (est.)" : ""}
              </span>
            </div>
          </>
        )}
      </div>
    </Tile>
  );
}

function WeightTile({ data }: { data: Dashboard | null }) {
  const ascending = data ? [...data.weights].reverse() : [];
  const latest = data?.weights[0];
  let change: number | null = null;
  let days = 0;
  if (data && latest) {
    // Entry closest to 7 days before the latest weigh-in (must be at least 3 days older).
    const target = addDays(latest.date, -7);
    const prior = data.weights
      .filter((w) => daysBetween(w.date, latest.date) >= 3)
      .sort((x, y) => Math.abs(daysBetween(x.date, target)) - Math.abs(daysBetween(y.date, target)))[0];
    if (prior) {
      change = latest.kg - prior.kg;
      days = daysBetween(prior.date, latest.date);
    }
  }
  const gap = latest && data?.goals?.target_kg != null ? latest.kg - data.goals.target_kg : null;

  return (
    <Tile href="/weight" i={1} className="flex flex-col">
      <TileLabel color="#5ac8fa">Weight</TileLabel>
      {!data ? (
        <Skeleton />
      ) : !latest ? (
        <p className="text-[14px] text-ios-label2">No weigh-ins yet.</p>
      ) : (
        <>
          <div className="num text-[32px] font-semibold leading-none">
            <CountUp value={latest.kg} decimals={1} />
            <span className="ml-1 text-[15px] font-medium text-white/50">kg</span>
          </div>
          {change != null && (
            <div className={`mt-1.5 text-[13px] font-medium num ${change <= 0 ? "text-[#5ac8fa]" : "text-ios-orange"}`}>
              {change <= 0 ? "↓" : "↑"} {fmtKg(Math.abs(change))} kg · {days}d
            </div>
          )}
          <div className="-mx-1 mt-3">
            <Sparkline values={ascending.slice(-30).map((w) => w.kg)} color="#5ac8fa" height={34} />
          </div>
          {gap != null && (
            <div className="mt-2 text-[12px] text-white/50">{gap > 0 ? `${fmtKg(gap)} kg to goal` : "Goal reached"}</div>
          )}
        </>
      )}
    </Tile>
  );
}

function IpptTile({ data }: { data: Dashboard | null }) {
  const a = data?.ippt;
  return (
    <Tile href="/ippt" i={2} className="flex flex-col">
      <TileLabel color="#ffb340">IPPT</TileLabel>
      {!data ? (
        <Skeleton />
      ) : !a ? (
        <p className="text-[14px] text-ios-label2">No attempts yet. Tap to log one.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Ring progress={a.total / 100} size={64} stroke={7} from="#ffd60a" to="#ff7a2f">
              <span className="num text-[20px] font-semibold"><CountUp value={a.total} /></span>
            </Ring>
            <div className="min-w-0">
              <div className={`text-[17px] font-semibold leading-tight ${AWARD_COLORS[a.award]}`}>{AWARD_LABELS[a.award]}</div>
              <div className="mt-0.5 text-[12px] text-white/50">{formatShortDate(a.date)}</div>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-1 pt-3 text-center">
            {[
              ["PU", a.pu_pts, 25],
              ["SU", a.su_pts, 25],
              ["Run", a.run_pts, 50],
            ].map(([label, pts, max]) => (
              <div key={label} className="rounded-lg bg-white/[0.05] py-1.5">
                <div className="num text-[14px] font-semibold">{pts}</div>
                <div className="text-[10px] text-white/45">
                  {label}/{max}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Tile>
  );
}

function StreakTile({ data, today }: { data: Dashboard | null; today: string }) {
  const streak = data ? complianceStreak(data.logs, today) : 0;
  const byDate = new Map((data?.logs ?? []).map((l) => [l.date, l]));
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <Tile href="/today" i={3}>
      <TileLabel color="#ff7a2f">Streak</TileLabel>
      {!data ? (
        <Skeleton />
      ) : (
        <>
          <div className="flex items-end gap-2">
            <FlameIcon lit={streak > 0} />
            <div className="num text-[32px] font-semibold leading-none">
              <CountUp value={streak} duration={800} />
              <span className="ml-1 text-[15px] font-medium text-white/50">{streak === 1 ? "day" : "days"}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            {week.map((d) => {
              const l = byDate.get(d);
              const full = l && isCompliant(l);
              const half = l && !full && (l.half_rice || l.no_sweet_drinks);
              return (
                <span
                  key={d}
                  style={{ "--i": week.indexOf(d) + 3 } as CSSProperties}
                  className={`animate-rise h-2.5 w-2.5 rounded-full ${
                    full ? "bg-gradient-to-b from-[#ffb340] to-[#ff7a2f] shadow-[0_0_6px_rgba(255,122,47,0.7)]" : half ? "bg-[#ff7a2f]/35" : "bg-white/10"
                  } ${d === today ? "ring-2 ring-white/40 ring-offset-2 ring-offset-[#0e0e11]" : ""}`}
                />
              );
            })}
          </div>
          <div className="mt-3 text-[12px] text-white/50">Half rice + no sweet drinks</div>
        </>
      )}
    </Tile>
  );
}

function StashTile({ data }: { data: Dashboard | null }) {
  const mounted = useMounted(300);
  const latest = data?.stash[0]?.booking_start;
  const items = latest ? data!.stash.filter((s) => s.booking_start === latest) : [];
  const left = items.reduce((sum, s) => sum + s.qty_left, 0);
  const bought = items.reduce((sum, s) => sum + s.qty_bought, 0);
  return (
    <Tile href="/stash" i={4}>
      <TileLabel color="#c084fc">Stash</TileLabel>
      {!data ? (
        <Skeleton />
      ) : !latest ? (
        <p className="text-[14px] text-ios-label2">No booking stash yet.</p>
      ) : (
        <>
          <div className="num text-[32px] font-semibold leading-none">
            <CountUp value={left} duration={800} />
            <span className="ml-1 text-[15px] font-medium text-white/50">left</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e9d5ff] to-[#a855f7] [transition:width_1200ms_cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${mounted && bought ? (left / bought) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-3 text-[12px] text-white/50">
            of {bought} · booked {formatShortDate(latest)}
          </div>
        </>
      )}
    </Tile>
  );
}
