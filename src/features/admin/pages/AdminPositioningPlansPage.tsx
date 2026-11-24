import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useNotification } from "@/hooks/useNotification";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import {
  createPositioningPlan,
  disablePositioningPlan,
  getActivePositioningPlans,
  type CreatePositioningPlanPayload,
  type PositioningPlan,
  type PositioningPlanType,
} from "@/features/admin/services/positioningPlansService";

const initialForm: CreatePositioningPlanPayload = {
  name: "",
  type: "AUTOMATIC",
  description: "",
  duration_days: 1,
  daily_limit: 1,
  price: 0.01,
};

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <path d="M13.6 3.6c2.9-1.2 5.6-1 6.4-.2.8.8 1 3.5-.2 6.4-1 2.4-2.7 4.4-4.6 5.8l-.5 3.3a1 1 0 0 1-.5.7l-2.6 1.5a.6.6 0 0 1-.9-.6l.3-3.4-3.6-3.6-3.4.3a.6.6 0 0 1-.6-.9l1.5-2.6a1 1 0 0 1 .7-.5l3.3-.5c1.4-1.9 3.3-3.6 5.7-4.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="14.8" cy="9.2" r="1.9" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <ellipse cx="9" cy="6.5" rx="6" ry="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 6.5V12c0 1.66 2.69 3 6 3s6-1.34 6-3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 12v4.5c0 1.66 2.69 3 6 3s6-1.34 6-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M15 8.7c2.76.28 5 1.53 5 3.05v6.75c0 1.52-2.45 2.86-5.5 2.99" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
    <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const AdminPositioningPlansPage = () => {
  const { success, error: notifyError } = useNotification();
  const [plans, setPlans] = useState<PositioningPlan[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [planToDisable, setPlanToDisable] = useState<PositioningPlan | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await getActivePositioningPlans());
    } catch (error: unknown) {
      notifyError({ title: "No se pudieron cargar los planes", description: getUserFacingErrorMessage(error, { defaultMessage: "No se pudo cargar el catálogo de planes activos." }) });
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { void loadPlans(); }, [loadPlans]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createPositioningPlan(form);
      setForm(initialForm);
      success({ title: "Plan creado", description: "El plan quedó activo y disponible para nuevas compras." });
      await loadPlans();
    } catch (error: unknown) {
      notifyError({ title: "No se pudo crear el plan", description: getUserFacingErrorMessage(error, { defaultMessage: "Revisa los datos del plan e inténtalo nuevamente.", conflictMessage: "Ya existe un plan con la misma configuración." }) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!planToDisable) return;
    setProcessingId(planToDisable.id);
    try {
      await disablePositioningPlan(planToDisable.id);
      setPlanToDisable(null);
      success({ title: "Plan deshabilitado", description: "El plan ya no acepta nuevas compras." });
      await loadPlans();
    } catch (error: unknown) {
      notifyError({ title: "No se pudo deshabilitar el plan", description: getUserFacingErrorMessage(error, { defaultMessage: "No se pudo deshabilitar el plan.", conflictMessage: "El plan ya está inactivo." }) });
    } finally {
      setProcessingId(null);
    }
  };

  const updateField = <K extends keyof CreatePositioningPlanPayload>(field: K, value: CreatePositioningPlanPayload[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const stats = useMemo(() => {
    const totalPlans = plans.length;
    const totalValue = plans.reduce((sum, plan) => sum + plan.price, 0);
    const avgPrice = totalPlans ? totalValue / totalPlans : 0;
    const avgDuration = totalPlans ? plans.reduce((sum, plan) => sum + plan.durationDays, 0) / totalPlans : 0;
    const automaticCount = plans.filter((plan) => plan.type === "AUTOMATIC").length;
    return { totalPlans, avgPrice, avgDuration, automaticCount };
  }, [plans]);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--vp-accent)_22%,transparent)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-10 bottom-0 size-48 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,#00BCD4_18%,transparent)_0%,transparent_72%)]" />
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--vp-accent)]">Superadmin</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--vp-text-primary)]">Posicionamientos</h1>
            <p className="mt-2 text-[var(--vp-text-secondary)]">Crea planes activos y controla su disponibilidad.</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Planes activos" value={stats.totalPlans} icon={<RocketIcon />} tone="accent" />
          <StatCard label="Precio promedio" value={stats.avgPrice} icon={<CoinsIcon />} decimals={2} suffix=" EUR" tone="success" />
          <StatCard label="Duración promedio" value={stats.avgDuration} icon={<ClockIcon />} decimals={1} suffix=" días" tone="warning" />
          <StatCard label="Planes automáticos" value={stats.automaticCount} icon={<BoltIcon />} tone="accent" />
        </section>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-6 shadow-sm">
          <h2 className="text-xl font-black text-[var(--vp-text-primary)]">Crear plan</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold text-[var(--vp-text-secondary)]">Nombre<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--vp-input-border)] bg-[var(--vp-input-bg)] px-3 py-2 font-normal text-[var(--vp-text-primary)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)]" /></label>
            <label className="text-sm font-bold text-[var(--vp-text-secondary)]">Tipo<div className="relative mt-1"><select value={form.type} onChange={(event) => updateField("type", event.target.value as PositioningPlanType)} className="w-full appearance-none rounded-xl border border-[var(--vp-input-border)] bg-[var(--vp-input-bg)] px-3 py-2.5 pr-10 font-normal text-[var(--vp-text-primary)] shadow-sm outline-none transition focus:border-[var(--vp-accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)]"><option value="AUTOMATIC" className="bg-[var(--vp-input-bg)] text-[var(--vp-text-primary)]">Automático</option><option value="MANUAL" className="bg-[var(--vp-input-bg)] text-[var(--vp-text-primary)]">Manual</option></select><span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-[var(--vp-accent)]" /></div></label>
            <label className="text-sm font-bold text-[var(--vp-text-secondary)]">Precio (EUR)<input required min="0.01" step="0.01" type="number" value={form.price} onChange={(event) => updateField("price", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[var(--vp-input-border)] bg-[var(--vp-input-bg)] px-3 py-2 font-normal text-[var(--vp-text-primary)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)]" /></label>
            <label className="text-sm font-bold text-[var(--vp-text-secondary)]">Duración (días)<input required min="1" type="number" value={form.duration_days} onChange={(event) => updateField("duration_days", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[var(--vp-input-border)] bg-[var(--vp-input-bg)] px-3 py-2 font-normal text-[var(--vp-text-primary)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)]" /></label>
            <label className="text-sm font-bold text-[var(--vp-text-secondary)]">Límite diario<input required min="1" max="42" type="number" value={form.daily_limit} onChange={(event) => updateField("daily_limit", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[var(--vp-input-border)] bg-[var(--vp-input-bg)] px-3 py-2 font-normal text-[var(--vp-text-primary)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)]" /></label>
            <label className="text-sm font-bold text-[var(--vp-text-secondary)] md:col-span-2 lg:col-span-1">Descripción<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} maxLength={100} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--vp-input-border)] bg-[var(--vp-input-bg)] px-3 py-2 font-normal text-[var(--vp-text-primary)] outline-none transition focus:border-[var(--vp-accent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--vp-accent)_12%,transparent)]" /></label>
          </div>
          <button type="submit" disabled={submitting} className="mt-5 rounded-xl bg-[var(--vp-accent)] px-5 py-2.5 font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">{submitting ? "Creando..." : "Crear plan"}</button>
        </form>

        <section className="rounded-3xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[var(--vp-text-primary)]">Planes activos</h2>
            <button type="button" onClick={() => void loadPlans()} className="rounded-xl border border-[var(--vp-border)] px-4 py-2 text-sm font-bold text-[var(--vp-text-primary)] transition hover:border-[var(--vp-accent)] hover:text-[var(--vp-accent)]">Actualizar</button>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-[var(--vp-text-secondary)]">Cargando planes...</p>
          ) : plans.length === 0 ? (
            <div className="mt-5"><EmptyState title="No hay planes activos" description="Crea el primer plan de posicionamiento para habilitar nuevas compras." /></div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className="group relative overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_55%,var(--vp-card-bg))] p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className={`pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-2xl transition-opacity duration-300 ${plan.type === "AUTOMATIC" ? "bg-[color-mix(in_srgb,var(--vp-accent)_20%,transparent)]" : "bg-[color-mix(in_srgb,#00BCD4_20%,transparent)]"} opacity-0 group-hover:opacity-100`} />
                  <div className="relative flex items-start justify-between gap-3">
                    <h3 className="font-black text-[var(--vp-text-primary)]">{plan.name}</h3>
                    <StatusBadge status={plan.status} />
                  </div>
                  <p className="relative mt-2 min-h-10 text-sm text-[var(--vp-text-secondary)]">{plan.description || "Sin descripción"}</p>
                  <dl className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-[var(--vp-text-secondary)]">Tipo</dt>
                      <dd className={`mt-0.5 font-black ${plan.type === "AUTOMATIC" ? "text-[var(--vp-accent)]" : "text-[#00BCD4]"}`}>{plan.type === "AUTOMATIC" ? "Automático" : "Manual"}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--vp-text-secondary)]">Precio</dt>
                      <dd className="mt-0.5 font-black tabular-nums text-[var(--vp-text-primary)]"><AnimatedNumber value={plan.price} decimals={2} suffix={` ${plan.currency}`} /></dd>
                    </div>
                    <div>
                      <dt className="text-[var(--vp-text-secondary)]">Duración</dt>
                      <dd className="mt-0.5 font-black tabular-nums text-[var(--vp-text-primary)]"><AnimatedNumber value={plan.durationDays} suffix=" días" /></dd>
                    </div>
                    <div>
                      <dt className="text-[var(--vp-text-secondary)]">Límite diario</dt>
                      <dd className="mt-0.5 font-black tabular-nums text-[var(--vp-text-primary)]"><AnimatedNumber value={plan.dailyLimit} /></dd>
                    </div>
                  </dl>
                  <button type="button" disabled={processingId === plan.id} onClick={() => setPlanToDisable(plan)} className="relative mt-5 w-full rounded-xl border border-[var(--vp-danger)] px-4 py-2 text-sm font-bold text-[var(--vp-danger)] transition hover:bg-[color-mix(in_srgb,var(--vp-danger)_10%,transparent)] disabled:opacity-50">{processingId === plan.id ? "Deshabilitando..." : "Deshabilitar"}</button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmationDialog open={Boolean(planToDisable)} title="Deshabilitar plan" description={`El plan ${planToDisable?.name || "seleccionado"} dejará de aceptar nuevas compras.`} confirmLabel="Deshabilitar" tone="error" loading={Boolean(processingId)} onCancel={() => setPlanToDisable(null)} onConfirm={() => void handleDisable()} />
    </div>
  );
};