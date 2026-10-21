"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, LargeTitle, Row, Section } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { formatRunTime, formatShortDate } from "@/lib/date";
import {
  AGE_GROUP_LABELS,
  AWARD_LABELS,
  AWARD_THRESHOLDS,
  type AgeGroup,
  type Goals,
  type IpptAttempt,
  type IpptTarget,
} from "@/lib/types";
import { AwardBadge } from "./AwardBadge";
import { IpptSettingsSheet } from "./IpptSettingsSheet";
import { LogIpptSheet } from "./LogIpptSheet";

const IpptTrendChart = dynamic(() => import("./IpptTrendChart"), { ssr: false });

function StationBar({ label, pts, max }: { label: string; pts: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[13px]">
        <span className="text-ios-label2">{label}</span>
        <span className="font-semibold">
          {pts}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ios-card2">
        <div className="h-full rounded-full bg-ios-blue" style={{ width: `${(pts / max) * 100}%` }} />
      </div>
    </div>
  );
}

export function IpptScreen() {
  const [attempts, setAttempts] = useState<IpptAttempt[]>([]);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [a, g] = await Promise.all([
      supabase
        .from("ippt_attempts")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("goals").select("*").maybeSingle(),
    ]);
    if (a.error) setError(a.error.message);
    setAttempts((a.data as IpptAttempt[]) ?? []);
    setGoals((g.data as Goals | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this attempt?")) return;
    const { error } = await createClient().from("ippt_attempts").delete().eq("id", id);
    if (error) return setError(error.message);
    setAttempts((xs) => xs.filter((x) => x.id !== id));
  }

  const latest = attempts[0];
  const target: IpptTarget = goals?.ippt_target ?? "pass";
  const targetPts = AWARD_THRESHOLDS[target];
  const defaultAge: AgeGroup = goals?.age_group ?? latest?.age_group ?? 1;
  const best = attempts.reduce((m, a) => Math.max(m, a.total), 0);

  return (
    <main>
      <LargeTitle
        title="IPPT"
        action={
          <button
            aria-label="Log IPPT"
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
          {latest ? (
            <div className="mx-4 mb-6 space-y-3">
              <Card>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="text-[13px] text-ios-label2">
                      Latest · {formatShortDate(latest.date, true)} · {AGE_GROUP_LABELS[latest.age_group]}
                    </div>
                    <div className="text-[48px] font-bold leading-tight">{latest.total}</div>
                  </div>
                  <AwardBadge award={latest.award} />
                </div>
                <div className="space-y-3">
                  <StationBar label={`Push-ups · ${latest.pushups}`} pts={latest.pu_pts} max={25} />
                  <StationBar label={`Sit-ups · ${latest.situps}`} pts={latest.su_pts} max={25} />
                  <StationBar label={`2.4 km · ${formatRunTime(latest.run_seconds)}`} pts={latest.run_pts} max={50} />
                </div>
              </Card>

              <Card>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[15px] font-semibold">Target: {AWARD_LABELS[target]}</span>
                  <span className="text-[13px] text-ios-label2">{targetPts} pts</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-ios-card2">
                  <div
                    className={`h-full rounded-full ${latest.total >= targetPts ? "bg-ios-green" : "bg-ios-orange"}`}
                    style={{ width: `${Math.min(100, (latest.total / targetPts) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[13px] text-ios-label2">
                  {latest.total >= targetPts
                    ? `Target hit with ${latest.total - targetPts} pts to spare. Best: ${best}.`
                    : `${targetPts - latest.total} pts to go. Best: ${best}.`}
                </p>
              </Card>

              {attempts.length > 1 && (
                <Card>
                  <div className="mb-2 text-[15px] font-semibold">Trend</div>
                  <IpptTrendChart attempts={attempts} target={targetPts} />
                </Card>
              )}
            </div>
          ) : (
            <div className="mx-4 mb-6">
              <Card className="text-center">
                <p className="text-[17px] font-semibold">No attempts yet</p>
                <p className="mt-1 text-[15px] text-ios-label2">Tap + to log your first IPPT.</p>
              </Card>
            </div>
          )}

          <Section header="Goal">
            <button className="block w-full text-left" onClick={() => setSettingsOpen(true)}>
              <Row label="Target award">
                {AWARD_LABELS[target]} <span className="text-ios-label3">›</span>
              </Row>
            </button>
            <button className="block w-full text-left" onClick={() => setSettingsOpen(true)}>
              <Row label="Age group">
                {AGE_GROUP_LABELS[defaultAge]} <span className="text-ios-label3">›</span>
              </Row>
            </button>
          </Section>

          {attempts.length > 0 && (
            <section className="mx-4 mb-6">
              <div className="mb-1.5 flex items-center justify-between px-4">
                <h2 className="text-[13px] uppercase text-ios-label2">History</h2>
                <button onClick={() => setEditing((e) => !e)} className="text-[15px] text-ios-blue">
                  {editing ? "Done" : "Edit"}
                </button>
              </div>
              <div className="overflow-hidden rounded-[10px] bg-ios-card">
                {attempts.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 border-b border-ios-sep/70 px-4 py-2.5 last:border-b-0">
                    {editing && (
                      <button
                        aria-label="Delete attempt"
                        onClick={() => remove(a.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-red text-[18px] leading-none text-white"
                      >
                        −
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[17px]">{formatShortDate(a.date, true)}</div>
                      <div className="text-[13px] text-ios-label2">
                        {a.pushups} PU · {a.situps} SU · {formatRunTime(a.run_seconds)} · {a.pu_pts}/{a.su_pts}/{a.run_pts}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-semibold">{a.total}</div>
                      <div className="text-[11px] text-ios-label2">{AWARD_LABELS[a.award]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <LogIpptSheet open={logOpen} onClose={() => setLogOpen(false)} onSaved={load} defaultAgeGroup={defaultAge} />
      <IpptSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={load}
        target={target}
        ageGroup={defaultAge}
      />
    </main>
  );
}
