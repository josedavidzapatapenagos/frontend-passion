import { useEffect, useMemo, useState } from "react";
import { SettingsHeader } from "./SettingsHeader";
import { SettingsTabs } from "./SettingsTabs";
import type { SettingsLayoutProps, SettingsTabId } from "./types";

const DEFAULT_PANEL_CLASSES =
  "max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20";

const DEFAULT_CONTENT_CLASSES = "mt-6";

export const SettingsLayout = <TTabId extends SettingsTabId>({
  title,
  subtitle,
  tabs,
  initialTabId,
  tabsLabel = "Opciones",
  panelClassName,
  contentClassName = DEFAULT_CONTENT_CLASSES,
  onTabChange,
}: SettingsLayoutProps<TTabId>) => {
  const resolvedInitialTabId = useMemo(() => {
    const firstTabId = tabs[0]?.id;

    if (!firstTabId) {
      return undefined;
    }

    if (initialTabId && tabs.some((tab) => tab.id === initialTabId)) {
      return initialTabId;
    }

    return firstTabId;
  }, [initialTabId, tabs]);

  const [activeTabId, setActiveTabId] = useState<TTabId | undefined>(resolvedInitialTabId);

  useEffect(() => {
    if (!tabs.length) {
      setActiveTabId(undefined);
      return;
    }

    setActiveTabId((current) => {
      if (current && tabs.some((tab) => tab.id === current)) {
        return current;
      }

      return resolvedInitialTabId;
    });
  }, [resolvedInitialTabId, tabs]);

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId), [activeTabId, tabs]);

  const handleTabChange = (tabId: TTabId) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={panelClassName || DEFAULT_PANEL_CLASSES}>
      <SettingsHeader title={title} subtitle={subtitle} />

      <div className="mt-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-3">
        <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide mb-3">{tabsLabel}</p>
        {activeTabId ? (
          <SettingsTabs tabs={tabs} activeTabId={activeTabId} onTabChange={handleTabChange} />
        ) : null}
      </div>

      <div className={contentClassName}>{activeTab?.content || null}</div>
    </div>
  );
};
