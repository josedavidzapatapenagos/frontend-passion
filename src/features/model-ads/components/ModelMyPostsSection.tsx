import { useEffect, useState } from "react";
import type { ModelPostStatusAction, MyModelPost } from "../types/modelMyPosts";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { AppIcon } from "@/components/ui/AppIcon";
import { useNotification } from "@/hooks/useNotification";

type Props = {
  posts: MyModelPost[];
  loadingPosts: boolean;
  postsError: string;
  pendingPostId: string | null;
  mutationFeedback: {
    kind: "success" | "error";
    message: string;
  } | null;
  confirmAction: {
    postId: string;
    action: ModelPostStatusAction;
  } | null;
  onReload: () => void;
  onEditPost: (postId: string) => void;
  onRequestStatusChange: (postId: string, action: ModelPostStatusAction) => void;
  onCancelStatusChange: () => void;
  onConfirmStatusChange: () => void;
  onCreatePost: () => void;
};

type ResolvedStatus = "ACTIVE" | "PREMIUM" | "PENDING_REVIEW" | "REJECTED" | "INACTIVE";

type CardActionProps = {
  post: MyModelPost;
  status: ResolvedStatus;
  pendingPostId: string | null;
  onEditPost: (postId: string) => void;
  onRequestStatusChange: (postId: string, action: ModelPostStatusAction) => void;
};

const formatDate = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const resolveStatus = (post: MyModelPost): ResolvedStatus => {
  const normalized = post.status?.trim().toUpperCase();
  if (normalized === "PREMIUM") {
    return "PREMIUM";
  }

  if (post.hasPremium && (normalized === "ACTIVE" || normalized === "APPROVED")) {
    return "PREMIUM";
  }

  if (normalized === "ACTIVE" || normalized === "APPROVED") {
    return "ACTIVE";
  }

  if (normalized === "PENDING_REVIEW" || normalized === "PENDING") {
    return "PENDING_REVIEW";
  }

  if (normalized === "REJECTED") {
    return "REJECTED";
  }

  if (normalized === "INACTIVE" || normalized === "SUSPENDED") {
    return "INACTIVE";
  }

  return "INACTIVE";
};

const PremiumBadge = ({ compact = false }: { compact?: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--vp-accent)_38%,white)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--vp-accent)_28%,white),color-mix(in_srgb,var(--vp-accent)_64%,#111827))] text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--vp-accent)_26%,transparent)] backdrop-blur-sm ${compact ? "px-2.5 py-1 text-[10px] tracking-[0.18em]" : "px-3.5 py-1.5 text-[11px] tracking-[0.22em]"}`}
  >
    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/35 bg-white/20">
      <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
        <path
          d="M12 3l2.5 5.2L20 9l-4 3.9.95 5.55L12 15.85l-4.95 2.6L8 12.9 4 9l5.5-.8L12 3z"
          fill="currentColor"
        />
      </svg>
    </span>
    <span className="font-black uppercase">VIP Premium</span>
  </span>
);

const StatusBadge = ({ status }: { status: ResolvedStatus }) => {
  if (status === "PREMIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f3c86d] bg-[linear-gradient(135deg,#5b21b6,#9333ea)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#fff8e1] shadow-[0_10px_22px_rgba(76,29,149,0.28)]">
        <span className="h-2 w-2 rounded-full bg-[#f3c86d]" />
        PREMIUM
      </span>
    );
  }

  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--vp-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--vp-success)_12%,transparent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vp-success)]">
        ACTIVO
      </span>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--vp-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--vp-warning)_12%,transparent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vp-warning)]">
        PENDIENTE
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--vp-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--vp-danger)_12%,transparent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vp-danger)]">
        RECHAZADO
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_86%,transparent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">
      INACTIVO
    </span>
  );
};

