import { describe, expect, it } from "vitest";
import { addDays } from "./date";
import { KCAL_PER_KG, buildPrediction, mondayOf } from "./prediction";

// 2026-10-21 is a Wednesday.
const today = "2026-10-21";

const daysWithDeficit = (from: string, n: number, deficit: number) =>
  Array.from({ length: n }, (_, i) => ({ date: addDays(from, i), burned: 3500, eaten: 3500 - deficit }));

describe("mondayOf", () => {
  it("finds the Monday of the week", () => {
    expect(mondayOf("2026-10-21")).toBe("2026-10-19");
    expect(mondayOf("2026-10-19")).toBe("2026-10-19");
    expect(mondayOf("2026-10-25")).toBe("2026-10-19"); // Sunday
  });
});

describe("buildPrediction", () => {
  it("averages the last 7 completed logged days, ignoring today", () => {
    const days = [...daysWithDeficit("2026-10-07", 14, 770), { date: today, burned: 1000, eaten: 3000 }];
    const p = buildPrediction({ today, days, weights: [], targetKg: null });
    expect(p.avgDeficit).toBe(770);
    expect(p.avgDays).toBe(7);
  });

  it("ignores days missing calories burned or food", () => {
    const days = [
      { date: "2026-10-18", burned: 3500, eaten: 2800 },
      { date: "2026-10-19", burned: 0, eaten: 2000 },
      { date: "2026-10-20", burned: 3500, eaten: 0 },
    ];
    const p = buildPrediction({ today, days, weights: [], targetKg: null });
    expect(p.avgDeficit).toBe(700);
    expect(p.avgDays).toBe(1);
  });

  it("forecasts each future week as average × 7 / 7700", () => {
    const p = buildPrediction({ today, days: daysWithDeficit("2026-10-10", 11, 1100), weights: [], targetKg: null });
    expect(p.future).toHaveLength(4);
    expect(p.future[0].start).toBe("2026-10-26");
    expect(p.future[0].predictedLossKg).toBeCloseTo((1100 * 7) / KCAL_PER_KG);
  });

  it("projects weight from the latest weigh-in", () => {
    // 1100 kcal/day deficit = 1 kg every 7 days.
    const days = daysWithDeficit("2026-10-10", 11, 1100);
    const p = buildPrediction({ today, days, weights: [{ date: "2026-10-19", kg: 80 }], targetKg: null });
    // Mon 19 through Sun 25 = 7 days.
    expect(p.current.predictedEndKg).toBeCloseTo(79);
    expect(p.future[0].predictedEndKg).toBeCloseTo(78);
    expect(p.future[3].predictedEndKg).toBeCloseTo(75);
  });

  it("predicts the target date", () => {
    const days = daysWithDeficit("2026-10-10", 11, 1100);
    const p = buildPrediction({ today, days, weights: [{ date: "2026-10-21", kg: 80 }], targetKg: 79 });
    expect(p.targetDate).toBe(addDays(today, 7));
  });

  it("marks the target reached, and gives no date without a deficit", () => {
    expect(
      buildPrediction({ today, days: [], weights: [{ date: today, kg: 70 }], targetKg: 72 }).targetDate,
    ).toBe("reached");
    expect(buildPrediction({ today, days: [], weights: [{ date: today, kg: 80 }], targetKg: 72 }).targetDate).toBeNull();
  });

  it("compares past weeks' predicted loss with real weigh-ins", () => {
    // Week of 12–18 Oct: 7 logged days at 1100 = 1 kg predicted; weigh-ins show −0.6 kg.
    const days = daysWithDeficit("2026-10-12", 7, 1100);
    const weights = [
      { date: "2026-10-11", kg: 81 },
      { date: "2026-10-18", kg: 80.4 },
    ];
    const p = buildPrediction({ today, days, weights, targetKg: null });
    const week = p.past.at(-1)!;
    expect(week.start).toBe("2026-10-12");
    expect(week.loggedDays).toBe(7);
    expect(week.predictedLossKg).toBeCloseTo(1);
    expect(week.actualChangeKg).toBeCloseTo(-0.6);
  });

  it("has no forecast without any logged days", () => {
    const p = buildPrediction({ today, days: [], weights: [{ date: today, kg: 80 }], targetKg: null });
    expect(p.avgDeficit).toBeNull();
    expect(p.future[0].predictedLossKg).toBeNull();
    expect(p.future[0].predictedEndKg).toBeNull();
  });
});
