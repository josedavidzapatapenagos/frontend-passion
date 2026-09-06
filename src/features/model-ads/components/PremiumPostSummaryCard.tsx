import type { PremiumPostSummary } from "@/features/model-ads/services/modelPremiumService";

type Props = {
  summary: PremiumPostSummary | null;
  isLoading: boolean;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
    <path d="M12 3L14.4 8.6L20 11L14.4 13.4L12 19L9.6 13.4L4 11L9.6 8.6L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const DotIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="12" />
  </svg>
);

export const PremiumPostSummaryCard = ({ summary, isLoading }: Props) => {
  const isOnline = Boolean(summary?.postIsOnline);
  const totalVideos = summary?.premiumVideos.length ?? 0;
  const hasState = Boolean(summary?.premiumState);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--vp-accent)_45%,var(--vp-border))] bg-[linear-gradient(130deg,color-mix(in_srgb,var(--vp-accent)_16%,var(--vp-card-bg))_0%,var(--vp-card-bg)_48%,color-mix(in_srgb,var(--vp-accent)_8%,var(--vp-card-secondary))_100%)] p-5 shadow-[0_14px_40px_color-mix(in_srgb,var(--vp-accent)_20%,transparent)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--vp-accent)_28%,transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-4 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--vp-accent)_18%,transparent)] blur-2xl" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Premium Summary</p>
          <h4 className="mt-1 text-xl font-black text-[var(--vp-text-primary)]">Resumen del anuncio premium</h4>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--vp-accent)_42%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-card-bg)_72%,transparent)] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--vp-text-primary)]">
          <SparkIcon />
          Estado en vivo
        </span>
      </div>

      {isLoading ? (
        <div className="relative z-10 mt-4 rounded-2xl border border-dashed border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_84%,transparent)] p-4 text-sm text-[var(--vp-text-secondary)]">
          Cargando resumen premium...
        </div>
      ) : (
        <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-bg)_90%,transparent)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">Conectividad</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-black text-[var(--vp-text-primary)]">
              <span className={isOnline ? "text-emerald-500" : "text-rose-500"}>
                <DotIcon />
              </span>
              {isOnline ? "En linea" : "Fuera de linea"}
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-bg)_90%,transparent)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">Contenido</p>
            <p className="mt-2 text-sm font-black text-[var(--vp-text-primary)]">{totalVideos} videos premium</p>
            <p className="mt-1 text-xs text-[var(--vp-text-secondary)]">Estado premium: {hasState ? "Activo" : "Sin estado"}</p>
          </article>

          <article className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-bg)_90%,transparent)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">Vigencia</p>
            <p className="mt-2 text-xs text-[var(--vp-text-secondary)]">Inicio: {formatDate(summary?.premiumStart ?? null)}</p>
            <p className="mt-1 text-xs text-[var(--vp-text-secondary)]">Fin: {formatDate(summary?.premiumEndAt ?? null)}</p>
          </article>
        </div>
      )}
    </section>
  );
};
