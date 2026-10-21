"use client";

import Link from "next/link";
import { useState } from "react";
import { CountUp, Row, Section } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { energyBalance } from "@/lib/energy";
import { dayFractionSG, todayISO } from "@/lib/date";
import { BodyStatsSheet } from "./BodyStatsSheet";
import { FoodSheet } from "./FoodSheet";
import { useEnergy } from "./useEnergy";

const fmt = (n: number) => Math.round(n).toLocaleString("en-SG");

/** Calorie balance for a day: calories burned (watch total, or estimated resting burn) minus food eaten. */
export function EnergyCard({ date, watchKcal }: { date: string; watchKcal: number }) {
  const energy = useEnergy(date);
  const [foodOpen, setFoodOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [error, setError] = useState("");

  const eaten = energy.foods.reduce((s, f) => s + f.kcal, 0);
  const b = energyBalance({
    date,
    weightKg: energy.weightKg,
    heightCm: energy.heightCm,
    birthYear: energy.birthYear,
    watchKcal,
    eatenKcal: eaten,
    dayFraction: date === todayISO() ? dayFractionSG() : 1,
  });

  async function removeFood(id: string) {
    const prev = energy.foods;
    energy.setFoods((f) => f.filter((x) => x.id !== id));
    const { error } = await createClient().from("food_logs").delete().eq("id", id);
    if (error) {
      energy.setFoods(prev);
      setError(error.message);
    }
  }

  const needsStats = b.missing.includes("height") || b.missing.includes("birth_year");
  const needsWeight = b.missing.includes("weight");

  return (
    <>
      <div className="surface relative mx-4 mb-7 overflow-hidden p-5">
        <div
          className="animate-float pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: b.deficit != null && b.deficit < 0 ? "rgba(255,159,10,0.14)" : "rgba(52,211,153,0.15)" }}
        />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="eyebrow flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-tint-kcal shadow-[0_0_8px_#34d399]" />
              Calorie balance
            </div>
            <button type="button" onClick={() => setStatsOpen(true)} className="text-[13px] font-medium text-ios-blue">
              Body stats
            </button>
          </div>

          {!energy.loaded ? (
            <div className="shimmer mt-3 h-14 w-44 rounded-xl" />
          ) : b.deficit == null ? (
            <div className="mt-3 space-y-2 text-[15px] text-ios-label2">
              <p>Enter your Polar total calories under Activity, or for an estimate add:</p>
              {needsStats && (
                <button type="button" onClick={() => setStatsOpen(true)} className="block font-semibold text-ios-blue">
                  Add your height and birth year ›
                </button>
              )}
              {needsWeight && (
                <Link href="/weight" className="block font-semibold text-ios-blue">
                  Log a weigh-in ›
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="num bg-clip-text text-[52px] font-semibold leading-none text-transparent"
                style={{
                  backgroundImage:
                    b.deficit >= 0
                      ? "linear-gradient(180deg,#a7f3d0 0%,#34d399 55%,#10b981 100%)"
                      : "linear-gradient(180deg,#ffd8a8 0%,#ff9f0a 100%)",
                }}
              >
                <CountUp value={Math.abs(b.deficit)} />
              </span>
              <span className="text-[16px] font-medium text-white/55">kcal {b.deficit >= 0 ? "deficit" : "surplus"}</span>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3">
              <div className="text-[12px] text-white/50">
                {b.source === "watch" ? "Burned · Polar" : b.source === "estimate" ? "Burned so far · est." : "Burned"}
              </div>
              <div className="num mt-0.5 text-[22px] font-semibold">{b.burned == null ? "–" : <CountUp value={b.burned} />}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.05] px-3.5 py-3">
              <div className="text-[12px] text-white/50">Eaten</div>
              <div className="num mt-0.5 text-[22px] font-semibold"><CountUp value={b.eaten} /></div>
            </div>
          </div>
          {b.source === "estimate" && (
            <p className="mt-3 text-[13px] leading-snug text-ios-label2">
              Estimated resting burn so far. Enter your Polar total calories under Activity for the real number.
            </p>
          )}
        </div>
      </div>

      <Section
        header="Food"
        footer="Stash items you eat are added automatically."
      >
        {energy.foods.map((f) => (
          <Row key={f.id} label={f.name} sub={f.stash_item_id ? "From stash" : undefined}>
            <span className="flex items-center gap-3">
              <span className="num text-white/80">{fmt(f.kcal)}</span>
              <button
                type="button"
                onClick={() => removeFood(f.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07] text-[15px] leading-none text-white/50"
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </span>
          </Row>
        ))}
        <button type="button" onClick={() => setFoodOpen(true)} className="w-full px-4 py-3.5 text-left text-[16px] font-semibold text-ios-blue active:bg-white/[0.04]">
          + Add food
        </button>
      </Section>
      {(error || energy.error) && <p className="mx-4 -mt-4 mb-4 text-[15px] text-ios-red">{error || energy.error}</p>}

      <FoodSheet
        open={foodOpen}
        onClose={() => setFoodOpen(false)}
        date={date}
        onAdded={(food) => energy.setFoods((f) => [...f, food])}
      />
      <BodyStatsSheet
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        heightCm={energy.heightCm}
        birthYear={energy.birthYear}
        onSaved={energy.setBodyStats}
      />
    </>
  );
}
