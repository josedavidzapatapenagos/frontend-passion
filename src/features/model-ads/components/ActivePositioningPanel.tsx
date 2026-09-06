import { useEffect, useRef, useState } from "react";
import { useNotification } from "@/hooks/useNotification";
import { getBackendErrorMessage, getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import {
  createManualPositioningRequestAttempt,
  getPostPositioningHistory,
  getPostPositioningRequest,
  type ManualPositioningRequestAttempt,
  type PositioningActivePlan,
  type PositioningHistoryEntry,
  type PositioningHistoryPeriod,
  type PositioningRequest,
} from "@/features/model-ads/services/positioningRequestService";

const MANUAL_REQUEST_ERRORS: Record<string, string> = {
  PURCHASE_NOT_MANUAL: "Tu plan activo es automático, no requiere solicitudes manuales.",
  NO_AVAILABLE_USES: "No te quedan usos disponibles hoy. Vuelve a intentarlo cuando se reinicie el ciclo.",
  POSITIONING_REQUEST_ALREADY_ACTIVE: "Ya tienes una solicitud de posicionamiento en curso.",
  PURCHASE_NOT_FOUND: "No encontramos un plan de posicionamiento activo para este anuncio.",
};

type Props = {
  postId: string;
  plan: PositioningActivePlan;
  onPlanRefresh: () => void;
};

const PERIODS: { value: PositioningHistoryPeriod; label: string }[] = [
  { value: "DAY", label: "Día" },
  { value: "WEEK", label: "Semana" },
  { value: "MONTH", label: "Mes" },
];

const formatDateTime = (value: string) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatPrice = (amount: number, currency: string) =>
  `${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;

const statusTone = (status: string) => {
  const normalized = status.toUpperCase();

  if (normalized === "ACTIVE") {
    return "bg-emerald-500/12 text-emerald-600";
  }

  if (normalized === "PENDING" || normalized === "RESERVED") {
    return "bg-amber-500/12 text-amber-600";
  }

  if (normalized === "EXPIRED" || normalized === "CANCELLED" || normalized === "REJECTED") {
    return "bg-rose-500/12 text-rose-600";
  }

  return "bg-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)] text-[var(--vp-accent)]";
};

const StatusPill = ({ status }: { status: string }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusTone(status)}`}>
    {status || "—"}
  </span>
);

const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-xs font-semibold text-[var(--vp-text-secondary)]">{label}</span>
    <span className="text-right text-sm font-black text-[var(--vp-text-primary)]">{value}</span>
  </div>
);

const UsageTile = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-xl border border-[var(--vp-border)] px-3 py-3 text-center">
    <p className={`text-2xl font-black ${tone}`}>{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">{label}</p>
  </div>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_55%,var(--vp-card-bg))] px-4 py-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vp-text-secondary)]">{title}</p>
    <div className="mt-3">{children}</div>
  </div>
);

