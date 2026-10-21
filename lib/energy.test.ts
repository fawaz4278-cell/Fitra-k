import { describe, expect, it } from "vitest";
import { ageOn, energyBalance, restingKcal, weightOn } from "./energy";

describe("restingKcal", () => {
  it("matches Mifflin-St Jeor for men", () => {
    // 10*80 + 6.25*175 - 5*20 + 5 = 1798.75
    expect(restingKcal(80, 175, 20)).toBe(1799);
  });
});

describe("ageOn", () => {
  it("uses the calendar year", () => {
    expect(ageOn(2005, "2026-10-21")).toBe(21);
  });
});

describe("energyBalance", () => {
  const base = { date: "2026-10-21", weightKg: 80, heightCm: 175, birthYear: 2006, watchKcal: 0, eatenKcal: 2000 };

  it("uses the watch total as burned, without adding resting burn", () => {
    const b = energyBalance({ ...base, watchKcal: 3942 });
    expect(b.source).toBe("watch");
    expect(b.burned).toBe(3942);
    expect(b.deficit).toBe(1942);
    expect(b.resting).toBe(1799);
  });

  it("falls back to estimated resting burn when no watch total is entered", () => {
    const b = energyBalance(base);
    expect(b.source).toBe("estimate");
    expect(b.burned).toBe(1799);
    expect(b.deficit).toBe(-201);
  });

  it("only counts resting burn so far for a day in progress", () => {
    const b = energyBalance({ ...base, eatenKcal: 0, dayFraction: 0.25 });
    expect(b.burned).toBe(450);
    expect(b.deficit).toBe(450);
    expect(b.resting).toBe(1799);
  });

  it("day fraction doesn't affect the watch total", () => {
    expect(energyBalance({ ...base, watchKcal: 3000, dayFraction: 0.25 }).burned).toBe(3000);
  });

  it("watch total works even without body stats", () => {
    const b = energyBalance({ ...base, heightCm: null, birthYear: null, watchKcal: 3000 });
    expect(b.deficit).toBe(1000);
    expect(b.missing).toEqual(["height", "birth_year"]);
  });

  it("is unknown with no watch total and no body stats", () => {
    const b = energyBalance({ ...base, weightKg: null });
    expect(b.source).toBeNull();
    expect(b.deficit).toBeNull();
    expect(b.missing).toEqual(["weight"]);
  });
});

describe("weightOn", () => {
  const weights = [
    { date: "2026-10-10", kg: 82 },
    { date: "2026-10-20", kg: 80.5 },
    { date: "2026-10-25", kg: 79 },
  ];
  it("picks the latest weigh-in on or before the date", () => {
    expect(weightOn(weights, "2026-10-21")).toBe(80.5);
    expect(weightOn(weights, "2026-10-20")).toBe(80.5);
  });
  it("is null before the first weigh-in", () => {
    expect(weightOn(weights, "2026-10-01")).toBeNull();
  });
});

describe("dayFractionSG", () => {
  it("reads the Singapore clock", async () => {
    const { dayFractionSG } = await import("./date");
    expect(dayFractionSG(new Date("2026-10-21T22:00:00Z"))).toBeCloseTo(0.25); // 06:00 SGT
    expect(dayFractionSG(new Date("2026-10-21T16:00:00Z"))).toBe(0); // 00:00 SGT
  });
});
