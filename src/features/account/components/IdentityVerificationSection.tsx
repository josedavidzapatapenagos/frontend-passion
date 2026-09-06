import { useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNotification } from "@/hooks/useNotification";
import type { IdentityVerificationStatus } from "@/features/identity-verification/services/identityVerificationService";
import { DOCUMENT_TYPE_OPTIONS } from "@/features/account/hooks/useIdentityVerification";

type Props = {
  status: IdentityVerificationStatus | null;
  loadingStatus: boolean;
  sendingVerification: boolean;
  isVerificationLocked: boolean;
  verificationLockReason: string;
  documentType: string;
  documentNumber: string;
  message: string;
  error: string;
  onDocumentTypeChange: (value: string) => void;
  onDocumentNumberChange: (value: string) => void;
  onDocumentImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelfieImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSyncStatus: () => void;
  onSubmitVerification: (event: FormEvent) => void;
};

export const IdentityVerificationSection = ({
  status,
  loadingStatus,
  sendingVerification,
  isVerificationLocked,
  verificationLockReason,
  documentType,
  documentNumber,
  message,
  error,
  onDocumentTypeChange,
  onDocumentNumberChange,
  onDocumentImageChange,
  onSelfieImageChange,
  onSyncStatus,
  onSubmitVerification,
}: Props) => {
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    if (!message) {
      return;
    }

    success({
      title: "Verificación enviada",
      description: message,
    });
  }, [message, success]);

  useEffect(() => {
    if (!error) {
      return;
    }

    notifyError({
      title: "No pudimos procesar la verificación",
      description: error,
    });
  }, [error, notifyError]);

  return (
    <>
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
        <p className="text-sm text-slate-600 dark:text-white/70">Estado de tu solicitud</p>
        <div className="mt-2">
          {status?.status ? (
            <StatusBadge status={status.status} showDescription />
          ) : (
            <InfoCard
              title="Aún no has enviado tu verificación"
              description="Completa el formulario cuando estés lista para que el equipo pueda revisar tu identidad."
            />
          )}
        </div>
        {status?.rejectionReason && (
          <div className="mt-3">
            <div className="rounded-xl border border-rose-300/60 dark:border-rose-300/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3">
              <p className="font-bold text-rose-800 dark:text-rose-200">La verificación requiere cambios</p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-100/90">
                Motivo del rechazo: {status.rejectionReason}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onSyncStatus}
          disabled={loadingStatus}
          className="mt-4 px-4 py-2 rounded-xl bg-[#00BCD4] text-[#012a33] font-bold hover:opacity-90 disabled:opacity-50 transition-all text-xs"
        >
          {loadingStatus ? "Actualizando estado..." : "Sincronizar estado actual"}
        </button>
      </div>

      {isVerificationLocked && (
        <InfoCard
          title="No necesitas realizar ninguna acción por ahora"
          description={verificationLockReason}
          tone="warning"
        />
      )}

      {!isVerificationLocked && (
        <form onSubmit={onSubmitVerification} className="space-y-4">
        <h3 className="text-lg font-black">Presentar documentación de identidad</h3>
        <InfoCard
          title="¿Cómo funciona?"
          description="Por seguridad, revisaremos tu documento y tu selfie antes de aprobar la cuenta."
        />

        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Tipo de documento</label>
          <select
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value)}
            className="w-full bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Número identificador</label>
          <input
            value={documentNumber}
            onChange={(e) => onDocumentNumberChange(e.target.value)}
            className="w-full bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Ej: 10023456"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Foto clara de tu documento (frontal)</label>
          <input
            type="file"
            accept=".png,image/png"
            onChange={onDocumentImageChange}
            className="w-full text-sm text-slate-500 dark:text-white/50"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Selfie sosteniendo tu documento</label>
          <input
            type="file"
            accept=".png,image/png"
            onChange={onSelfieImageChange}
            className="w-full text-sm text-slate-500 dark:text-white/50"
          />
        </div>

        <button
          type="submit"
          disabled={sendingVerification}
          className="px-5 py-3 rounded-xl bg-[#FD0083] text-white font-black disabled:opacity-50 hover:opacity-90 transition-all w-full"
        >
          {sendingVerification ? "Subiendo archivos..." : "Enviar para verificación"}
        </button>
        </form>
      )}
    </>
  );
};
