"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatShortDate, todayISO } from "@/lib/date";
import type { StashItem } from "@/lib/types";
import { Card, CountUp, LargeTitle, Row, Section } from "@/components/ui";
import { NewBookingSheet } from "./NewBookingSheet";
import { StashItemRow } from "./StashItemRow";

export function StashScreen() {
  const today = todayISO();
  const [items, setItems] = useState<StashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tonight, setTonight] = useState(0);

  useEffect(() => {
    createClient()
      .from("food_logs")
      .select("kcal")
      .eq("date", today)
      .not("stash_item_id", "is", null)
      .then(({ data }) => setTonight((data ?? []).reduce((s, f) => s + f.kcal, 0)));
    createClient()
      .from("stash_items")
      .select("*")
      .order("booking_start", { ascending: false })
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setItems((data as StashItem[]) ?? []);
        setLoading(false);
      });
  }, [today]);

  const bookings = useMemo(() => {
    const dates = Array.from(new Set(items.map((i) => i.booking_start)));
    return dates.sort((a, b) => (a < b ? 1 : -1));
  }, [items]);

  const latest = bookings[0] ?? null;
  const current = selected && bookings.includes(selected) ? selected : latest;
  const currentItems = items.filter((i) => i.booking_start === current);
  const totalLeft = currentItems.reduce((s, i) => s + i.qty_left, 0);
  const kcalLeft = currentItems.reduce((s, i) => s + i.qty_left * i.kcal_per_unit, 0);

  // Eating an item also logs it as food for today, so it counts towards the calorie balance.
  // Putting one back removes the most recent such entry from today, if there is one.
  async function changeQty(item: StashItem, delta: 1 | -1) {
    const nextQty = item.qty_left + delta;
    if (nextQty < 0 || nextQty > item.qty_bought) return;
    const supabase = createClient();
    // Optimistic update.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty_left: nextQty } : i)));
    const revert = (message: string) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty_left: item.qty_left } : i)));
      setError(message);
    };

    const { error } = await supabase.from("stash_items").update({ qty_left: nextQty }).eq("id", item.id);
    if (error) return revert(error.message);

    if (delta === -1) {
      const { error: logError } = await supabase
        .from("food_logs")
        .insert({ date: today, name: item.name, kcal: item.kcal_per_unit, stash_item_id: item.id });
      if (logError) return setError(logError.message);
      setTonight((t) => t + item.kcal_per_unit);
    } else {
      const { data: last } = await supabase
        .from("food_logs")
        .select("id, kcal")
        .eq("date", today)
        .eq("stash_item_id", item.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!last) return;
      const { error: delError } = await supabase.from("food_logs").delete().eq("id", last.id);
      if (delError) return setError(delError.message);
      setTonight((t) => Math.max(0, t - last.kcal));
    }
  }

  async function deleteBooking(date: string) {
    if (!window.confirm(`Delete the booking from ${formatShortDate(date, true)}?`)) return;
    const prev = items;
    setItems((p) => p.filter((i) => i.booking_start !== date));
    if (selected === date) setSelected(null);
    const { error } = await createClient().from("stash_items").delete().eq("booking_start", date);
    if (error) {
      setItems(prev);
      setError(error.message);
    }
  }

  return (
    <div>
      <LargeTitle
        title="Stash"
        action={
          <button
            onClick={() => setSheetOpen(true)}
            className="pressable mb-1 rounded-full bg-gradient-to-b from-[#d8b4fe] to-[#a855f7] px-4 py-2 text-[15px] font-semibold text-black shadow-[0_8px_20px_-6px_rgba(168,85,247,0.8)]"
          >
            New booking
          </button>
        }
      />

      {error && <p className="mx-4 mb-3 text-[15px] text-ios-red">{error}</p>}

      <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
        <Card>
          <div className="eyebrow flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff9f0a] shadow-[0_0_8px_#ff9f0a]" />
            Eaten tonight
          </div>
          <div className="num mt-3 text-[32px] font-semibold leading-none">
            <CountUp value={tonight} duration={700} />
            <span className="ml-1 text-[15px] font-medium text-white/50">kcal</span>
          </div>
        </Card>
        <Card>
          <div className="eyebrow flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-tint-stash shadow-[0_0_8px_#c084fc]" />
            Items left
          </div>
          <div className="num mt-3 text-[32px] font-semibold leading-none"><CountUp value={totalLeft} duration={700} /></div>
          <div className="mt-1.5 text-[12px] text-white/50">{kcalLeft.toLocaleString("en-SG")} kcal in stash</div>
        </Card>
      </div>

      {loading ? (
        <p className="px-4 text-[15px] text-ios-label2">Loading…</p>
      ) : !current ? (
        <div className="mx-4 surface p-6 text-center">
          <p className="text-[17px] font-semibold">No stash yet</p>
          <p className="mt-1 text-[15px] text-ios-label2">
            Log what you bought for this booking and tap items off as you eat them.
          </p>
          <button
            onClick={() => setSheetOpen(true)}
            className="mt-4 rounded-xl bg-ios-blue px-5 py-2.5 text-[17px] font-semibold"
          >
            New booking
          </button>
        </div>
      ) : (
        <Section
          header={`${current === latest ? "Current booking" : "Booking"} · ${formatShortDate(current, true)}`}
          footer="Tap an item to eat one. Use + to put one back."
        >
          {currentItems.map((item) => (
            <StashItemRow
              key={item.id}
              item={item}
              onEat={() => changeQty(item, -1)}
              onUndo={() => changeQty(item, 1)}
            />
          ))}
        </Section>
      )}

      {bookings.length > 0 && (
        <Section header="Bookings">
          {bookings.map((d) => {
            const its = items.filter((i) => i.booking_start === d);
            const left = its.reduce((s, i) => s + i.qty_left, 0);
            const bought = its.reduce((s, i) => s + i.qty_bought, 0);
            return (
              <div key={d} className="flex items-center">
                <button type="button" onClick={() => setSelected(d)} className="min-w-0 flex-1 text-left">
                  <Row
                    label={
                      <span className={d === current ? "text-ios-blue" : ""}>
                        {formatShortDate(d, true)}
                        {d === latest ? " · current" : ""}
                      </span>
                    }
                    sub={`${its.length} item${its.length === 1 ? "" : "s"} · ${left}/${bought} left`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => deleteBooking(d)}
                  className="px-4 text-[15px] text-ios-red"
                  aria-label={`Delete booking ${d}`}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </Section>
      )}

      <NewBookingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={(created) => {
          setItems((prev) => [...created, ...prev]);
          if (created[0]) setSelected(created[0].booking_start);
        }}
      />
    </div>
  );
}
