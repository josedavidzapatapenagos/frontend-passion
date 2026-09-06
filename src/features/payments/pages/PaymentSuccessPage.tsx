import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getVipAreaInfo } from "@/features/vip-area";
import type { VipAreaInfo } from "@/features/vip-area";
import { getCheckoutContextCookie } from "@/features/payments/services/checkoutContext";

const VIP_CHECKOUT_AREA_ID_KEY = "AreaId";
const VIP_CHECKOUT_REFERENCE_KEY = "Reference";
const POSITIONING_CHECKOUT_TYPE = "positioning";

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference")?.trim() || null;
  const checkoutAreaId = getCheckoutContextCookie(VIP_CHECKOUT_AREA_ID_KEY);
  const checkoutReference = getCheckoutContextCookie(VIP_CHECKOUT_REFERENCE_KEY);
  const isPositioningPurchase = getCheckoutContextCookie("Type") === POSITIONING_CHECKOUT_TYPE;
  const positioningPostId = getCheckoutContextCookie("PostId");
  const positioningPostTitle = getCheckoutContextCookie("PostTitle") || "Tu anuncio";
  const positioningPlanName = getCheckoutContextCookie("PlanName") || "Plan de posicionamiento";
  const positioningDuration = getCheckoutContextCookie("PlanDuration");
  const positioningDailyLimit = getCheckoutContextCookie("PlanDailyLimit");
  const positioningPrice = getCheckoutContextCookie("PlanPrice");
  const [vipAreaInfo, setVipAreaInfo] = useState<VipAreaInfo | null>(null);
  const [loadingVipArea, setLoadingVipArea] = useState(false);
  const [vipAreaError, setVipAreaError] = useState<string | null>(null);

  const shouldUseStoredArea = !reference || !checkoutReference || checkoutReference === reference;
  const vipReturnPath = checkoutAreaId && shouldUseStoredArea ? `/vip/${checkoutAreaId}` : "/vip";

  useEffect(() => {
    if (isPositioningPurchase || !checkoutAreaId || !shouldUseStoredArea) {
      setVipAreaInfo(null);
      setVipAreaError(null);
      setLoadingVipArea(false);
      return;
    }

    let isActive = true;

    setLoadingVipArea(true);
    setVipAreaError(null);

    void getVipAreaInfo(checkoutAreaId)
      .then((info) => {
        if (isActive) {
          setVipAreaInfo(info);
        }
      })
      .catch(() => {
        if (isActive) {
          setVipAreaInfo(null);
          setVipAreaError("No pudimos recuperar los detalles de tu Area VIP, pero tu pago fue confirmado.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoadingVipArea(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [checkoutAreaId, isPositioningPurchase, shouldUseStoredArea]);

  const formatMonthlyPrice = (info: VipAreaInfo) => {
    const currency = info.monthlyPrice.currency || "USD";

    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(info.monthlyPrice.amount);
  };

  return (
    <main className="vp-page-bg relative mx-auto flex min-h-[78vh] w-full max-w-4xl items-center px-5 py-8 md:px-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,#FD008360_0%,#FD008300_70%)]" />
        <div className="absolute -right-10 bottom-8 h-64 w-64 rounded-full bg-[radial-gradient(circle,#00BCD450_0%,#00BCD400_72%)]" />
      </div>

      <section className="vp-surface relative w-full overflow-hidden rounded-[2.2rem] border vp-border p-7 shadow-[0_24px_60px_rgba(1,13,17,0.14)] md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--vp-accent)_11%,transparent)_0%,transparent_46%,color-mix(in_srgb,var(--vp-success)_10%,transparent)_100%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-b-[30px] bg-[linear-gradient(180deg,color-mix(in_srgb,white_34%,var(--vp-accent)_16%),transparent)]" />

        <div className="relative">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--vp-text-secondary)]">Virtual Passion</p>
          <h1 className="mt-2 text-center text-4xl font-black italic tracking-tight text-[#FD0083] md:text-5xl">Pago Exitoso</h1>
          <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.28em] text-[#00BCD4]">{isPositioningPurchase ? "Posicionamiento confirmado" : "Suscripcion VIP confirmada"}</p>

          <div className="mx-auto mt-7 max-w-2xl rounded-3xl border border-[color-mix(in_srgb,var(--vp-success)_28%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-success)_11%,var(--vp-surface))] px-5 py-4">
            <p className="text-center text-base text-[var(--vp-text-primary)]">{isPositioningPurchase ? "Tu plan de posicionamiento fue activado correctamente." : "Tu suscripcion al Area VIP se proceso correctamente."}</p>
          </div>

          {isPositioningPurchase ? (
            <div className="mx-auto mt-5 max-w-2xl rounded-3xl border border-[color-mix(in_srgb,var(--vp-accent)_24%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-accent)_8%,var(--vp-surface))] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--vp-text-secondary)]">Detalle del posicionamiento</p>
              <p className="mt-2 text-lg font-black text-[var(--vp-text-primary)]">{positioningPlanName}</p>
              <p className="mt-1 text-sm text-[var(--vp-text-secondary)]">Aplicado a: {positioningPostTitle}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_92%,transparent)] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Duracion</p><p className="mt-1 text-base font-black text-[var(--vp-text-primary)]">{positioningDuration ? `${positioningDuration} dias` : "Confirmada"}</p></div>
                <div className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_92%,transparent)] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Posiciones diarias</p><p className="mt-1 text-base font-black text-[var(--vp-text-primary)]">{positioningDailyLimit || "-"}</p></div>
                <div className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_92%,transparent)] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Importe</p><p className="mt-1 text-base font-black text-[var(--vp-text-primary)]">{positioningPrice || "Confirmado"}</p></div>
              </div>
            </div>
          ) : null}

          {!isPositioningPurchase && (loadingVipArea || vipAreaInfo || vipAreaError) && (
            <div className="mx-auto mt-5 max-w-2xl rounded-3xl border border-[color-mix(in_srgb,var(--vp-accent)_24%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-accent)_8%,var(--vp-surface))] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--vp-text-secondary)]">Detalle de la suscripcion</p>

              {loadingVipArea ? (
                <p className="mt-2 text-sm text-[var(--vp-text-secondary)]">Estamos recuperando el Area VIP asociada a este pago.</p>
              ) : vipAreaInfo ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-lg font-black text-[var(--vp-text-primary)]">{vipAreaInfo.alias}</p>
                    <p className="mt-1 text-sm text-[var(--vp-text-secondary)]">{vipAreaInfo.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_92%,transparent)] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Precio mensual</p>
                      <p className="mt-1 text-base font-black text-[var(--vp-text-primary)]">{formatMonthlyPrice(vipAreaInfo)}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_92%,transparent)] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Fotos</p>
                      <p className="mt-1 text-base font-black text-[var(--vp-text-primary)]">{vipAreaInfo.photoCount}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_92%,transparent)] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--vp-text-secondary)]">Videos</p>
                      <p className="mt-1 text-base font-black text-[var(--vp-text-primary)]">{vipAreaInfo.videoCount}</p>
                    </div>
                  </div>

                  {vipAreaInfo.unlockableCount > 0 && (
                    <p className="text-sm text-[var(--vp-text-secondary)]">
                      Incluye {vipAreaInfo.unlockableCount} contenido(s) desbloqueable(s).
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[var(--vp-text-secondary)]">{vipAreaError}</p>
              )}
            </div>
          )}

          {reference ? (
            <div className="mx-auto mt-5 max-w-2xl rounded-3xl border border-[color-mix(in_srgb,var(--vp-accent)_28%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-accent)_9%,var(--vp-surface))] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--vp-text-secondary)]">Referencia de pago</p>
              <p className="mt-1 break-all text-lg font-black text-[var(--vp-text-primary)]">{reference}</p>
            </div>
          ) : (
            <p className="mx-auto mt-5 max-w-2xl rounded-3xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_88%,transparent)] px-5 py-4 text-sm text-[var(--vp-text-secondary)]">
              Tu suscripcion fue procesada correctamente.
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={isPositioningPurchase && positioningPostId ? `/ads?postId=${positioningPostId}` : vipReturnPath}
              className="inline-flex items-center justify-center rounded-2xl bg-[#FD0083] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:brightness-110"
            >
              {isPositioningPurchase ? "Volver al anuncio" : "Ir al Area VIP"}
            </Link>
            <Link
              to="/feed"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_88%,transparent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--vp-text-primary)] transition hover:border-[#00BCD4] hover:text-[#00BCD4]"
            >
              Ir a explorar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
