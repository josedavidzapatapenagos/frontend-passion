import type { ReactNode } from "react";
import { AppIcon } from "./AppIcon";
import type { AlertTone } from "./alertTone";
import { getAlertToneClasses } from "./alertTone";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  tone?: AlertTone;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmationDialog = ({
  open,
  title,
  description,
  tone = "warning",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onCancel,
  onConfirm,
}: Props) => {
  if (!open) {
    return null;
  }

  const classes = getAlertToneClasses(tone);
  const iconName = tone === "error" ? "error" : tone === "success" ? "success" : tone === "warning" ? "warning" : "info";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#013440]">
        <div className="flex items-start gap-3">
          <div className={`rounded-2xl p-2 ${classes.container}`}>
            <AppIcon name={iconName} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-slate-900 dark:text-white">{title}</p>
            {description ? <div className="mt-2 text-sm text-slate-700 dark:text-white/75">{description}</div> : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:opacity-90 disabled:opacity-50 dark:border-white/15 dark:text-white/80"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-[#FD0083] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};