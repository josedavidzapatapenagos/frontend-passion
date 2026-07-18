import type { ReactNode } from "react";

export type SettingsTabId = string;

export type SettingsTab<TTabId extends SettingsTabId = SettingsTabId> = {
  id: TTabId;
  label: string;
  content: ReactNode;
  disabled?: boolean;
};

export type SettingsHeaderProps = {
  title: string;
  subtitle: string;
};

export type SettingsTabsProps<TTabId extends SettingsTabId = SettingsTabId> = {
  tabs: readonly SettingsTab<TTabId>[];
  activeTabId: TTabId;
  onTabChange: (tabId: TTabId) => void;
};

export type SettingsLayoutProps<TTabId extends SettingsTabId = SettingsTabId> = {
  title: string;
  subtitle: string;
  tabs: readonly SettingsTab<TTabId>[];
  initialTabId?: TTabId;
  tabsLabel?: string;
  panelClassName?: string;
  contentClassName?: string;
  onTabChange?: (tabId: TTabId) => void;
};
