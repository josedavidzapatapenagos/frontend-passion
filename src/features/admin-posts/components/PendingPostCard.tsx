import type { AdminPendingPostListItem } from "../types/adminPosts";

type PendingPostCardProps = {
  post: AdminPendingPostListItem;
  selected: boolean;
  disabled: boolean;
  onReview: (postId: string) => void;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Fecha no disponible";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Fecha no disponible";
  }

  return parsed.toLocaleString();
};

const formatStatus = (status: string): string => {
  const normalized = status.toUpperCase();

  if (normalized === "PENDING" || normalized === "PENDING_REVIEW") {
    return "pendiente por revisar";
  }

  return status;
};

export const PendingPostCard = ({ post, selected, disabled, onReview }: PendingPostCardProps) => {
  return (
    <article
      className={`rounded-2xl border p-4 transition-all ${
        selected
          ? "border-[#FD0083] bg-[#FD0083]/10"
          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Publicacion pendiente</h3>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">Estado</p>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{formatStatus(post.status)}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">Fecha de creacion</p>
            <p className="text-sm text-slate-700 dark:text-white/80">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onReview(post.id)}
          disabled={disabled}
          className="px-4 py-2 rounded-xl bg-[#00BCD4] text-[#012a33] font-bold hover:opacity-90 disabled:opacity-50"
        >
          {disabled ? "Procesando..." : "Revisar"}
        </button>
      </div>
    </article>
  );
};
