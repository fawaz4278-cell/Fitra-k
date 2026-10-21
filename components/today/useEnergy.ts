"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { FoodLog } from "@/lib/types";

export interface EnergyData {
  loaded: boolean;
  error: string;
  weightKg: number | null;
  heightCm: number | null;
  birthYear: number | null;
  foods: FoodLog[];
  setFoods: React.Dispatch<React.SetStateAction<FoodLog[]>>;
  setBodyStats: (heightCm: number | null, birthYear: number | null) => void;
}

/** Loads what the calorie balance needs for one day: body stats, weight on that day, and food eaten. */
export function useEnergy(date: string): EnergyData {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [foods, setFoods] = useState<FoodLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    const supabase = createClient();
    Promise.all([
      supabase.from("goals").select("height_cm, birth_year").maybeSingle(),
      supabase.from("weights").select("kg").lte("date", date).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("food_logs").select("*").eq("date", date).order("created_at", { ascending: true }),
    ]).then(([goals, weight, food]) => {
      if (cancelled) return;
      const err = goals.error ?? weight.error ?? food.error;
      setError(err ? err.message : "");
      setHeightCm(goals.data?.height_cm == null ? null : Number(goals.data.height_cm));
      setBirthYear(goals.data?.birth_year ?? null);
      setWeightKg(weight.data ? Number(weight.data.kg) : null);
      setFoods((food.data as FoodLog[]) ?? []);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const setBodyStats = useCallback((h: number | null, b: number | null) => {
    setHeightCm(h);
    setBirthYear(b);
  }, []);

  return { loaded, error, weightKg, heightCm, birthYear, foods, setFoods, setBodyStats };
}
