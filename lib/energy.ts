// Daily energy balance: burned minus eaten.
// Burned is the watch's total calories (Polar's daily "Calories" already includes resting burn).
// Until a total is entered, an estimated resting burn stands in so the number is still meaningful.

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
  /** Total calories burned from the watch, including resting burn. 0 = not entered. */
  watchKcal: number;
  eatenKcal: number;
  /** Share of the day elapsed (0–1). The resting estimate only counts burn so far; defaults to the whole day. */
  dayFraction?: number;
}

export interface EnergyBalance {
  /** Where `burned` came from. */
  source: "watch" | "estimate" | null;
  /** Estimated resting burn for the whole day, when body stats are known. */
  resting: number | null;
  burned: number | null;
  eaten: number;
  /** burned − eaten: positive is a deficit, negative a surplus. Null when burned is unknown. */
  deficit: number | null;
  /** Body stats still needed for the resting-burn fallback. */
  missing: MissingStat[];
}

export function energyBalance(i: EnergyInputs): EnergyBalance {
  const missing: MissingStat[] = [];
  if (i.weightKg == null) missing.push("weight");
  if (i.heightCm == null) missing.push("height");
  if (i.birthYear == null) missing.push("birth_year");
  const resting = missing.length === 0 ? restingKcal(i.weightKg!, i.heightCm!, ageOn(i.birthYear!, i.date)) : null;

  const source = i.watchKcal > 0 ? "watch" : resting != null ? "estimate" : null;
  const fraction = Math.min(1, Math.max(0, i.dayFraction ?? 1));
  const burned = source === "watch" ? i.watchKcal : resting == null ? null : Math.round(resting * fraction);
  return {
    source,
    resting,
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
