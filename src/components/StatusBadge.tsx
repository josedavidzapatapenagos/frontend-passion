import { getStatusMeta } from "../services/statusMapper";
import { AppIcon } from "./AppIcon";

type Props = {
  status?: string | null;
  showDescription?: boolean;
};

const TONE_CLASSES: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
  error: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  neutral: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white/80",
};

export const StatusBadge = ({ status, showDescription = false }: Props) => {
  const meta = getStatusMeta(status);

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
          TONE_CLASSES[meta.color]
        }`}
      >
        <AppIcon name={meta.icon} className="h-3.5 w-3.5" />
        {meta.label}
      </span>
      {showDescription && meta.description ? (
        <span className="text-xs text-slate-600 dark:text-white/60">{meta.description}</span>
      ) : null}
    </div>
  );
};