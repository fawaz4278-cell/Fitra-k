// Types mirroring supabase/migrations/001_init.sql.
// Postgres `date` columns are ISO strings (YYYY-MM-DD); `numeric` columns are returned as numbers.

/** IPPT age group index as printed in the official tables: 1 = <22, 2 = 22-24, ... 14 = 58-60. */
export type AgeGroup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export const AGE_GROUPS: readonly AgeGroup[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  1: "<22",
  2: "22-24",
  3: "25-27",
  4: "28-30",
  5: "31-33",
  6: "34-36",
  7: "37-39",
  8: "40-42",
  9: "43-45",
  10: "46-48",
  11: "49-51",
  12: "52-54",
  13: "55-57",
  14: "58-60",
};

export type IpptAward = "gold" | "silver" | "incentive" | "pass" | "fail";
export type IpptTarget = "pass" | "incentive" | "silver" | "gold";

export const AWARD_LABELS: Record<IpptAward, string> = {
  gold: "Gold",
  silver: "Silver",
  incentive: "Pass (Incentive)",
  pass: "Pass",
  fail: "Fail",
};

/** Minimum total points for each target award. */
export const AWARD_THRESHOLDS: Record<IpptTarget, number> = {
  gold: 85,
  silver: 75,
  incentive: 61,
  pass: 51,
};

export interface IpptAttempt {
  id: string;
  user_id: string;
  date: string;
  age_group: AgeGroup;
  pushups: number;
  situps: number;
  run_seconds: number;
  pu_pts: number;
  su_pts: number;
  run_pts: number;
  total: number;
  award: IpptAward;
  created_at: string;
}

export interface Weight {
  id: string;
  user_id: string;
  date: string;
  kg: number;
  waist_cm: number | null;
  note: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  kcal_burned: number;
  pt_sessions: number;
  water_l: number;
  sleep_h: number;
  half_rice: boolean;
  no_sweet_drinks: boolean;
  night_snack: string | null;
  created_at: string;
  updated_at: string;
}

export interface StashItem {
  id: string;
  user_id: string;
  booking_start: string;
  name: string;
  qty_bought: number;
  qty_left: number;
  kcal_per_unit: number;
  created_at: string;
}

export interface Goals {
  user_id: string;
  target_kg: number | null;
  ippt_target: IpptTarget;
  age_group: AgeGroup | null;
  updated_at: string;
}

/** Insert payloads: server fills id, user_id (default auth.uid()), timestamps. */
export type IpptAttemptInsert = Omit<IpptAttempt, "id" | "user_id" | "created_at">;
export type WeightInsert = Omit<Weight, "id" | "user_id" | "created_at">;
export type DailyLogUpsert = Omit<DailyLog, "id" | "user_id" | "created_at" | "updated_at">;
export type StashItemInsert = Omit<StashItem, "id" | "user_id" | "created_at">;
export type GoalsUpsert = Omit<Goals, "user_id" | "updated_at">;

/** Result of lib/ippt/score.ts `score()`. */
export interface IpptScore {
  pu_pts: number;
  su_pts: number;
  run_pts: number;
  total: number;
  award: IpptAward;
}
