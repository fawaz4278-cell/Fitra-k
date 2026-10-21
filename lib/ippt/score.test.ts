import { describe, expect, it } from "vitest";
import { awardFor, nextAwardGap, pushupPoints, runPoints, score, situpPoints } from "./score";
import { PUSHUP_TABLE, RUN_TABLE, SITUP_TABLE } from "./tables";
import type { AgeGroup } from "../types";

const t = (m: number, s: number) => m * 60 + s;

// Expected values below are read directly from the PDFs in docs/ippt/.
describe("push-up table", () => {
  it.each<[AgeGroup, number, number]>([
    [1, 60, 25],
    [1, 61, 25], // above table max
    [1, 59, 24],
    [1, 15, 1],
    [1, 14, 0],
    [2, 59, 25],
    [4, 36, 19],
    [7, 30, 18],
    [14, 40, 25],
    [14, 41, 25], // blank cell above max
    [14, 2, 1],
    [14, 1, 0],
    [3, 0, 0],
  ])("AG%i, %i reps -> %i pts", (ag, reps, pts) => {
    expect(pushupPoints(ag, reps)).toBe(pts);
  });
});

describe("sit-up table", () => {
  it.each<[AgeGroup, number, number]>([
    [1, 60, 25],
    [1, 34, 16],
    [3, 37, 19],
    [8, 19, 10],
    [9, 24, 14],
    [11, 48, 25],
    [14, 42, 25],
    [14, 41, 24],
    [14, 2, 1],
    [13, 2, 0],
  ])("AG%i, %i reps -> %i pts", (ag, reps, pts) => {
    expect(situpPoints(ag, reps)).toBe(pts);
  });
});

describe("2.4km table", () => {
  it.each<[AgeGroup, number, number]>([
    [1, t(8, 0), 50], // faster than fastest row
    [1, t(8, 30), 50], // exactly on boundary
    [1, t(8, 31), 49], // 1s over -> slower row (8:40)
    [1, t(8, 40), 49],
    [1, t(8, 41), 48],
    [4, t(9, 0), 50], // blank cell above AG4's first 50
    [4, t(9, 10), 50],
    [4, t(9, 11), 49],
    [8, t(10, 0), 49],
    [2, t(15, 20), 10],
    [4, t(15, 50), 10],
    [9, t(16, 40), 10],
    [5, t(11, 0), 40],
    [1, t(16, 0), 1],
    [1, t(16, 1), 0],
    [14, t(18, 20), 1],
    [14, t(18, 21), 0], // slower than slowest row
    [14, t(25, 0), 0],
  ])("AG%i, %is -> %i pts", (ag, secs, pts) => {
    expect(runPoints(ag, secs)).toBe(pts);
  });
});

describe("score() totals and awards", () => {
  it("perfect score is gold", () => {
    expect(score(1, 60, 60, t(8, 30))).toEqual({ pu_pts: 25, su_pts: 25, run_pts: 50, total: 100, award: "gold" });
  });
  it("85 is gold, 84 is silver", () => {
    expect(score(1, 60, 60, t(11, 40))).toMatchObject({ run_pts: 35, total: 85, award: "gold" });
    expect(score(1, 60, 60, t(11, 50))).toMatchObject({ run_pts: 34, total: 84, award: "silver" });
  });
  it("75 is silver, 74 is pass with incentive", () => {
    expect(score(1, 60, 60, t(13, 20))).toMatchObject({ run_pts: 25, total: 75, award: "silver" });
    expect(score(1, 60, 60, t(13, 30))).toMatchObject({ run_pts: 24, total: 74, award: "incentive" });
  });
  it("61 is pass with incentive, 60 is pass", () => {
    expect(score(1, 59, 60, t(15, 0))).toMatchObject({ pu_pts: 24, su_pts: 25, run_pts: 12, total: 61, award: "incentive" });
    expect(score(1, 60, 60, t(15, 10))).toMatchObject({ run_pts: 10, total: 60, award: "pass" });
  });
  it("51 is pass, 50 is fail", () => {
    expect(score(1, 60, 60, t(16, 0))).toMatchObject({ run_pts: 1, total: 51, award: "pass" });
    expect(score(1, 60, 60, t(16, 10))).toMatchObject({ run_pts: 0, total: 50, award: "fail" });
  });
  it("no per-station minimum: 0 pts on a station can still pass on total", () => {
    expect(score(1, 10, 60, t(8, 30))).toMatchObject({ pu_pts: 0, total: 75, award: "silver" });
  });
  it("realistic mixed attempt (AG5)", () => {
    expect(score(5, 40, 40, t(11, 0))).toEqual({ pu_pts: 21, su_pts: 21, run_pts: 40, total: 82, award: "silver" });
  });
  it("awardFor thresholds", () => {
    expect([85, 84, 75, 74, 61, 60, 51, 50].map(awardFor)).toEqual([
      "gold", "silver", "silver", "incentive", "incentive", "pass", "pass", "fail",
    ]);
  });
  it("nextAwardGap", () => {
    expect(nextAwardGap(80, "gold")).toBe(5);
    expect(nextAwardGap(90, "silver")).toBe(0);
  });
});

describe("table integrity", () => {
  it.each([
    ["push-up", PUSHUP_TABLE, 25],
    ["sit-up", SITUP_TABLE, 25],
    ["2.4km", RUN_TABLE, 50],
  ] as const)("%s: 60 rows x 14 age groups, monotonic, starts at max", (_name, table, max) => {
    expect(table).toHaveLength(60);
    for (let ag = 0; ag < 14; ag++) {
      let prev: number | null = null;
      for (const [, pts] of table) {
        expect(pts).toHaveLength(14);
        const v = pts[ag];
        if (v === null) {
          expect(prev).toBeNull();
          continue;
        }
        if (prev === null) expect(v).toBe(max);
        else expect(v).toBeLessThanOrEqual(prev);
        prev = v;
      }
    }
  });
  it("run rows are consecutive 10s bands from 8:30 to 18:20", () => {
    RUN_TABLE.forEach(([secs], i) => expect(secs).toBe(t(8, 30) + i * 10));
    expect(RUN_TABLE.at(-1)![0]).toBe(t(18, 20));
  });
});
