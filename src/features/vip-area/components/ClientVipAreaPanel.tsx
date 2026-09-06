import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { InfoCard } from "@/components/common/InfoCard";
import { VipAreaHeaderCard } from "@/features/vip-area/components/VipAreaHeaderCard";
import { VipAreaSummaryBar } from "@/features/vip-area/components/VipAreaSummaryBar";
import { VipContentCard } from "@/features/vip-area/components/VipContentCard";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { setCheckoutContextCookie } from "@/features/payments/services/checkoutContext";
import { useVipArea } from "@/features/vip-area/hooks/useVipArea";
import { createVipSubscriptionCheckout } from "@/features/vip-area/services/vipAreaService";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

const VIP_CHECKOUT_AREA_ID_KEY = "AreaId";
const VIP_CHECKOUT_REFERENCE_KEY = "Reference";

type Props = {
  vipAreaId: string;
};

export const ClientVipAreaPanel = ({ vipAreaId }: Props) => {
  const { info, contents, loading, error, load, reload } = useVipArea();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    if (!vipAreaId) {
      return;
    }

    void load(vipAreaId);
  }, [load, vipAreaId]);

  const isUnsubscribed = error?.code === "FORBIDDEN" || error?.code === "NOT_FOUND";

  const shouldShowSubscribedView = useMemo(() => {
    if (!info) {
      return false;
    }

    return !isUnsubscribed;
  }, [info, isUnsubscribed]);

  const handleSubscribe = useCallback(async () => {
    if (!vipAreaId || isSubscribing) {
      return;
    }

    setSubscribeError(null);

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/vip/${vipAreaId}` } });
      return;
    }

    setIsSubscribing(true);

    try {
      const { checkout } = await createVipSubscriptionCheckout(vipAreaId);

      if (checkout.checkoutUrl) {
        setCheckoutContextCookie(VIP_CHECKOUT_AREA_ID_KEY, checkout.vipAreaId || vipAreaId);
        if (checkout.reference) {
          setCheckoutContextCookie(VIP_CHECKOUT_REFERENCE_KEY, checkout.reference);
        }

        window.location.assign(checkout.checkoutUrl);
        return;
      }

      setSubscribeError("No recibimos una URL de pago valida para continuar con la suscripcion.");
    } catch (checkoutError) {
      setSubscribeError(
        getUserFacingErrorMessage(checkoutError, {
          defaultMessage: "No fue posible iniciar la suscripcion en este momento.",
          forbiddenMessage: "Tu cuenta no tiene permisos para suscribirse a esta Area VIP.",
          notFoundMessage: "No encontramos esta Area VIP para iniciar la suscripcion.",
          badRequestMessage: "La solicitud de suscripcion no es valida. Intentalo nuevamente.",
          allowBackendMessageForBadRequest: false,
          allowBackendMessageForForbidden: false,
        })
      );
    } finally {
      setIsSubscribing(false);
    }
  }, [isAuthenticated, isSubscribing, navigate, vipAreaId]);

  if (loading && !info) {
    return (
      <section className="vp-vip-panel rounded-[2rem] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#00BCD4]">Area VIP</p>
        <h3 className="vp-text-primary mt-2 text-2xl font-black">Cargando experiencia VIP</h3>
        <div className="mt-5 h-40 animate-pulse rounded-3xl bg-white/10" />
      </section>
    );
  }

  if (!info && error) {
    const errorMessage =
      error.backendMessage && error.backendMessage !== error.message
        ? `${error.message} ${error.backendMessage}`
        : error.message;

    return (
      <InfoCard
        title="No pudimos cargar el Area VIP"
        description={errorMessage || "Intenta nuevamente en unos minutos."}
        tone="warning"
        actionLabel="Reintentar"
        onAction={() => {
          void reload(vipAreaId);
        }}
      />
    );
  }

  if (!info) {
    return null;
  }

  return (
    <section className="vp-vip-panel relative overflow-hidden rounded-[2rem] border p-4 md:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[#FD0083]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#00BCD4]/14 blur-3xl" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#7be8ff]/85">Area VIP</p>
            <h3 className="vp-text-primary text-2xl font-black tracking-tight">{isUnsubscribed ? "Suscripcion VIP" : "Publicaciones VIP"}</h3>
          </div>
          <span className="vp-vip-card rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#00BCD4]">
            {isUnsubscribed ? "No suscrito" : "Activo"}
          </span>
        </div>

        {subscribeError && (
          <InfoCard
            title="No pudimos iniciar la suscripcion"
            description={subscribeError}
            tone="warning"
          />
        )}

        {shouldShowSubscribedView ? (
          <div className="space-y-4">
            <VipAreaSummaryBar info={info} />

            {error && error.code !== "FORBIDDEN" && error.code !== "NOT_FOUND" && (
              <InfoCard
                title="No pudimos cargar todo el contenido"
                description={error.message}
                tone="warning"
                actionLabel="Reintentar"
                onAction={() => {
                  void reload(vipAreaId);
                }}
              />
            )}

            {contents.length === 0 ? (
              <EmptyState
                title="Todavia no hay publicaciones"
                description="Cuando la modelo publique contenido VIP, aparecera aqui automaticamente."
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {contents.map((content) => (
                  <VipContentCard
                    key={content.id}
                    content={content}
                    alias={info.alias}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <VipAreaHeaderCard
            info={info}
            onSubscribe={() => {
              void handleSubscribe();
            }}
            subscribeLoading={isSubscribing}
            subscribeDisabled={loading}
          />
        )}
      </div>
    </section>
  );
};
