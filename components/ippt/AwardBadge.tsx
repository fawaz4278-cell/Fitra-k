import { AWARD_LABELS, type IpptAward } from "@/lib/types";

const COLORS: Record<IpptAward, string> = {
  gold: "bg-ios-yellow/20 text-ios-yellow",
  silver: "bg-white/15 text-white",
  pass: "bg-ios-green/20 text-ios-green",
  fail: "bg-ios-red/20 text-ios-red",
};

export function AwardBadge({ award }: { award: IpptAward }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${COLORS[award]}`}>
      {AWARD_LABELS[award]}
    </span>
  );
}
