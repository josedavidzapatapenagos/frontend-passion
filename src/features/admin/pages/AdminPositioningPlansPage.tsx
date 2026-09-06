import { useCallback, useEffect, useState } from "react";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FD0083]">Superadmin</p><h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Posicionamientos</h1><p className="mt-2 text-slate-600 dark:text-white/70">Crea planes activos y controla su disponibilidad.</p></header>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#013440]"><h2 className="text-xl font-black text-slate-900 dark:text-white">Crear plan</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-bold text-slate-700 dark:text-white/80">Nombre<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-white/15" /></label>
          <label className="text-sm font-bold text-slate-700 dark:text-white/80">Tipo<div className="relative mt-1"><select value={form.type} onChange={(event) => updateField("type", event.target.value as PositioningPlanType)} className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 pr-10 font-normal text-slate-900 shadow-sm outline-none transition focus:border-[#FD0083] focus:ring-4 focus:ring-[#FD0083]/10 dark:border-white/15 dark:bg-[#012a33] dark:text-white"><option value="AUTOMATIC" className="bg-white text-slate-900 dark:bg-[#012a33] dark:text-white">Automático</option><option value="MANUAL" className="bg-white text-slate-900 dark:bg-[#012a33] dark:text-white">Manual</option></select><span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-[#FD0083]" /></div></label>
          <label className="text-sm font-bold text-slate-700 dark:text-white/80">Precio (EUR)<input required min="0.01" step="0.01" type="number" value={form.price} onChange={(event) => updateField("price", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-white/15" /></label>
          <label className="text-sm font-bold text-slate-700 dark:text-white/80">Duración (días)<input required min="1" type="number" value={form.duration_days} onChange={(event) => updateField("duration_days", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-white/15" /></label>
          <label className="text-sm font-bold text-slate-700 dark:text-white/80">Límite diario<input required min="1" max="42" type="number" value={form.daily_limit} onChange={(event) => updateField("daily_limit", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-white/15" /></label>
          <label className="text-sm font-bold text-slate-700 dark:text-white/80 md:col-span-2 lg:col-span-1">Descripción<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} maxLength={100} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-white/15" /></label>
        </div><button type="submit" disabled={submitting} className="mt-5 rounded-xl bg-[#FD0083] px-5 py-2.5 font-bold text-white disabled:opacity-50">{submitting ? "Creando..." : "Crear plan"}</button></form>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#013440]"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-900 dark:text-white">Planes activos</h2><button type="button" onClick={() => void loadPlans()} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-white/15 dark:text-white">Actualizar</button></div>
          {loading ? <p className="mt-6 text-sm text-slate-500 dark:text-white/60">Cargando planes...</p> : plans.length === 0 ? <div className="mt-5"><EmptyState title="No hay planes activos" description="Crea el primer plan de posicionamiento para habilitar nuevas compras." /></div> : <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10"><div className="flex items-start justify-between gap-3"><h3 className="font-black text-slate-900 dark:text-white">{plan.name}</h3><StatusBadge status={plan.status} /></div><p className="mt-2 min-h-10 text-sm text-slate-600 dark:text-white/65">{plan.description || "Sin descripción"}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500 dark:text-white/50">Tipo</dt><dd className="font-bold dark:text-white">{plan.type === "AUTOMATIC" ? "Automático" : "Manual"}</dd></div><div><dt className="text-slate-500 dark:text-white/50">Precio</dt><dd className="font-bold dark:text-white">{plan.price.toFixed(2)} {plan.currency}</dd></div><div><dt className="text-slate-500 dark:text-white/50">Duración</dt><dd className="font-bold dark:text-white">{plan.durationDays} días</dd></div><div><dt className="text-slate-500 dark:text-white/50">Límite diario</dt><dd className="font-bold dark:text-white">{plan.dailyLimit}</dd></div></dl><button type="button" disabled={processingId === plan.id} onClick={() => setPlanToDisable(plan)} className="mt-5 w-full rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-600 disabled:opacity-50">{processingId === plan.id ? "Deshabilitando..." : "Deshabilitar"}</button></article>)}</div>}
        </section>
      </div>
      <ConfirmationDialog open={Boolean(planToDisable)} title="Deshabilitar plan" description={`El plan ${planToDisable?.name || "seleccionado"} dejará de aceptar nuevas compras.`} confirmLabel="Deshabilitar" tone="error" loading={Boolean(processingId)} onCancel={() => setPlanToDisable(null)} onConfirm={() => void handleDisable()} />
    </div>
  );
};