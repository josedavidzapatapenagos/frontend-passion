import type { SettingsHeaderProps } from "./types";

export const SettingsHeader = ({ title, subtitle }: SettingsHeaderProps) => {
  return (
    <header>
      <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">{title}</h2>
      <p className="mt-2 text-slate-600 dark:text-white/70">{subtitle}</p>
    </header>
  );
};
