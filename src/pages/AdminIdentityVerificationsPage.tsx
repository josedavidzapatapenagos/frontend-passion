import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { InfoCard } from "../components/InfoCard";
import { useNotification } from "../hooks/useNotification";
import {
  approveIdentityVerification,
  getPendingIdentityVerifications,
  rejectIdentityVerification,
  type PendingIdentityVerification,
} from "../services/adminIdentityVerificationService";
import { getUserFacingErrorMessage } from "../services/errorMapper";

export const AdminIdentityVerificationsPage = () => {
  const { success, error: notifyError, warning } = useNotification();
  const [items, setItems] = useState<PendingIdentityVerification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);

  const loadPending = useCallback(async (targetPage = page) => {
    setLoading(true);

    try {
      const response = await getPendingIdentityVerifications(targetPage, 10);
      setItems(response.content || []);
      setTotalPages(response.totalPages || 0);
      setPage(response.number || 0);
    } catch (err: unknown) {
      notifyError({
        title: "No se pudo cargar el listado",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudo cargar el listado de verificaciones.",
          forbiddenMessage: "No tienes permisos para revisar verificaciones.",
        }),
      });
    } finally {
      setLoading(false);
    }
  }, [notifyError, page]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);

    try {
      await approveIdentityVerification(id);
      success({
        title: "Verificación aprobada",
        description: "La verificación ya fue aprobada correctamente.",
      });
      await loadPending(page);
    } catch (err: unknown) {
      notifyError({
        title: "No se pudo aprobar",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudo aprobar la solicitud.",
        }),
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      warning({
        title: "Motivo requerido",
        description: "Debes escribir un motivo de rechazo.",
      });
      return;
    }

    setProcessingId(id);

    try {
      await rejectIdentityVerification(id, rejectionReason.trim());
      success({
        title: "Verificación rechazada",
        description: "La verificación quedó marcada para correcciones.",
      });
      setRejectionReason("");
      setSelectedRejectId(null);
      await loadPending(page);
    } catch (err: unknown) {
      notifyError({
        title: "No se pudo rechazar",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudo rechazar la solicitud.",
        }),
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    void loadPending(0);
  }, [loadPending]);

  return (
    <div className="min-h-screen p-6 md:p-10 vp-text-primary">
      <div className="max-w-6xl mx-auto vp-surface border vp-border rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">
              Verificacion de identidad
            </h2>
            <p className="mt-2 vp-text-muted">
              Solicitudes pendientes para revision administrativa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPending(page)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#00BCD4] text-[#012a33] font-bold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        <div className="mt-4">
          <InfoCard
            title="Ayuda para la revisión"
            description="Revisa la información con atención antes de aprobar o rechazar. Si rechazas, indica claramente qué debe corregirse."
          />
        </div>

        <div className="mt-6 space-y-4">
          {items.length === 0 && !loading && (
            <EmptyState
              title="No hay verificaciones pendientes"
              description="Cuando haya nuevas solicitudes por revisar aparecerán aquí."
            />
          )}

          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border vp-border vp-surface-soft p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                <p><span className="vp-text-muted">ID:</span> {item.id}</p>
                <p><span className="vp-text-muted">Modelo:</span> {item.modelAlias || item.modelId || "-"}</p>
                <p><span className="vp-text-muted">Documento:</span> {item.documentType || "-"}</p>
                <p><span className="vp-text-muted">Numero:</span> {item.documentNumber || "-"}</p>
                <p>
                  <span className="vp-text-muted">Enviado:</span>{" "}
                  {item.submittedAt || item.submissionDate
                    ? new Date(item.submittedAt || item.submissionDate || "").toLocaleString()
                    : "-"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(item.id)}
                  disabled={processingId === item.id}
                  className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold hover:opacity-90 disabled:opacity-50"
                >
                  Aprobar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRejectId((prev) => (prev === item.id ? null : item.id));
                  }}
                  disabled={processingId === item.id}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:opacity-90 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>

              {selectedRejectId === item.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Motivo de rechazo"
                    className="w-full rounded-xl vp-input border px-4 py-3"
                  />

                  <button
                    type="button"
                    onClick={() => handleReject(item.id)}
                    disabled={processingId === item.id}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    Confirmar rechazo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => loadPending(Math.max(page - 1, 0))}
            disabled={loading || page <= 0}
            className="px-4 py-2 rounded-xl vp-surface-soft hover:opacity-90 disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="vp-text-muted">
            Pagina {page + 1} de {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            onClick={() => loadPending(page + 1)}
            disabled={loading || (totalPages > 0 && page + 1 >= totalPages)}
            className="px-4 py-2 rounded-xl vp-surface-soft hover:opacity-90 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};
