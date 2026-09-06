import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { EmptyState } from "@/components/common/EmptyState";
import { InfoCard } from "@/components/common/InfoCard";
import { useModelProfileAccess } from "@/features/account/hooks/useModelAccess";
import { ModelVipContentComposer } from "@/features/vip-area/components/ModelVipContentComposer";
import { VipAreaSummaryBar } from "@/features/vip-area/components/VipAreaSummaryBar";
import { VipContentCard } from "@/features/vip-area/components/VipContentCard";
import { useVipArea } from "@/features/vip-area/hooks/useVipArea";
import { requestMyVipAreaContentDeletion } from "@/features/vip-area/services/vipAreaService";
import type { VipAreaContent } from "@/features/vip-area/types/vipArea";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNotification } from "@/hooks/useNotification";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

const normalizeVipAreaId = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized || null;
};

export const ModelVipStudioPage = () => {
  const { profile, refreshAccess, isLoading, hasResolvedAccess } = useModelProfileAccess();
  const { info, contents, loading, error, load, reload } = useVipArea();
  const confirm = useConfirmDialog();
  const notification = useNotification();
  const [isRefreshingAccess, setIsRefreshingAccess] = useState(false);
  const [deletionRequestContentId, setDeletionRequestContentId] = useState<string | null>(null);
  const [expandedDeletionRequestContentId, setExpandedDeletionRequestContentId] = useState<string | null>(null);
  const [deletionRequestReasons, setDeletionRequestReasons] = useState<Record<string, string>>({});
  const [submittedDeletionRequestIds, setSubmittedDeletionRequestIds] = useState<Record<string, boolean>>({});

  const vipAreaId = useMemo(() => normalizeVipAreaId(profile?.vipAreaId), [profile?.vipAreaId]);

  useEffect(() => {
    if (!vipAreaId) {
      return;
    }

    void load(vipAreaId);
  }, [load, vipAreaId]);

  const handleRefreshVipStatus = useCallback(async () => {
    setIsRefreshingAccess(true);

    try {
      await refreshAccess();
    } finally {
      setIsRefreshingAccess(false);
    }
  }, [refreshAccess]);

  const handleRefreshContent = useCallback(async () => {
    if (!vipAreaId) {
      return;
    }

    await reload(vipAreaId);
  }, [reload, vipAreaId]);

  const handleDeletionRequestReasonChange = useCallback((contentId: string, reason: string) => {
    setDeletionRequestReasons((current) => ({
      ...current,
      [contentId]: reason,
    }));
  }, []);

  const handleOpenDeletionRequest = useCallback((contentId: string) => {
    if (submittedDeletionRequestIds[contentId]) {
      return;
    }

    setExpandedDeletionRequestContentId(contentId);
  }, [submittedDeletionRequestIds]);

  const handleCancelDeletionRequest = useCallback((contentId: string) => {
    setExpandedDeletionRequestContentId((current) => (current === contentId ? null : current));
    setDeletionRequestReasons((current) => ({
      ...current,
      [contentId]: "",
    }));
  }, []);

  const handleRequestContentDeletion = useCallback(async (content: VipAreaContent, reason: string) => {
    if (deletionRequestContentId) {
      return;
    }

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      notification.warning({
        title: "Indica una razon",
        description: "Escribe el motivo de la solicitud antes de enviarla.",
      });
      return;
    }

    const confirmed = await confirm({
      title: "Solicitar eliminacion de contenido VIP",
      description: "La solicitud quedara pendiente de revision junto con la razon que escribiste. Si ya existe una solicitud activa para este contenido, el sistema te lo indicara.",
      tone: "warning",
      confirmLabel: "Solicitar borrado",
      cancelLabel: "Cancelar",
    });

    if (!confirmed) {
      return;
    }

    setDeletionRequestContentId(content.id);

    try {
      await requestMyVipAreaContentDeletion({
        vipAreaContentId: content.id,
        reason: normalizedReason,
      });
      notification.success({
        title: "Solicitud enviada",
        description: "Registramos la solicitud para eliminar este contenido VIP.",
      });
      setSubmittedDeletionRequestIds((current) => ({
        ...current,
        [content.id]: true,
      }));
      setDeletionRequestReasons((current) => ({
        ...current,
        [content.id]: "",
      }));
      setExpandedDeletionRequestContentId(null);
      await handleRefreshContent();
    } catch (requestError) {
      const isPendingRequestConflict = axios.isAxiosError(requestError) && requestError.response?.status === 409;

      if (isPendingRequestConflict) {
        setSubmittedDeletionRequestIds((current) => ({
          ...current,
          [content.id]: true,
        }));
        setDeletionRequestReasons((current) => ({
          ...current,
          [content.id]: "",
        }));
        setExpandedDeletionRequestContentId(null);
      }

      notification.error({
        title: "No pudimos solicitar el borrado",
        description: getUserFacingErrorMessage(requestError, {
          defaultMessage: "No fue posible crear la solicitud de eliminacion en este momento.",
          badRequestMessage: "La solicitud para eliminar este contenido no es valida.",
          forbiddenMessage: "Tu cuenta no tiene permisos sobre este contenido VIP.",
          notFoundMessage: "No encontramos el contenido VIP solicitado.",
          conflictMessage: "Ya existe una solicitud pendiente para este contenido VIP.",
          allowBackendMessageForBadRequest: false,
          allowBackendMessageForConflict: false,
          allowBackendMessageForForbidden: false,
        }),
      });
    } finally {
      setDeletionRequestContentId(null);
    }
  }, [confirm, deletionRequestContentId, handleRefreshContent, notification]);

  if (!vipAreaId) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 p-6 md:p-10">
        <InfoCard
          title="Tu Area VIP aun no esta activa"
          description="Activa primero POST /api/v1/models/me/vip-area desde Swagger y luego verifica estado para habilitar el menu VIP en la navbar."
          tone="info"
          actionLabel={isRefreshingAccess ? "Verificando..." : "Ya la active, verificar estado"}
          onAction={() => {
            if (isRefreshingAccess) {
              return;
            }

            void handleRefreshVipStatus();
          }}
        />

        <section className="vp-vip-card rounded-[1.7rem] border p-5 md:p-6">
          <h2 className="vp-text-primary text-xl font-black">Pasos rapidos</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm vp-vip-muted">
            <li>Abre Swagger y ejecuta habilitar Area VIP para tu cuenta MODEL.</li>
            <li>Regresa aqui y pulsa "Ya la active, verificar estado".</li>
            <li>Cuando se detecte tu VIP Area, veras este estudio y el menu VIP en navbar.</li>
          </ol>
        </section>

        {isLoading && !hasResolvedAccess && (
          <InfoCard
            title="Verificando permisos"
            description="Estamos consultando tu estado de modelo para detectar tu Area VIP."
            tone="info"
          />
        )}
      </div>
    );
  }

  const alias = info?.alias || profile?.alias || "Tu Area VIP";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-10">
      <header className="vp-vip-panel rounded-[2rem] border p-5 md:p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#00BCD4]">Studio VIP</p>
        <h1 className="vp-text-primary mt-2 text-3xl font-black">Gestiona tu contenido VIP</h1>
        <p className="mt-2 text-sm vp-vip-muted">
          Publica contenido Normal o Unlockable para suscriptoras de tu area exclusiva.
        </p>
      </header>

      <ModelVipContentComposer
        onPublished={async () => {
          await handleRefreshContent();
        }}
      />

      {loading && !info && (
        <section className="vp-vip-panel rounded-[2rem] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#00BCD4]">Area VIP</p>
          <h3 className="vp-text-primary mt-2 text-2xl font-black">Cargando contenido</h3>
          <div className="mt-5 h-40 animate-pulse rounded-3xl bg-white/10" />
        </section>
      )}

      {error && !info && (
        <InfoCard
          title="No pudimos cargar tu Area VIP"
          description={error.message}
          tone="warning"
          actionLabel="Reintentar"
          onAction={() => {
            void handleRefreshContent();
          }}
        />
      )}

      {info && (
        <section className="space-y-4">
          <VipAreaSummaryBar info={info} />

          {error && (
            <InfoCard
              title="Tu contenido no se sincronizo completo"
              description={error.message}
              tone="warning"
              actionLabel="Actualizar"
              onAction={() => {
                void handleRefreshContent();
              }}
            />
          )}

          {contents.length === 0 ? (
            <EmptyState
              title="Aun no tienes publicaciones VIP"
              description="Publica tu primer contenido usando el formulario superior para empezar a monetizar tu area."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {contents.map((content) => (
                <VipContentCard
                  key={content.id}
                  content={content}
                  alias={alias}
                  deletionRequestReason={deletionRequestReasons[content.id] || ""}
                  deletionRequestExpanded={expandedDeletionRequestContentId === content.id}
                  deletionRequestLoading={deletionRequestContentId === content.id}
                  deletionRequestSubmitted={Boolean(submittedDeletionRequestIds[content.id])}
                  onDeletionRequestReasonChange={handleDeletionRequestReasonChange}
                  onOpenDeletionRequest={handleOpenDeletionRequest}
                  onCancelDeletionRequest={handleCancelDeletionRequest}
                  onRequestDeletion={handleRequestContentDeletion}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