export const ActivePositioningPanel = ({ postId, plan, onPlanRefresh }: Props) => {
  const { error, success } = useNotification();
  const [request, setRequest] = useState<PositioningRequest | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PositioningHistoryPeriod>("DAY");
  const [history, setHistory] = useState<PositioningHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isRequestingManual, setIsRequestingManual] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const manualRequestAttempt = useRef<ManualPositioningRequestAttempt | null>(null);

  useEffect(() => {
    manualRequestAttempt.current = null;
  }, [postId]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingRequest(true);
    setRequestError(null);

    void getPostPositioningRequest(postId)
      .then((value) => { if (isActive) setRequest(value); })
      .catch((loadError: unknown) => {
        if (isActive) {
          setRequest(null);
          setRequestError(getUserFacingErrorMessage(loadError, {
            defaultMessage: "No fue posible consultar la solicitud de posicionamiento actual.",
          }));
        }
      })
      .finally(() => { if (isActive) setIsLoadingRequest(false); });

    return () => { isActive = false; };
  }, [postId, refreshToken]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingHistory(true);
    setHistoryError(null);

    void getPostPositioningHistory(postId, period)
      .then((entries) => { if (isActive) setHistory(entries); })
      .catch((loadError: unknown) => {
        if (isActive) {
          setHistory([]);
          setHistoryError(getUserFacingErrorMessage(loadError, {
            defaultMessage: "No fue posible consultar el resumen de posicionamientos.",
          }));
        }
      })
      .finally(() => { if (isActive) setIsLoadingHistory(false); });

    return () => { isActive = false; };
  }, [period, postId, refreshToken]);

  const isManualPlan = plan.planType.toUpperCase() === "MANUAL";
  const canRequestManual = isManualPlan && plan.availableUses > 0;

  const handleManualRequest = async () => {
    if (isRequestingManual) {
      return;
    }

    setIsRequestingManual(true);

    try {
      const attempt = manualRequestAttempt.current ?? createManualPositioningRequestAttempt(postId);
      manualRequestAttempt.current = attempt;

      const message = await attempt.execute();
      manualRequestAttempt.current = null;
      success({ title: "Posicionamiento solicitado", description: message });
      setRefreshToken((token) => token + 1);
      onPlanRefresh();
    } catch (requestFailure: unknown) {
      const backendCode = getBackendErrorMessage(requestFailure) ?? "";
      const mappedMessage = MANUAL_REQUEST_ERRORS[backendCode.trim().toUpperCase()];

      if (mappedMessage) {
        manualRequestAttempt.current = null;
      }

      error({
        title: "No se pudo solicitar el posicionamiento",
        description: mappedMessage ?? getUserFacingErrorMessage(requestFailure, {
          defaultMessage: "No fue posible solicitar el posicionamiento manual. Inténtalo nuevamente.",
          forbiddenMessage: "No tienes permisos para solicitar posicionamiento para este anuncio.",
          notFoundMessage: "No encontramos un plan de posicionamiento activo para este anuncio.",
          conflictMessage: "No fue posible completar la solicitud porque el estado del plan cambió.",
          allowBackendMessageForConflict: false,
        }),
      });
    } finally {
      setIsRequestingManual(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <SectionCard title="Plan activo">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-base font-black text-[var(--vp-text-primary)]">{plan.planName}</h5>
          <StatusPill status={plan.planType} />
        </div>
        <div className="mt-3 space-y-2">
          <DataRow label="Duración" value={`${plan.planDurationDays} ${plan.planDurationDays === 1 ? "día" : "días"}`} />
          <DataRow label="Límite diario" value={`${plan.planDailyLimit} ${plan.planDailyLimit === 1 ? "posición" : "posiciones"}`} />
          <DataRow label="Precio" value={formatPrice(plan.priceAmount, plan.priceCurrency)} />
          <DataRow label="Inicio" value={formatDateTime(plan.startDate)} />
          <DataRow label="Expiración" value={formatDateTime(plan.expirationDate)} />
        </div>
      </SectionCard>

      <SectionCard title="Usos">
        <div className="grid grid-cols-3 gap-3">
          <UsageTile label="Disponibles" value={plan.availableUses} tone="text-[var(--vp-accent)]" />
          <UsageTile label="Consumidos" value={plan.consumedUses} tone="text-[var(--vp-text-primary)]" />
          <UsageTile label="Expirados" value={plan.expiredUses} tone="text-[var(--vp-text-secondary)]" />
        </div>
        <p className="mt-3 text-xs text-[var(--vp-text-secondary)]">Los usos disponibles se reinician cada 24 horas.</p>
      </SectionCard>

      {isManualPlan ? (
        <button
          type="button"
          onClick={() => void handleManualRequest()}
          disabled={!canRequestManual || isRequestingManual}
          title={!canRequestManual ? "No tienes usos disponibles en este momento." : undefined}
          className="w-full rounded-lg bg-[var(--vp-accent)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRequestingManual ? "Solicitando..." : "Solicitar posicionamiento manual"}
        </button>
      ) : null}

      <SectionCard title="Solicitud de posicionamiento actual">
        {isLoadingRequest ? <p className="text-sm text-[var(--vp-text-secondary)]">Consultando solicitud...</p> : null}
        {requestError ? <p role="alert" className="text-sm font-semibold text-rose-600">{requestError}</p> : null}
        {!isLoadingRequest && !requestError && !request ? (
          <p className="text-sm text-[var(--vp-text-secondary)]">Este anuncio no tiene una solicitud de posicionamiento en curso.</p>
        ) : null}
        {!isLoadingRequest && !requestError && request ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={request.status} />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">{request.source}</span>
            </div>
            <DataRow label="Solicitado" value={formatDateTime(request.requestedAt)} />
            <DataRow label="Reservado" value={formatDateTime(request.reservedAt)} />
            <DataRow label="Activado" value={formatDateTime(request.activatedAt)} />
            {request.cycleStatus || request.cycleStartedAt || request.cycleEndsAt ? (
              <div className="mt-3 border-t border-dashed border-[var(--vp-border)] pt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vp-text-secondary)]">Ciclo</p>
                {request.cycleStatus ? <DataRow label="Estado" value={request.cycleStatus} /> : null}
                <DataRow label="Inicio del ciclo" value={formatDateTime(request.cycleStartedAt)} />
                <DataRow label="Fin del ciclo" value={formatDateTime(request.cycleEndsAt)} />
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Resumen de posicionamientos">
        <div className="flex justify-end">
          <div className="flex rounded-lg border border-[var(--vp-border)] p-0.5">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-black ${period === value ? "bg-[var(--vp-accent)] text-white" : "text-[var(--vp-text-secondary)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoadingHistory ? <p className="mt-3 text-sm text-[var(--vp-text-secondary)]">Consultando posicionamientos...</p> : null}
        {historyError ? <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{historyError}</p> : null}
        {!isLoadingHistory && !historyError && history.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--vp-text-secondary)]">No hay posicionamientos en este período.</p>
        ) : null}
        {!isLoadingHistory && !historyError && history.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-[var(--vp-border)] bg-[var(--vp-card-bg)] px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={entry.status} />
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--vp-text-secondary)]">{entry.source}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <DataRow label="Solicitado" value={formatDateTime(entry.requestedAt)} />
                  <DataRow label="Activado" value={formatDateTime(entry.activatedAt)} />
                  <DataRow label="Inicio" value={formatDateTime(entry.startedAt)} />
                  <DataRow label="Fin" value={formatDateTime(entry.endsAt)} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </SectionCard>
    </div>
  );
};
