"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, LargeTitle, Row, Section } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { formatShortDate } from "@/lib/date";
import type { Goals, Weight } from "@/lib/types";
import { LogWeightSheet } from "./LogWeightSheet";
import { TargetWeightSheet } from "./TargetWeightSheet";
import { weeklyRate, withMovingAverage } from "./stats";

const WeightTrendChart = dynamic(() => import("./WeightTrendChart"), { ssr: false });

function Stat({ label, value, sub, tone = "" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <Card className="p-3">
      <div className="text-[12px] text-ios-label2">{label}</div>
      <div className={`text-[22px] font-semibold leading-tight ${tone}`}>{value}</div>
      {sub && <div className="text-[11px] text-ios-label2">{sub}</div>}
    </Card>
  );
}

export function WeightScreen() {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [w, g] = await Promise.all([
      supabase
        .from("weights")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("goals").select("*").maybeSingle(),
    ]);
    if (w.error) setError(w.error.message);
    setWeights(((w.data as Weight[]) ?? []).map((x) => ({ ...x, kg: Number(x.kg), waist_cm: x.waist_cm == null ? null : Number(x.waist_cm) })));
    setGoals((g.data as Goals | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await createClient().from("weights").delete().eq("id", id);
    if (error) return setError(error.message);
    setWeights((xs) => xs.filter((x) => x.id !== id));
  }

  const points = useMemo(() => withMovingAverage(weights), [weights]);
  const rate = useMemo(() => weeklyRate(points), [points]);
  const target = goals?.target_kg != null ? Number(goals.target_kg) : null;
  const current = points.at(-1);
  const gap = current && target != null ? current.avg7 - target : null;
  const weeksToGo = gap != null && gap > 0 && rate != null && rate < 0 ? Math.ceil(gap / -rate) : null;

  return (
    <main>
      <LargeTitle
        title="Weight"
        action={
          <button
            aria-label="Log weight"
            onClick={() => setLogOpen(true)}
            className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-ios-card text-[24px] leading-none text-ios-blue"
          >
            +
          </button>
        }
      />

      {error && <p className="mx-4 mb-4 text-[15px] text-ios-red">{error}</p>}

      {loading ? (
        <p className="px-4 text-ios-label2">Loading…</p>
      ) : (
        <>
          {current ? (
            <div className="mx-4 mb-6 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Current" value={`${current.kg.toFixed(1)}`} sub={`7d avg ${current.avg7.toFixed(1)} kg`} />
                <Stat
                  label="Per week"
                  value={rate == null ? "—" : `${rate > 0 ? "+" : ""}${rate.toFixed(2)}`}
                  sub={rate == null ? "Need more data" : rate < 0 ? "kg lost/wk" : "kg gained/wk"}
                  tone={rate == null ? "" : rate <= 0 ? "text-ios-green" : "text-ios-red"}
                />
                <Stat
                  label="To target"
                  value={gap == null ? "—" : gap <= 0 ? "Hit" : `${gap.toFixed(1)}`}
                  sub={
                    gap == null
                      ? "Set a target"
                      : gap <= 0
                        ? `${(-gap).toFixed(1)} kg under`
                        : weeksToGo
                          ? `kg · ~${weeksToGo} wk`
                          : "kg to go"
                  }
                  tone={gap != null && gap <= 0 ? "text-ios-green" : ""}
                />
              </div>
              {points.length > 1 && (
                <Card>
                  <div className="mb-2 text-[15px] font-semibold">Trend</div>
                  <WeightTrendChart points={points} target={target} />
                </Card>
              )}
            </div>
          ) : (
            <div className="mx-4 mb-6">
              <Card className="text-center">
                <p className="text-[17px] font-semibold">No weigh-ins yet</p>
                <p className="mt-1 text-[15px] text-ios-label2">Tap + to log your weight.</p>
              </Card>
            </div>
          )}

          <Section header="Goal">
            <button className="block w-full text-left" onClick={() => setTargetOpen(true)}>
              <Row label="Target weight">
                {target != null ? `${target.toFixed(1)} kg` : "Not set"} <span className="text-ios-label3">›</span>
              </Row>
            </button>
          </Section>

          {weights.length > 0 && (
            <section className="mx-4 mb-6">
              <div className="mb-1.5 flex items-center justify-between px-4">
                <h2 className="text-[13px] uppercase text-ios-label2">History</h2>
                <button onClick={() => setEditing((e) => !e)} className="text-[15px] text-ios-blue">
                  {editing ? "Done" : "Edit"}
                </button>
              </div>
              <div className="overflow-hidden rounded-[10px] bg-ios-card">
                {weights.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 border-b border-ios-sep/70 px-4 py-2.5 last:border-b-0">
                    {editing && (
                      <button
                        aria-label="Delete entry"
                        onClick={() => remove(w.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-red text-[18px] leading-none text-white"
                      >
                        −
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[17px]">{formatShortDate(w.date, true)}</div>
                      {(w.waist_cm != null || w.note) && (
                        <div className="truncate text-[13px] text-ios-label2">
                          {[w.waist_cm != null ? `Waist ${w.waist_cm} cm` : null, w.note].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="text-[17px] font-semibold">{w.kg.toFixed(1)} kg</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <LogWeightSheet open={logOpen} onClose={() => setLogOpen(false)} onSaved={load} lastKg={current?.kg} />
      <TargetWeightSheet open={targetOpen} onClose={() => setTargetOpen(false)} onSaved={load} targetKg={target} />
    </main>
  );
}
