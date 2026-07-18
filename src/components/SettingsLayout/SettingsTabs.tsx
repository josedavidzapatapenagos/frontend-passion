import type { SettingsTabId, SettingsTabsProps } from "./types";

export const SettingsTabs = <TTabId extends SettingsTabId>({
  tabs,
  activeTabId,
  onTabChange,
}: SettingsTabsProps<TTabId>) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTabId === tab.id
              ? "bg-[#FD0083] text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-white/10 dark:border-transparent dark:text-white dark:hover:bg-white/20"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
