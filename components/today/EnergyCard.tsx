"use client";

import Link from "next/link";
import { useState } from "react";
import { Row, Section } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { energyBalance } from "@/lib/energy";
import { BodyStatsSheet } from "./BodyStatsSheet";
import { FoodSheet } from "./FoodSheet";
import { useEnergy } from "./useEnergy";

const fmt = (n: number) => Math.round(n).toLocaleString("en-SG");

/** Calorie balance for a day: resting + active burn minus food eaten. */
export function EnergyCard({ date, activeKcal }: { date: string; activeKcal: number }) {
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
    activeKcal,
    eatenKcal: eaten,
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
      <div className="mx-4 mb-6 rounded-[14px] bg-ios-card p-4">
        <div className="flex items-start justify-between">
          <div className="text-[13px] uppercase text-ios-label2">Calorie balance</div>
          {!needsStats && (
            <button type="button" onClick={() => setStatsOpen(true)} className="text-[13px] text-ios-blue">
              Body stats
            </button>
          )}
        </div>

        {!energy.loaded ? (
          <div className="mt-2 h-10 w-40 animate-pulse rounded bg-ios-card2" />
        ) : b.deficit == null ? (
          <div className="mt-2 space-y-2 text-[15px] text-ios-label2">
            <p>To estimate what you burn, Fitrack needs:</p>
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
          <div className="mt-1">
            <span className={`text-[40px] font-bold tabular-nums ${b.deficit >= 0 ? "text-ios-green" : "text-ios-orange"}`}>
              {fmt(Math.abs(b.deficit))}
            </span>
            <span className="ml-2 text-[17px] text-ios-label2">kcal {b.deficit >= 0 ? "deficit" : "surplus"}</span>
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-ios-sep/70 pt-3 text-center">
          <div>
            <div className="text-[17px] font-semibold tabular-nums">{b.resting == null ? "–" : fmt(b.resting)}</div>
            <div className="text-[12px] text-ios-label2">Resting</div>
          </div>
          <div>
            <div className="text-[17px] font-semibold tabular-nums">+{fmt(b.active)}</div>
            <div className="text-[12px] text-ios-label2">Active</div>
          </div>
          <div>
            <div className="text-[17px] font-semibold tabular-nums">−{fmt(b.eaten)}</div>
            <div className="text-[12px] text-ios-label2">Eaten</div>
          </div>
        </div>
      </div>

      <Section
        header="Food"
        footer="Resting burn covers the whole day. Active is your watch's active calories (Activity below). Stash items you eat are added automatically."
      >
        {energy.foods.map((f) => (
          <Row key={f.id} label={f.name} sub={f.stash_item_id ? "From stash" : undefined}>
            <span className="flex items-center gap-3">
              <span className="tabular-nums">{fmt(f.kcal)}</span>
              <button
                type="button"
                onClick={() => removeFood(f.id)}
                className="text-[20px] leading-none text-ios-label3"
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </span>
          </Row>
        ))}
        <button type="button" onClick={() => setFoodOpen(true)} className="w-full px-4 py-3 text-left text-[17px] text-ios-blue">
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
