import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotification } from "@/hooks/useNotification";
import { setCheckoutContextCookie } from "@/features/payments/services/checkoutContext";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import {
  getActivePositioningPlans,
  type PositioningPlan,
} from "@/features/admin/services/positioningPlansService";
import {
  createPositioningPlanPurchaseAttempt,
  type PositioningPlanPurchaseAttempt,
} from "@/features/model-ads/services/positioningPlanPurchaseService";
import {
  getPostActivePositioningPlan,
  type PositioningActivePlan,
} from "@/features/model-ads/services/positioningRequestService";
import { ActivePositioningPanel } from "./ActivePositioningPanel";

const formatAmount = (price: number) => new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(price);

const formatPrice = (price: number, currency: string) => `${formatAmount(price)} ${currency}`;

type Props = {
  postId: string | null;
  postTitle: string | null;
};

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden="true">
    <path d="M13.6 3.6c2.9-1.2 5.6-1 6.4-.2.8.8 1 3.5-.2 6.4-1 2.4-2.7 4.4-4.6 5.8l-.5 3.3a1 1 0 0 1-.5.7l-2.6 1.5a.6.6 0 0 1-.9-.6l.3-3.4-3.6-3.6-3.4.3a.6.6 0 0 1-.6-.9l1.5-2.6a1 1 0 0 1 .7-.5l3.3-.5c1.4-1.9 3.3-3.6 5.7-4.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="14.8" cy="9.2" r="1.9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7.5 16.5c-1 1-1.3 3-1.4 4 1-.1 3-.4 4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PositioningPlansSection = ({ postId, postTitle }: Props) => {
  const { error, success } = useNotification();
  const [plans, setPlans] = useState<PositioningPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<PositioningActivePlan | null>(null);
  const [isLoadingActivePlan, setIsLoadingActivePlan] = useState(Boolean(postId));
  const [activePlanError, setActivePlanError] = useState<string | null>(null);
  const [activePlanToken, setActivePlanToken] = useState(0);
  const purchaseAttempts = useRef(new Map<string, PositioningPlanPurchaseAttempt>());

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        setPlans(await getActivePositioningPlans());
      } catch (error: unknown) {
        setLoadError(getUserFacingErrorMessage(error, {
          defaultMessage: "No fue posible cargar los planes activos. Inténtalo de nuevo más tarde.",
        }));
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlans();
  }, []);

  useEffect(() => {
    if (!postId) {
      setActivePlan(null);
      setActivePlanError(null);
      setIsLoadingActivePlan(false);
      return;
    }

    let isActive = true;
    setIsLoadingActivePlan(true);
    setActivePlanError(null);

    void getPostActivePositioningPlan(postId)
      .then((plan) => { if (isActive) setActivePlan(plan); })
      .catch((activePlanLoadError: unknown) => {
        if (isActive) {
          setActivePlan(null);
          setActivePlanError(getUserFacingErrorMessage(activePlanLoadError, {
            defaultMessage: "No fue posible consultar el plan de posicionamiento activo.",
          }));
        }
      })
      .finally(() => { if (isActive) setIsLoadingActivePlan(false); });

    return () => { isActive = false; };
  }, [activePlanToken, postId]);

  const popularPlanId = plans.reduce<string | null>(
    (currentId, plan) => !currentId || plan.price > (plans.find(({ id }) => id === currentId)?.price ?? 0) ? plan.id : currentId,
    null,
  );

  const handlePurchase = async (plan: PositioningPlan) => {
    if (!postId || purchasingPlanId) {
      return;
    }

    setPurchasingPlanId(plan.id);

    try {
      const attemptKey = `${postId}:${plan.id}`;
      const purchaseAttempt = purchaseAttempts.current.get(attemptKey)
        ?? createPositioningPlanPurchaseAttempt(postId, plan.id);

      purchaseAttempts.current.set(attemptKey, purchaseAttempt);
      const checkoutUrl = await purchaseAttempt.execute();

      if (checkoutUrl) {
        setCheckoutContextCookie("Type", "positioning");
        setCheckoutContextCookie("PostId", postId);
        setCheckoutContextCookie("PostTitle", postTitle || "Tu anuncio");
        setCheckoutContextCookie("PlanName", plan.name);
        setCheckoutContextCookie("PlanDuration", String(plan.durationDays));
        setCheckoutContextCookie("PlanDailyLimit", String(plan.dailyLimit));
        setCheckoutContextCookie("PlanPrice", formatPrice(plan.price, plan.currency));
        window.location.assign(checkoutUrl);
        return;
      }

      purchaseAttempts.current.delete(attemptKey);
      success({ title: "Compra iniciada", description: "Tu solicitud de posicionamiento fue creada correctamente." });
    } catch (purchaseError: unknown) {
      error({
        title: "No se pudo iniciar la compra",
        description: getUserFacingErrorMessage(purchaseError, {
          defaultMessage: "No fue posible iniciar la compra del plan. Inténtalo nuevamente.",
          forbiddenMessage: "No tienes permisos para comprar un plan para este anuncio.",
          notFoundMessage: "No encontramos el anuncio o el plan seleccionado.",
        }),
      });
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-5 md:p-7">
      <h3 className="text-lg font-black text-[var(--vp-text-primary)]">Posicionamiento</h3>
      <div className="mx-auto mt-5 max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)] text-[var(--vp-accent)]">
          <RocketIcon />
        </div>
        <h4 className="mt-4 text-base font-black text-[var(--vp-text-primary)]">Aumenta la visibilidad de tu anuncio</h4>
        <p className="mt-1 text-sm text-[var(--vp-text-secondary)]">Aparece en las primeras posiciones del catálogo y llega a más clientes.</p>
      </div>

      {isLoadingActivePlan ? <p className="mt-6 text-sm text-[var(--vp-text-secondary)]">Consultando tu plan de posicionamiento...</p> : null}
      {activePlanError ? <p role="alert" className="mt-6 text-sm font-semibold text-rose-600">{activePlanError}</p> : null}

      {!isLoadingActivePlan && postId && activePlan ? (
        <ActivePositioningPanel
          postId={postId}
          plan={activePlan}
          onPlanRefresh={() => setActivePlanToken((token) => token + 1)}
        />
      ) : null}

      {!isLoadingActivePlan && !activePlan ? (
        <>
      <h4 className="mt-7 text-sm font-black text-[var(--vp-text-primary)]">Planes disponibles</h4>
      {isLoading ? <p className="mt-4 text-sm text-[var(--vp-text-secondary)]">Cargando planes...</p> : null}
      {loadError ? <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">{loadError}</p> : null}
      {!isLoading && !loadError && plans.length === 0 ? <div className="mt-4"><EmptyState title="No hay planes disponibles" description="Vuelve a consultar más tarde para conocer las opciones de posicionamiento." /></div> : null}
      {!isLoading && !loadError && plans.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const isPopular = plan.id === popularPlanId;

            return (
              <article key={plan.id} className={`relative flex min-h-60 flex-col rounded-xl border p-4 ${isPopular ? "border-[var(--vp-accent)] bg-[color-mix(in_srgb,var(--vp-accent)_5%,var(--vp-card-bg))] ring-1 ring-[var(--vp-accent)]" : "border-[var(--vp-border)]"}`}>
                {isPopular ? <span className="absolute right-3 top-3 rounded-full bg-[var(--vp-accent)] px-2.5 py-1 text-[10px] font-black text-white">Más popular</span> : null}
                <h5 className="pr-24 text-base font-black text-[var(--vp-text-primary)]">{plan.name}</h5>
                <p className="mt-1 text-sm font-bold text-[var(--vp-text-secondary)]">{plan.durationDays} {plan.durationDays === 1 ? "día" : "días"}</p>
                <p className="mt-4 text-sm text-[var(--vp-text-secondary)]">{plan.dailyLimit} {plan.dailyLimit === 1 ? "posición" : "posiciones"} por día</p>
                {plan.description ? <p className="mt-2 text-sm text-[var(--vp-text-secondary)]">{plan.description}</p> : null}
                <p className="mt-auto pt-5 text-xl font-black text-[var(--vp-text-primary)]">{formatAmount(plan.price)} <span className="text-xs font-bold text-[var(--vp-text-secondary)]">{plan.currency}</span></p>
                <button type="button" disabled={!postId || Boolean(purchasingPlanId)} onClick={() => void handlePurchase(plan)} title={!postId ? "Selecciona un anuncio para comprar un plan." : undefined} className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-70 ${isPopular ? "bg-[var(--vp-accent)] text-white" : "border border-[var(--vp-accent)] text-[var(--vp-accent)]"}`}>{purchasingPlanId === plan.id ? "Iniciando compra..." : "Comprar plan"}</button>
              </article>
            );
          })}
        </div>
      ) : null}
        </>
      ) : null}
    </section>
  );
};