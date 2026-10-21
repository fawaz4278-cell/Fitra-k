import type { AgeGroup, IpptAward, IpptScore, IpptTarget } from "../types";
import { AWARD_THRESHOLDS } from "../types";
import { PUSHUP_TABLE, RUN_TABLE, SITUP_TABLE, STATION_MAX, type PointsRow } from "./tables";

// The official tables state no minimum-points-per-station rule, so the award is
// decided by total points alone.

function cell(row: PointsRow, ageGroup: AgeGroup, max: number): number {
  // Blank cells only sit above a column's first max cell, so they mean max points.
  return row[1][ageGroup - 1] ?? max;
}

/** Points for a rep-based station. Rows run from the highest rep count down to 1. */
function repPoints(table: readonly PointsRow[], max: number, ageGroup: AgeGroup, reps: number): number {
  const r = Math.floor(reps);
  if (!(r >= 1)) return 0;
  const top = table[0];
  if (r >= top[0]) return cell(top, ageGroup, max);
  const row = table.find(([key]) => key === r);
  return row ? cell(row, ageGroup, max) : 0;
}

export function pushupPoints(ageGroup: AgeGroup, pushups: number): number {
  return repPoints(PUSHUP_TABLE, STATION_MAX.pushups, ageGroup, pushups);
}

export function situpPoints(ageGroup: AgeGroup, situps: number): number {
  return repPoints(SITUP_TABLE, STATION_MAX.situps, ageGroup, situps);
}

/**
 * Points for the 2.4km run. Rows are "Time (≤)": a time between two rows scores as the
 * slower row. Faster than the fastest row scores max; slower than the slowest row scores 0.
 */
export function runPoints(ageGroup: AgeGroup, runSeconds: number): number {
  if (!(runSeconds > 0)) return 0;
  const row = RUN_TABLE.find(([key]) => runSeconds <= key);
  return row ? cell(row, ageGroup, STATION_MAX.run) : 0;
}

export function awardFor(total: number): IpptAward {
  if (total >= AWARD_THRESHOLDS.gold) return "gold";
  if (total >= AWARD_THRESHOLDS.silver) return "silver";
  if (total >= AWARD_THRESHOLDS.incentive) return "incentive";
  if (total >= AWARD_THRESHOLDS.pass) return "pass";
  return "fail";
}

export function score(ageGroup: AgeGroup, pushups: number, situps: number, runSeconds: number): IpptScore {
  const pu_pts = pushupPoints(ageGroup, pushups);
  const su_pts = situpPoints(ageGroup, situps);
  const run_pts = runPoints(ageGroup, runSeconds);
  const total = pu_pts + su_pts + run_pts;
  return { pu_pts, su_pts, run_pts, total, award: awardFor(total) };
}

/** Points still needed to reach a target award (0 if already there). */
export function nextAwardGap(total: number, target: IpptTarget): number {
  return Math.max(0, AWARD_THRESHOLDS[target] - total);
}
