type ReviewToolbarProps = {
  page: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  onReload: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
};

export const ReviewToolbar = ({
  page,
  totalPages,
  totalElements,
  loading,
  onReload,
  onPrevPage,
  onNextPage,
  canGoPrev,
  canGoNext,
}: ReviewToolbarProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-700 dark:text-white/70">Publicaciones pendientes</p>
          <p className="text-xl font-black text-[#FD0083]">{totalElements}</p>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={!canGoPrev || loading}
          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="text-slate-700 dark:text-white/70 text-center">
          Pagina {page + 1} de {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          onClick={onNextPage}
          disabled={!canGoNext || loading}
          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
