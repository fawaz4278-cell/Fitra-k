/** Gradient flame for streaks; dimmed when the streak is 0. */
export function FlameIcon({ lit, size = 26 }: { lit: boolean; size?: number }) {
  return (
    <svg width={size} height={(size * 30) / 26} viewBox="0 0 24 28" aria-hidden="true" className={lit ? "drop-shadow-[0_0_10px_rgba(255,122,47,0.6)]" : "opacity-30"}>
      <defs>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd60a" />
          <stop offset="100%" stopColor="#ff5a1f" />
        </linearGradient>
      </defs>
      <path
        fill="url(#flame)"
        d="M12 1c1 4.2 6.5 7 6.5 13.4A6.6 6.6 0 0 1 12 21a6.6 6.6 0 0 1-6.5-6.6c0-3 1.6-5 3-6.4.2 2 1.2 3.4 2.6 4C10.6 8.3 11 4.4 12 1Zm0 13.2c-.8 1.4-2.3 2.3-2.3 4A2.3 2.3 0 0 0 12 20.6a2.3 2.3 0 0 0 2.3-2.4c0-1.7-1.5-2.6-2.3-4Z"
      />
    </svg>
  );
}
