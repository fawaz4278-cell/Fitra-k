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
  const base = { date: "2026-10-21", weightKg: 80, heightCm: 175, birthYear: 2006, activeKcal: 600, eatenKcal: 2000 };

  it("burned = resting + active, deficit = burned - eaten", () => {
    const b = energyBalance(base);
    expect(b.resting).toBe(1799);
    expect(b.burned).toBe(2399);
    expect(b.deficit).toBe(399);
    expect(b.missing).toEqual([]);
  });

  it("negative deficit is a surplus", () => {
    expect(energyBalance({ ...base, eatenKcal: 3000 }).deficit).toBe(-601);
  });

  it("reports missing body stats and leaves totals null", () => {
    const b = energyBalance({ ...base, heightCm: null, birthYear: null });
    expect(b.missing).toEqual(["height", "birth_year"]);
    expect(b.resting).toBeNull();
    expect(b.deficit).toBeNull();
    expect(b.eaten).toBe(2000);
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
