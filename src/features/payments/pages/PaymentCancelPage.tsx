import { Link } from "react-router-dom";

import { getCheckoutContextCookie } from "@/features/payments/services/checkoutContext";

const VIP_CHECKOUT_AREA_ID_KEY = "AreaId";
const POSITIONING_CHECKOUT_TYPE = "positioning";

export const PaymentCancelPage = () => {
  const checkoutAreaId = getCheckoutContextCookie(VIP_CHECKOUT_AREA_ID_KEY);
  const vipReturnPath = checkoutAreaId ? `/vip/${checkoutAreaId}` : "/vip";
  const isPositioningPurchase = getCheckoutContextCookie("Type") === POSITIONING_CHECKOUT_TYPE;
  const positioningPostId = getCheckoutContextCookie("PostId");
  const positioningPlanName = getCheckoutContextCookie("PlanName") || "plan de posicionamiento";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-6 py-10 md:px-10">
      <section className="w-full rounded-[2rem] border-2 border-amber-700/50 bg-white p-7 shadow-sm dark:border-amber-300/35 dark:bg-slate-950 md:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">Pago cancelado</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{isPositioningPurchase ? "No se completo la compra" : "No se completo la suscripcion"}</h1>
        <p className="mt-3 text-base text-slate-700 dark:text-white/80">{isPositioningPurchase ? `No se completo la compra del ${positioningPlanName}.` : "No se completo el proceso de suscripcion al Area VIP."}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/70">Puedes intentarlo nuevamente cuando quieras.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={isPositioningPurchase && positioningPostId ? `/ads?postId=${positioningPostId}` : vipReturnPath}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-white/85"
          >
            {isPositioningPurchase ? "Volver al anuncio" : "Volver al Area VIP"}
          </Link>
          <Link
            to="/feed"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
          >
            Ir a explorar
          </Link>
        </div>
      </section>
    </main>
  );
};
