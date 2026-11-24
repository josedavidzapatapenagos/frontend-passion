import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

type Props = {
  label: string;
  value: number;
  icon: ReactNode;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  tone?: "accent" | "success" | "warning";
};

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  accent: "from-[color-mix(in_srgb,var(--vp-accent)_18%,transparent)] to-transparent text-[var(--vp-accent)]",
  success: "from-[color-mix(in_srgb,var(--vp-success)_18%,transparent)] to-transparent text-[var(--vp-success)]",
  warning: "from-[color-mix(in_srgb,var(--vp-warning)_18%,transparent)] to-transparent text-[var(--vp-warning)]",
};

export const StatCard = ({ label, value, icon, decimals = 0, prefix = "", suffix = "", tone = "accent" }: Props) => (
  <div className="group relative overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <div className={`pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br ${TONE_STYLES[tone]} opacity-70 blur-xl transition-opacity duration-300 group-hover:opacity-100`} />
    <div className="relative flex items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">{label}</p>
      <span className={`flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)] ${TONE_STYLES[tone].split(" ").pop()}`}>
        {icon}
      </span>
    </div>
    <p className="relative mt-3 text-3xl font-black tabular-nums text-[var(--vp-text-primary)]">
      <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
    </p>
  </div>
);