const PostMedia = ({ post }: { post: MyModelPost }) => {
  const isPremium = Boolean(post.hasPremium);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [post.coverPhotoUrl]);

  if (post.coverPhotoUrl && !hasImageError) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <img
          src={post.coverPhotoUrl}
          alt={post.title || "Anuncio"}
          onError={() => {
            setHasImageError(true);
          }}
          className={`h-full w-full object-cover transition-all duration-500 ${
            isPremium
              ? "contrast-[1.06] saturate-[1.04] group-hover:scale-[1.03] group-hover:contrast-[1.1]"
              : "group-hover:scale-[1.02]"
          }`}
          loading="lazy"
        />
        {isPremium && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--vp-accent)_11%,transparent)_0%,transparent_35%,color-mix(in_srgb,var(--vp-accent)_12%,transparent)_100%)] opacity-85 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-4 top-0 h-16 rounded-b-[26px] bg-[linear-gradient(180deg,color-mix(in_srgb,white_28%,var(--vp-accent)_12%),transparent)] opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(180deg,var(--vp-card-secondary),var(--vp-card-bg))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--vp-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--vp-accent)_10%,transparent)] p-2 text-[var(--vp-accent)]">
          <AppIcon name="info" className="h-5 w-5" />
        </div>
        <div className="text-right text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--vp-text-secondary)]">Vista previa</div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--vp-text-secondary)]">Virtual Passion</p>
        <p className="text-xl font-black text-[var(--vp-text-primary)]">Tu anuncio</p>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-secondary)] p-3 transition-all duration-300 hover:border-[var(--vp-accent)] hover:shadow-md">
    <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[var(--vp-text-secondary)]">{label}</p>
    <p className="mt-1 text-base font-bold text-[var(--vp-text-primary)]">{value}</p>
  </div>
);

