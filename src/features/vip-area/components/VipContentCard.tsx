import type { VipAreaContent } from "@/features/vip-area/types/vipArea";

type Props = {
  content: VipAreaContent;
  alias?: string;
  deletionRequestReason?: string;
  deletionRequestExpanded?: boolean;
  deletionRequestLoading?: boolean;
  deletionRequestSubmitted?: boolean;
  onDeletionRequestReasonChange?: (contentId: string, reason: string) => void;
  onOpenDeletionRequest?: (contentId: string) => void;
  onCancelDeletionRequest?: (contentId: string) => void;
  onRequestDeletion?: (content: VipAreaContent, reason: string) => void;
};

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value: string) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

export const VipContentCard = ({
  content,
  alias,
  deletionRequestReason = "",
  deletionRequestExpanded = false,
  deletionRequestLoading = false,
  deletionRequestSubmitted = false,
  onDeletionRequestReasonChange,
  onOpenDeletionRequest,
  onCancelDeletionRequest,
  onRequestDeletion,
}: Props) => {
  const isUnlockable = content.accessType === "UNLOCKABLE";
  const isUnlocked = content.unlocked;
  const shouldHideMedia = isUnlockable && !isUnlocked;
  const normalizedDeletionReason = deletionRequestReason.trim();

  return (
    <article className="vp-vip-card rounded-[1.7rem] border p-4 shadow-[0_12px_35px_rgba(0,0,0,0.22)]">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0d1a3a]">
            Foto
          </span>
          <p className="vp-text-primary text-sm font-semibold">{alias || "Area VIP"}</p>
        </div>
        <p className="vp-vip-muted text-[11px]">{formatDate(content.createdAt)}</p>
      </header>

      <p className="vp-vip-card-strong vp-text-primary mb-3 rounded-xl border px-3 py-2 text-sm">
        {content.description || "Sin descripcion"}
      </p>

      <div className="vp-vip-card-strong relative overflow-hidden rounded-[1.5rem] border">
        {shouldHideMedia ? (
          <div className="vp-vip-card flex h-72 w-full items-center justify-center">
            <svg viewBox="0 0 24 24" className="vp-text-primary h-20 w-20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              <circle cx="12" cy="16" r="1.5" />
            </svg>
          </div>
        ) : content.mediaType === "VIDEO" ? (
          <video
            src={content.contentUrl}
            controls
            className="h-72 w-full object-cover"
          >
            Tu navegador no soporta video.
          </video>
        ) : (
          <img
            src={content.contentUrl}
            alt={content.description || "Contenido VIP"}
            className="h-72 w-full object-cover"
          />
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            isUnlockable
              ? "bg-amber-500 text-slate-900"
              : "bg-[#00BCD4] text-white"
          }`}
        >
          {isUnlockable ? "Unlockable" : "Normal"}
        </span>

        {shouldHideMedia && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Bloqueado
          </span>
        )}
      </div>

      <div className="space-y-2 pt-3">
        <div className="vp-vip-muted flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span>{content.mediaType}</span>
          <span>•</span>
          <span>{content.accessType}</span>
        </div>

        {isUnlockable && content.unlockPrice && (
          <p className="text-sm font-bold text-amber-300">
            Precio de desbloqueo: {formatMoney(content.unlockPrice.amount, content.unlockPrice.currency)}
          </p>
        )}

        {isUnlockable && !content.unlockPrice && (
          <p className="text-sm font-bold text-amber-300">
            Contenido desbloqueable
          </p>
        )}

        {isUnlockable && isUnlocked && (
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Desbloqueado
          </p>
        )}

        {onRequestDeletion && (
          <div className="vp-vip-card-strong mt-3 rounded-2xl border p-3">
            {deletionRequestSubmitted ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="vp-text-primary text-sm font-black">Solicitud enviada</p>
                  <p className="vp-vip-muted mt-1 text-xs">
                    Ya existe una solicitud pendiente para eliminar esta publicacion.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-500/70 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Solicitud enviada
                </button>
              </div>
            ) : !deletionRequestExpanded ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="vp-text-primary text-sm font-black">Gestion de publicacion</p>
                  <p className="vp-vip-muted mt-1 text-xs">
                    Puedes solicitar que esta publicacion sea retirada de tu Area VIP.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenDeletionRequest?.(content.id)}
                  disabled={deletionRequestLoading}
                  className="rounded-full border border-red-500/45 bg-red-500/12 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Eliminar publicacion
                </button>
              </div>
            ) : (
            <div className="space-y-3">
              <div>
                <p className="vp-text-primary text-sm font-black">Solicitud de eliminacion</p>
                <p className="vp-vip-muted mt-1 text-xs">
                  Indica el motivo para pedir que esta publicacion sea retirada de tu Area VIP.
                </p>
              </div>
              <textarea
                value={deletionRequestReason}
                onChange={(event) => onDeletionRequestReasonChange?.(content.id, event.target.value)}
                disabled={deletionRequestLoading}
                rows={3}
                maxLength={1000}
                placeholder="Escribe la razon de la solicitud"
                className="vp-input w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none focus:border-[#FD0083] disabled:opacity-60"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="vp-vip-muted text-[11px]">{normalizedDeletionReason.length}/1000 caracteres</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCancelDeletionRequest?.(content.id)}
                    disabled={deletionRequestLoading}
                    className="rounded-full border border-slate-400/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDeletion(content, normalizedDeletionReason)}
                    disabled={deletionRequestLoading || !normalizedDeletionReason}
                    className="rounded-full border border-red-500/45 bg-red-500/12 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletionRequestLoading ? "Solicitando..." : "Solicitar borrado"}
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
