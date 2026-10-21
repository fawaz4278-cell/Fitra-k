"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { formatShortDate, todayISO } from "@/lib/date";
import type { StashItem } from "@/lib/types";
import { Card, LargeTitle, Row, Section } from "@/components/ui";
import { NewBookingSheet } from "./NewBookingSheet";
import { StashItemRow } from "./StashItemRow";
import { addToTally, readTally } from "./tally";

export function StashScreen() {
  const today = todayISO();
  const [items, setItems] = useState<StashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tonight, setTonight] = useState(0);

  useEffect(() => {
    setTonight(readTally(today));
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

  async function changeQty(item: StashItem, delta: 1 | -1) {
    const nextQty = item.qty_left + delta;
    if (nextQty < 0 || nextQty > item.qty_bought) return;
    // Optimistic update.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty_left: nextQty } : i)));
    setTonight(addToTally(today, delta === -1 ? item.kcal_per_unit : -item.kcal_per_unit));
    const { error } = await createClient().from("stash_items").update({ qty_left: nextQty }).eq("id", item.id);
    if (error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty_left: item.qty_left } : i)));
      setTonight(addToTally(today, delta === -1 ? -item.kcal_per_unit : item.kcal_per_unit));
      setError(error.message);
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
            className="mb-2 rounded-full bg-ios-card px-3.5 py-1.5 text-[15px] font-semibold text-ios-blue"
          >
            New booking
          </button>
        }
      />

      {error && <p className="mx-4 mb-3 text-[15px] text-ios-red">{error}</p>}

      <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-[13px] uppercase text-ios-label2">Eaten tonight</div>
          <div className="mt-1 text-[28px] font-bold tabular-nums">
            {tonight}
            <span className="ml-1 text-[15px] font-normal text-ios-label2">kcal</span>
          </div>
        </Card>
        <Card>
          <div className="text-[13px] uppercase text-ios-label2">Items left</div>
          <div className="mt-1 text-[28px] font-bold tabular-nums">{totalLeft}</div>
          <div className="text-[13px] text-ios-label2">{kcalLeft} kcal in stash</div>
        </Card>
      </div>

      {loading ? (
        <p className="px-4 text-[15px] text-ios-label2">Loading…</p>
      ) : !current ? (
        <div className="mx-4 rounded-[14px] bg-ios-card p-6 text-center">
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
