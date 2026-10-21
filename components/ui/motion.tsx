"use client";

import { useEffect, useRef, useState } from "react";

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** True after the first paint, so widths/offsets can transition in from their empty state. */
export function useMounted(delay = 60): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return mounted;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Animates from the previous value (0 on first mount) to `value`. */
export function useCountUp(value: number, duration = 1100): number {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = easeOutExpo(Math.min(1, (now - start) / duration));
      const v = origin + (value - origin) * p;
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return shown;
}

/** A number that counts up to its value. `decimals` controls rounding; thousands get separators. */
export function CountUp({ value, decimals = 0, duration }: { value: number; decimals?: number; duration?: number }) {
  const v = useCountUp(value, duration);
  return (
    <>
      {v.toLocaleString("en-SG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </>
  );
}
