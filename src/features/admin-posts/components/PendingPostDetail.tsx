import type { AdminPendingPostDetail } from "../types/adminPosts";
import { EmptyState } from "../../../components/EmptyState";
import { InfoCard } from "../../../components/InfoCard";
import { SkeletonLoader } from "../../../components/SkeletonLoader";
import { StatusBadge } from "../../../components/StatusBadge";

type PendingPostDetailProps = {
  post: AdminPendingPostDetail | null;
  loading: boolean;
  processing: boolean;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString();
};

const formatMoney = (amount: number | null, currency: string | null): string => {
  if (amount === null || !currency) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

const DetailSkeleton = () => {
  return (
    <SkeletonLoader rows={6} />
  );
};

export const PendingPostDetail = ({
  post,
  loading,
  processing,
  onBack,
  onApprove,
  onReject,
}: PendingPostDetailProps) => {
  if (!post && !loading) {
    return (
      <EmptyState
        title="Selecciona una publicación"
        description="Aquí verás el detalle para revisarla antes de aprobarla o rechazarla."
      />
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-black text-[#FD0083]">Detalle de publicacion</h3>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-sm font-semibold text-slate-700 dark:text-white/80 hover:opacity-90"
        >
          Volver al listado
        </button>
      </div>

      {loading ? (
        <DetailSkeleton />
      ) : (
        <>
          <InfoCard
            title="Revisión administrativa"
            description="Revisa cuidadosamente la información antes de aprobar o rechazar la publicación."
          />

          <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10">
            {post?.coverImageUrl ? (
              <img src={post.coverImageUrl} alt={post.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-slate-500 dark:text-white/60">
                Sin imagen de portada
              </div>
            )}
          </div>

          <h4 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{post?.title || "Sin titulo"}</h4>
          <p className="mt-2 text-sm text-slate-700 dark:text-white/80 whitespace-pre-wrap">
            {post?.description || "Sin descripcion"}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
              <p className="text-slate-500 dark:text-white/60">Precio</p>
              <p className="font-bold text-slate-900 dark:text-white">{formatMoney(post?.priceAmount ?? null, post?.currency ?? null)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
              <p className="text-slate-500 dark:text-white/60">Moneda</p>
              <p className="font-bold text-slate-900 dark:text-white">{post?.currency || "-"}</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
              <p className="text-slate-500 dark:text-white/60">Fecha de creacion</p>
              <p className="font-bold text-slate-900 dark:text-white">{formatDate(post?.createdAt ?? null)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
              <p className="text-slate-500 dark:text-white/60">Estado</p>
              <div className="mt-1">
                <StatusBadge status={post?.status} showDescription />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={processing || !post}
              className="w-full rounded-xl bg-[#FD0083] text-white font-black px-4 py-3 hover:opacity-90 disabled:opacity-50"
            >
              {processing ? "Procesando..." : "Aprobar publicacion"}
            </button>

            <button
              type="button"
              onClick={onReject}
              disabled={processing || !post}
              className="w-full rounded-xl border border-rose-300 dark:border-rose-400/60 text-rose-700 dark:text-rose-200 font-bold px-4 py-3 bg-rose-50 dark:bg-rose-500/10 hover:opacity-90 disabled:opacity-50"
            >
              {processing ? "Procesando..." : "Rechazar publicacion"}
            </button>
          </div>
        </>
      )}
    </section>
  );
};