const CardAction = ({ post, status, pendingPostId, onEditPost, onRequestStatusChange }: CardActionProps) => {
  if (status === "REJECTED") {
    return null;
  }

  if (status === "PENDING_REVIEW") {
    return (
      <p className="rounded-2xl border border-[color-mix(in_srgb,var(--vp-warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--vp-warning)_12%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--vp-warning)]">
        Esta publicación está en revisión. No se puede editar por ahora.
      </p>
    );
  }

  if (status === "INACTIVE") {
    const isActivating = pendingPostId === post.id;

    return (
      <button
        type="button"
        onClick={() => onRequestStatusChange(post.id, "activate")}
        disabled={isActivating}
        className="vp-button-primary rounded-2xl px-4 py-3 text-sm font-black transition duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isActivating ? "Activando..." : "Activar anuncio"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onEditPost(post.id)}
      className="vp-button-primary rounded-2xl px-4 py-3 text-sm font-black transition duration-200 hover:opacity-95"
    >
      Gestionar anuncio
    </button>
  );
};

export const ModelMyPostsSection = ({ posts, loadingPosts, postsError, pendingPostId, mutationFeedback, confirmAction, onReload, onEditPost, onRequestStatusChange, onCancelStatusChange, onConfirmStatusChange, onCreatePost }: Props) => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const [openWarningPostId, setOpenWarningPostId] = useState<string | null>(null);

  useEffect(() => { if (postsError) notifyError({ title: "No pudimos cargar tus anuncios", description: postsError }); }, [notifyError, postsError]);
  useEffect(() => {
    if (!mutationFeedback) return;
    if (mutationFeedback.kind === "success") {
      notifySuccess({ title: "Anuncio actualizado", description: mutationFeedback.message });
      return;
    }
    notifyError({ title: "No pudimos actualizar el anuncio", description: mutationFeedback.message });
  }, [mutationFeedback, notifyError, notifySuccess]);

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[var(--vp-border)] bg-[linear-gradient(180deg,var(--vp-card-bg),var(--vp-card-secondary))] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.08)] md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--vp-accent)_10%,transparent),transparent_38%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--vp-success)_8%,transparent),transparent_42%)]" />
      <div className="relative flex flex-col gap-4 rounded-[28px] border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_88%,transparent)] p-4 md:flex-row md:items-end md:justify-between md:p-5">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-bg)_70%,transparent)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--vp-text-secondary)]">Mis anuncios</div>
          <h2 className="text-3xl font-black text-[var(--vp-text-primary)] md:text-4xl">Mis anuncios</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onReload} disabled={loadingPosts} className="vp-button-primary rounded-2xl px-5 py-3 text-sm font-bold">Actualizar</button>
          <button type="button" onClick={onCreatePost} className="vp-button-primary rounded-2xl px-5 py-3 text-sm font-black">Crear nuevo anuncio</button>
        </div>
      </div>

      {loadingPosts && (
        <div className="relative mt-6">
          <SkeletonLoader rows={3} className="rounded-[24px]" />
        </div>
      )}

      {!loadingPosts && !postsError && posts.length > 0 && (
        <div className="relative mt-6 flex flex-col gap-5">
          {posts.map((post) => {
            const status = resolveStatus(post);
            const services = (post.services || []).filter(Boolean);
            const showWarning = status === "REJECTED" || status === "INACTIVE";
            const warningMessage =
              status === "REJECTED"
                ? post.rejectionReason || "Tu publicación fue rechazada y debes revisar su contenido antes de reenviarla."
                : "Esta publicación está inactiva y no es visible para los usuarios.";

            const isPremium = status === "PREMIUM";
            return (
              <article
                key={post.id}
                className={`group relative flex flex-col overflow-hidden rounded-[30px] transition-all duration-500 lg:flex-row ${
                  isPremium
                    ? "border border-[color-mix(in_srgb,var(--vp-accent)_34%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-card-bg)_94%,var(--vp-accent)_6%)] shadow-[0_20px_52px_rgba(2,6,23,0.13)] hover:-translate-y-1 hover:shadow-[0_28px_66px_rgba(2,6,23,0.2)]"
                    : "border border-[var(--vp-border)] bg-[var(--vp-card-bg)] shadow-lg hover:-translate-y-1 hover:shadow-2xl"
                }`}
              >
                {isPremium && (
                  <>
                    <div className="pointer-events-none absolute -inset-[2px] rounded-[32px] border border-[color-mix(in_srgb,var(--vp-accent)_26%,transparent)] opacity-75" />
                    <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_18%_16%,color-mix(in_srgb,var(--vp-accent)_16%,transparent),transparent_56%)] opacity-80 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,color-mix(in_srgb,var(--vp-accent)_7%,transparent)_0%,transparent_45%,color-mix(in_srgb,var(--vp-accent)_9%,transparent)_100%)] opacity-90" />
                  </>
                )}
                <div className="absolute left-4 top-4 z-20">
                  <StatusBadge status={status} />
                </div>
                <div className="relative h-56 w-full md:w-[25%] md:min-w-[220px]"><PostMedia post={post} /></div>
                <div className="relative flex flex-1 flex-col justify-between gap-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-black text-[var(--vp-text-primary)]">{post.title || "Sin título"}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--vp-text-secondary)]">
                        {post.description || "Sin descripción"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPremium ? <PremiumBadge compact /> : null}
                      {showWarning && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenWarningPostId((current) => (current === post.id ? null : post.id));
                            }}
                            className="rounded-full border border-[color-mix(in_srgb,var(--vp-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--vp-warning)_12%,transparent)] p-2 text-[var(--vp-warning)]"
                            aria-label="Ver advertencia"
                          >
                            <AppIcon name="warning" className="h-4 w-4" />
                          </button>
                          {openWarningPostId === post.id && (
                            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-3 text-xs text-[var(--vp-text-primary)] shadow-2xl">
                              <p className="font-black uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">Aviso</p>
                              <p className="mt-1 leading-5">{warningMessage}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    <InfoRow label="Categoría" value={post.categoryName || post.catalogName || "Sin categoría"} />
                    <InfoRow label="Precio" value={post.price?.amount ? `${post.price.amount} ${post.price.currency || ""}`.trim() : "No definido"} />
                    <InfoRow label="Creado" value={formatDate(post.createdAt) || "N/A"} />
                    <InfoRow label="Clicks" value={post.clickCount?.toString() || "0"} />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] font-black text-[var(--vp-text-secondary)]">Servicios incluidos</p>
                    <div className="flex flex-wrap gap-2">
                      {services.slice(0, 3).map((s) => (
                        <span key={s} className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-accent)_8%,transparent)] text-[var(--vp-text-primary)] transition-all duration-300 hover:border-[var(--vp-accent)] hover:scale-105">
                          {s}
                        </span>
                      ))}
                      {services.length > 3 && (
                        <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold border border-dashed border-[var(--vp-border)] bg-[var(--vp-card-secondary)] text-[var(--vp-text-secondary)]">
                          +{services.length - 3}
                        </span>
                      )}
                      {services.length === 0 && (
                        <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold border border-dashed border-[var(--vp-border)] bg-[var(--vp-card-secondary)] text-[var(--vp-text-secondary)]">
                          Sin servicios
                        </span>
                      )}
                    </div>
                  </div>
                  {status === "REJECTED" && (
                    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--vp-danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--vp-danger)_8%,transparent)] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vp-danger)]">Motivo del rechazo</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--vp-text-primary)]">
                        {post.rejectionReason || "No se recibió un motivo específico desde la API."}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <CardAction post={post} status={status} pendingPostId={pendingPostId} onEditPost={onEditPost} onRequestStatusChange={onRequestStatusChange} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!loadingPosts && !postsError && posts.length === 0 && (
        <div className="relative mt-6 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-6 text-center">
          <p className="text-base font-semibold text-[var(--vp-text-secondary)]">Aún no tienes publicaciones.</p>
        </div>
      )}
      {confirmAction && <ConfirmationDialog open title={confirmAction.action === "activate" ? "¿Deseas activar?" : "¿Deseas ocultar?"} onCancel={onCancelStatusChange} onConfirm={onConfirmStatusChange} />}
    </section>
  );
};