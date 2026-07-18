import type { AdminPendingPostListItem } from "../types/adminPosts";
import { PendingPostCard } from "./PendingPostCard";

type PendingPostsListProps = {
  items: AdminPendingPostListItem[];
  selectedPostId: string | null;
  loading: boolean;
  processingPostId: string | null;
  reloading: boolean;
  onReview: (postId: string) => void;
  onReload: () => void;
};

const PendingPostsListSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`pending-post-skeleton-${index}`}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-40 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const PendingPostsList = ({
  items,
  selectedPostId,
  loading,
  processingPostId,
  reloading,
  onReview,
  onReload,
}: PendingPostsListProps) => {
  if (loading) {
    return <PendingPostsListSkeleton />;
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-400/30 bg-emerald-50/70 dark:bg-emerald-500/10 p-8 text-center">
        <p className="text-3xl leading-none" aria-hidden>
          ✔
        </p>
        <h3 className="mt-3 text-xl font-black text-emerald-700 dark:text-emerald-300">Todo al dia</h3>
        <p className="mt-2 text-slate-700 dark:text-white/80 font-semibold">No hay publicaciones pendientes de revision.</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
          Las nuevas publicaciones apareceran aqui cuando una modelo envie contenido para revision.
        </p>

        <button
          type="button"
          onClick={onReload}
          disabled={reloading}
          className="mt-5 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {reloading ? "Cargando..." : "Actualizar"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((post) => (
        <PendingPostCard
          key={post.id}
          post={post}
          selected={selectedPostId === post.id}
          disabled={processingPostId === post.id}
          onReview={onReview}
        />
      ))}
    </div>
  );
};
