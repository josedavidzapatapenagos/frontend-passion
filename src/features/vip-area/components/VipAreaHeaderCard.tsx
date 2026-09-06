import type { VipAreaInfo } from "@/features/vip-area/types/vipArea";

type Props = {
  info: VipAreaInfo;
  onSubscribe?: () => void;
  subscribeLoading?: boolean;
  subscribeDisabled?: boolean;
};

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const VipAreaHeaderCard = ({ info, onSubscribe, subscribeLoading = false, subscribeDisabled = false }: Props) => {
  return (
    <section className="vp-vip-panel relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#FD0083]/16 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-[#00BCD4]/12 blur-3xl" />

      <div className="relative">
      <div className="flex gap-4">
        <div className="vp-vip-card-strong h-28 w-28 shrink-0 overflow-hidden rounded-[1.35rem] border-2 border-[#FD0083]/65">
          {info.coverPhotoUrl ? (
            <img
              src={info.coverPhotoUrl}
              alt={`Portada de ${info.alias}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="vp-vip-muted flex h-full items-center justify-center text-sm font-semibold">
              foto
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <p className="vp-text-primary truncate text-lg font-black">{info.alias}</p>
          <p className="vp-vip-muted line-clamp-2 text-sm">{info.description || "Sin descripcion"}</p>

          <div className="vp-text-primary flex flex-wrap items-center gap-4 pt-1.5 text-xl font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8" cy="10" r="1.5" />
                <path d="m21 16-5-5-6 6-3-3-4 4" />
              </svg>
              {info.photoCount}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m10 9 5 3-5 3V9Z" />
              </svg>
              {info.videoCount}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {info.unlockableCount}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-9 space-y-5">
        <div>
          <p className="text-4xl font-black leading-none text-[#ff4bb0]">Suscribete</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#84ecff]">beneficios</p>
        </div>

        <ul className="vp-text-primary space-y-2 text-sm font-medium">
          <li className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-[#ff4bb0]" />
            Contenido exclusivo mensual
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-[#ff4bb0]" />
            Material desbloqueable premium
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-[#ff4bb0]" />
            Interaccion VIP prioritaria
          </li>
        </ul>

        <p className="pt-1 text-4xl font-black text-[#84ecff]">
          {formatMoney(info.monthlyPrice.amount, info.monthlyPrice.currency)}
          <span className="ml-2 text-3xl">/ MES</span>
        </p>

        <button
          type="button"
          onClick={onSubscribe}
          disabled={subscribeDisabled || subscribeLoading}
          className="w-full rounded-2xl border border-[#00BCD4]/45 bg-gradient-to-r from-[#00BCD4] to-[#00e1ff] px-4 py-3 text-lg font-black text-[#022036] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {subscribeLoading ? "Procesando suscripcion..." : "Suscribirse"}
        </button>
      </div>
      </div>
    </section>
  );
};
