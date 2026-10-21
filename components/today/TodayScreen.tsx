"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { addDays, formatShortDate, todayISO } from "@/lib/date";
import type { DailyLog, DailyLogUpsert } from "@/lib/types";
import { LargeTitle, Row, Section, Toggle } from "@/components/ui";
import { NumberStepRow } from "./NumberStepRow";
import { StreakCard } from "./StreakCard";
import { EnergyCard } from "./EnergyCard";

type StreakLog = Pick<DailyLog, "date" | "half_rice" | "no_sweet_drinks">;
type SaveState = "idle" | "saving" | "saved" | "error";

const emptyLog = (date: string): DailyLogUpsert => ({
  date,
  steps: 0,
  kcal_burned: 0,
  pt_sessions: 0,
  water_l: 0,
  sleep_h: 0,
  half_rice: false,
  no_sweet_drinks: false,
  night_snack: null,
});

function toUpsert(row: DailyLog): DailyLogUpsert {
  return {
    date: row.date,
    steps: row.steps,
    kcal_burned: row.kcal_burned,
    pt_sessions: row.pt_sessions,
    water_l: Number(row.water_l),
    sleep_h: Number(row.sleep_h),
    half_rice: row.half_rice,
    no_sweet_drinks: row.no_sweet_drinks,
    night_snack: row.night_snack,
  };
}

export function TodayScreen() {
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [log, setLog] = useState<DailyLogUpsert>(() => emptyLog(today));
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [recent, setRecent] = useState<StreakLog[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Recent logs for the streak.
  useEffect(() => {
    createClient()
      .from("daily_logs")
      .select("date, half_rice, no_sweet_drinks")
      .gte("date", addDays(today, -120))
      .order("date", { ascending: false })
      .then(({ data }) => setRecent((data as StreakLog[]) ?? []));
  }, [today]);

  // Load the selected day's row.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dirty.current = false;
    createClient()
      .from("daily_logs")
      .select("*")
      .eq("date", date)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setLog(data ? toUpsert(data as DailyLog) : emptyLog(date));
        setSaveState("idle");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const save = useCallback(
    async (payload: DailyLogUpsert) => {
      setSaveState("saving");
      const { error } = await createClient()
        .from("daily_logs")
        .upsert({ ...payload, ...(userId ? { user_id: userId } : {}) }, { onConflict: "user_id,date" });
      if (error) {
        setSaveState("error");
        return;
      }
      setSaveState("saved");
      setRecent((prev) => {
        const rest = prev.filter((l) => l.date !== payload.date);
        return [{ date: payload.date, half_rice: payload.half_rice, no_sweet_drinks: payload.no_sweet_drinks }, ...rest];
      });
    },
    [userId],
  );

  // Debounced autosave.
  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dirty.current = false;
      save(log);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [log, save]);

  function update<K extends keyof DailyLogUpsert>(key: K, value: DailyLogUpsert[K]) {
    dirty.current = true;
    setLog((prev) => ({ ...prev, [key]: value }));
  }

  function switchDate(next: string) {
    // Flush any pending edit for the current day before switching.
    if (dirty.current) {
      if (timer.current) clearTimeout(timer.current);
      dirty.current = false;
      save(log);
    }
    setDate(next);
  }

  const isToday = date === today;
  const statusText =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Couldn't save" : "";

  return (
    <div>
      <LargeTitle
        title="Today"
        action={
          <span
            className={`mb-2 text-[13px] transition-opacity ${saveState === "error" ? "text-ios-red" : "text-ios-label2"} ${
              statusText ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {statusText || "Saved"}
          </span>
        }
      />

      <div className="surface mx-4 mb-4 flex items-center justify-between rounded-full p-1.5">
        <button
          type="button"
          onClick={() => switchDate(addDays(date, -1))}
          className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[20px] text-white"
          aria-label="Previous day"
        >
          ‹
        </button>
        <button type="button" onClick={() => !isToday && switchDate(today)} className="text-[15px] font-semibold">
          {isToday ? `Today · ${formatShortDate(date)}` : formatShortDate(date, true)}
          {!isToday && <span className="ml-2 text-[13px] font-medium text-ios-blue">Back to today</span>}
        </button>
        <button
          type="button"
          onClick={() => switchDate(addDays(date, 1))}
          disabled={isToday}
          className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[20px] text-white disabled:opacity-25"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <StreakCard logs={recent} today={today} />

      <EnergyCard date={date} watchKcal={log.kcal_burned} />

      <div className={loading ? "pointer-events-none opacity-50" : ""}>
        <Section header="Activity">
          <NumberStepRow label="Steps" value={log.steps} onChange={(v) => update("steps", v)} step={500} max={200000} />
          <NumberStepRow
            label="Total calories (Polar)"
            unit="kcal"
            value={log.kcal_burned}
            onChange={(v) => update("kcal_burned", v)}
            step={50}
            max={20000}
          />
          <NumberStepRow
            label="PT sessions"
            value={log.pt_sessions}
            onChange={(v) => update("pt_sessions", v)}
            step={1}
            max={10}
          />
        </Section>

        <Section header="Recovery">
          <NumberStepRow
            label="Water"
            unit="L"
            value={log.water_l}
            onChange={(v) => update("water_l", v)}
            step={0.25}
            decimals={2}
            max={20}
          />
          <NumberStepRow
            label="Sleep"
            unit="h"
            value={log.sleep_h}
            onChange={(v) => update("sleep_h", v)}
            step={0.5}
            decimals={1}
            max={24}
          />
        </Section>

        <Section header="Diet" footer="Both ticked = a compliant day for your streak.">
          <Row label="Half rice">
            <Toggle checked={log.half_rice} onChange={(v) => update("half_rice", v)} label="Half rice" />
          </Row>
          <Row label="No sweet drinks">
            <Toggle
              checked={log.no_sweet_drinks}
              onChange={(v) => update("no_sweet_drinks", v)}
              label="No sweet drinks"
            />
          </Row>
          <div className="px-4 py-3">
            <label className="mb-1 block text-[13px] text-ios-label2" htmlFor="night-snack">
              Night snack
            </label>
            <input
              id="night-snack"
              type="text"
              placeholder="e.g. Maggi, none"
              value={log.night_snack ?? ""}
              onChange={(e) => update("night_snack", e.target.value === "" ? null : e.target.value)}
              className="w-full bg-transparent text-[17px] text-white placeholder:text-ios-label3 outline-none"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
