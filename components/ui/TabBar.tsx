"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/",
    label: "Home",
    icon: icon(
      <>
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9v11h4.5v-6h4v6h4.5V9" />
      </>,
    ),
  },
  {
    href: "/ippt",
    label: "IPPT",
    icon: icon(
      <>
        <circle cx="12" cy="13" r="7.5" />
        <path d="M12 13V9.5M10 2.5h4M18.5 6.5l1.5-1.5" />
      </>,
    ),
  },
  {
    href: "/weight",
    label: "Weight",
    icon: icon(
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        <path d="M8 9.5a5.5 5.5 0 0 1 8 0l-2.5 2.5a2 2 0 0 0-3 0Z" />
      </>,
    ),
  },
  {
    href: "/today",
    label: "Today",
    icon: icon(
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4M8.5 15l2.2 2.2 4.8-4.7" />
      </>,
    ),
  },
  {
    href: "/stash",
    label: "Stash",
    icon: icon(
      <>
        <path d="M4 8.5h16l-1.3 10.6a1.6 1.6 0 0 1-1.6 1.4H6.9a1.6 1.6 0 0 1-1.6-1.4Z" />
        <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
      </>,
    ),
  },
];

/** Floating glass tab bar, clear of the home indicator. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-40 mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#141418]/75 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl backdrop-saturate-150"
    >
      <ul className="flex h-[64px] items-stretch px-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href} className="flex-1 py-1.5">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-[3px] rounded-[22px] transition-colors duration-200 ${
                  active ? "bg-white/[0.09] text-white" : "text-white/45 active:text-white/70"
                }`}
              >
                {t.icon}
                <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
