// Daily energy balance: burned (resting + active) minus eaten.

/** Mifflin-St Jeor resting burn for men, in kcal/day. The app uses the male IPPT tables, so male is assumed. */
export function restingKcal(weightKg: number, heightCm: number, age: number): number {
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
}

/** Age in whole years, approximated from birth year (accurate to within a year). */
export function ageOn(birthYear: number, isoDate: string): number {
  return Number(isoDate.slice(0, 4)) - birthYear;
}

export type MissingStat = "weight" | "height" | "birth_year";

export interface EnergyInputs {
  date: string;
  weightKg: number | null;
  heightCm: number | null;
  birthYear: number | null;
  /** Active calories from a watch/phone (resting burn is added on top). */
  activeKcal: number;
  eatenKcal: number;
}

export interface EnergyBalance {
  resting: number | null;
  active: number;
  burned: number | null;
  eaten: number;
  /** burned − eaten: positive is a deficit, negative a surplus. Null until body stats are set. */
  deficit: number | null;
  missing: MissingStat[];
}

export function energyBalance(i: EnergyInputs): EnergyBalance {
  const missing: MissingStat[] = [];
  if (i.weightKg == null) missing.push("weight");
  if (i.heightCm == null) missing.push("height");
  if (i.birthYear == null) missing.push("birth_year");
  const resting = missing.length === 0 ? restingKcal(i.weightKg!, i.heightCm!, ageOn(i.birthYear!, i.date)) : null;
  const burned = resting == null ? null : resting + i.activeKcal;
  return {
    resting,
    active: i.activeKcal,
    burned,
    eaten: i.eatenKcal,
    deficit: burned == null ? null : burned - i.eatenKcal,
    missing,
  };
}

/** Latest weight logged on or before `date` (weights in any order). */
export function weightOn(weights: { date: string; kg: number }[], date: string): number | null {
  let best: { date: string; kg: number } | null = null;
  for (const w of weights) if (w.date <= date && (!best || w.date > best.date)) best = w;
  return best ? Number(best.kg) : null;
}
