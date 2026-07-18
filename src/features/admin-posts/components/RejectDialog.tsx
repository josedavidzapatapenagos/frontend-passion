type RejectDialogProps = {
  open: boolean;
  loading: boolean;
  reason: string;
  reasonError: string;
  maxLength: number;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export const RejectDialog = ({
  open,
  loading,
  reason,
  reasonError,
  maxLength,
  onReasonChange,
  onCancel,
  onConfirm,
}: RejectDialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#013440] p-6 shadow-2xl">
        <p className="text-base font-black text-slate-900 dark:text-white">Rechazar publicacion</p>
        <div className="mt-4">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-50/70 dark:bg-amber-400/10 px-4 py-3">
            <p className="font-bold text-amber-900 dark:text-amber-200">Explica claramente el motivo</p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/90">
              La modelo verá este mensaje para corregir la publicación y volver a enviarla.
            </p>
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-white/80">
          Motivo del rechazo
        </label>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={6}
          maxLength={maxLength}
          placeholder="Escribe un motivo claro para el rechazo."
          className="mt-2 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#013440] px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-[#FD0083]"
        />

        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-white/60">{reason.length}/{maxLength}</span>
          {reasonError ? <span className="text-red-600 dark:text-red-300">{reasonError}</span> : null}
        </div>

        <p className="mt-4 text-sm text-slate-700 dark:text-white/80">
          Al rechazarla, la publicación dejará de avanzar hasta que se corrija y se envíe de nuevo.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-sm font-bold text-slate-700 dark:text-white/80 hover:opacity-90 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || Boolean(reasonError)}
            className="px-4 py-2 rounded-xl bg-rose-600 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Rechazando..." : "Rechazar"}
          </button>
        </div>
      </div>
    </div>
  );
};
