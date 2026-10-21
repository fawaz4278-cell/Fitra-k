import { AWARD_LABELS, type IpptAward } from "@/lib/types";

const STYLES: Record<IpptAward, string> = {
  gold: "bg-gradient-to-b from-[#fff3b0] to-[#ffc93c] text-[#3a2a00] shadow-[0_6px_18px_-6px_rgba(255,201,60,0.8)]",
  silver: "bg-gradient-to-b from-[#ffffff] to-[#b8bcc6] text-[#1c1d22] shadow-[0_6px_18px_-6px_rgba(220,225,235,0.6)]",
  pass: "bg-gradient-to-b from-[#86efac] to-[#30d158] text-[#03230f] shadow-[0_6px_18px_-6px_rgba(48,209,88,0.7)]",
  fail: "bg-[#ff453a]/20 text-[#ff6961]",
};

export function AwardBadge({ award }: { award: IpptAward }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-bold tracking-wide ${STYLES[award]}`}>
      {AWARD_LABELS[award]}
    </span>
  );
}
