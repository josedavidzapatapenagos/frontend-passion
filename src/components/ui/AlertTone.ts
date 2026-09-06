import type { NotificationTone } from "@/features/notifications/services/notificationService";

export type AlertTone = NotificationTone | "neutral";

export const getAlertToneClasses = (tone: AlertTone) => {
  switch (tone) {
    case "success":
      return {
        container: "border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
        icon: "text-emerald-600 dark:text-emerald-300",
        secondaryButton: "border-emerald-500/25 text-emerald-800 dark:text-emerald-100",
      };
    case "info":
      return {
        container: "border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100",
        icon: "text-sky-600 dark:text-sky-300",
        secondaryButton: "border-sky-500/25 text-sky-800 dark:text-sky-100",
      };
    case "warning":
      return {
        container: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        icon: "text-amber-600 dark:text-amber-300",
        secondaryButton: "border-amber-500/25 text-amber-900 dark:text-amber-100",
      };
    case "error":
      return {
        container: "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100",
        icon: "text-rose-600 dark:text-rose-300",
        secondaryButton: "border-rose-500/25 text-rose-800 dark:text-rose-100",
      };
    default:
      return {
        container: "border-slate-300/70 bg-slate-100/80 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white",
        icon: "text-slate-500 dark:text-white/70",
        secondaryButton: "border-slate-300 dark:border-white/15 text-slate-700 dark:text-white/80",
      };
  }
};