import axios from "axios";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNotification } from "@/hooks/useNotification";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  deletePremiumState,
  publishPremiumState,
  type PremiumPostSummary,
  type PremiumSummaryState,
} from "@/features/model-ads/services/modelPremiumService";

type Props = {
  postId: string | null;
  summary: PremiumPostSummary | null;
  isSummaryLoading: boolean;
  onRefreshSummary?: () => Promise<PremiumPostSummary | null>;
};

const ACCEPTED_MEDIA = "image/*,video/*";
const PHOTO_DELETE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const isSupportedMedia = (file: File) => file.type.startsWith("image/") || file.type.startsWith("video/");

const readBackendMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return "";
  }

  const data = error.response?.data as
    | {
        message?: unknown;
        messages?: unknown;
        error?: unknown;
      }
    | undefined;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim().toLowerCase();
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim().toLowerCase();
  }

  if (Array.isArray(data?.messages)) {
    const firstMessage = data.messages.find(
      (candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0
    );

    if (firstMessage) {
      return firstMessage.trim().toLowerCase();
    }
  }

  return "";
};

const normalizeComparableText = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const getPhotoDeleteCooldownStorageKey = (postId: string) => `premium-photo-delete-cooldown:${postId}`;

const isImageStateType = (mediaType: string | undefined) => {
  if (!mediaType) {
    return false;
  }

  return mediaType.toUpperCase().includes("IMAGE");
};

export const PremiumStatesSection = ({ postId, summary, isSummaryLoading, onRefreshSummary }: Props) => {
  const { success, warning, error: notifyError } = useNotification();
  const confirm = useConfirmDialog();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeletingState, setIsDeletingState] = useState(false);
  const [photoDeleteCooldownUntil, setPhotoDeleteCooldownUntil] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const state = (summary?.premiumState as PremiumSummaryState | null) ?? null;

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!postId) {
      setPhotoDeleteCooldownUntil(null);
      return;
    }

    const storageKey = getPhotoDeleteCooldownStorageKey(postId);
    const storedValue = localStorage.getItem(storageKey);

    if (!storedValue) {
      setPhotoDeleteCooldownUntil(null);
      return;
    }

    const parsed = Number(storedValue);
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      localStorage.removeItem(storageKey);
      setPhotoDeleteCooldownUntil(null);
      return;
    }

    setPhotoDeleteCooldownUntil(parsed);
  }, [postId]);

  useEffect(() => {
    if (!postId || !photoDeleteCooldownUntil) {
      return;
    }

    const storageKey = getPhotoDeleteCooldownStorageKey(postId);
    const intervalId = window.setInterval(() => {
      if (Date.now() >= photoDeleteCooldownUntil) {
        localStorage.removeItem(storageKey);
        setPhotoDeleteCooldownUntil(null);
      }
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [photoDeleteCooldownUntil, postId]);

  const setPhotoDeleteCooldown = () => {
    if (!postId) {
      return;
    }

    const cooldownUntil = Date.now() + PHOTO_DELETE_COOLDOWN_MS;
    localStorage.setItem(getPhotoDeleteCooldownStorageKey(postId), String(cooldownUntil));
    setPhotoDeleteCooldownUntil(cooldownUntil);
  };

  const clearPhotoDeleteCooldown = () => {
    if (!postId) {
      return;
    }

    localStorage.removeItem(getPhotoDeleteCooldownStorageKey(postId));
    setPhotoDeleteCooldownUntil(null);
  };

  const resetSelection = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (!isSupportedMedia(file)) {
      warning({
        title: "Archivo no compatible",
        description: "Selecciona una imagen o video válido para publicar el estado.",
      });
      event.currentTarget.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handlePublish = async () => {
    if (isPublishing) {
      return;
    }

    if (!postId) {
      notifyError({
        title: "No pudimos identificar el anuncio",
        description: "Cierra y vuelve a abrir la gestión del anuncio para intentarlo nuevamente.",
      });
      return;
    }

    if (!selectedFile) {
      warning({
        title: "Selecciona un archivo",
        description: "Agrega una imagen o video antes de publicar el estado Premium.",
      });
      return;
    }

    setIsPublishing(true);

    try {
      await publishPremiumState(postId, selectedFile);

      clearPhotoDeleteCooldown();

      if (onRefreshSummary) {
        await onRefreshSummary();
      }

      success({
        title: "¡Estado Premium publicado!",
        description: "Tu estado estará disponible durante las próximas 24 horas.",
      });

      resetSelection();
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || !error.response) {
        notifyError({
          title: "No pudimos conectarnos con el servidor",
          description: "Revisa tu conexión e inténtalo nuevamente.",
        });
        return;
      }

      const status = error.response.status;
      const backendMessage = readBackendMessage(error);
      const normalizedBackendMessage = normalizeComparableText(backendMessage);
      const isImageUploadAttempt = selectedFile.type.startsWith("image/");

      if (status === 400) {
        warning({
          title: "No pudimos publicar el estado",
          description: "Verifica que el archivo seleccionado sea válido e inténtalo nuevamente.",
        });
        return;
      }

      if (status === 403) {
        notifyError({
          title: "No puedes publicar en este anuncio",
          description: "No tienes permisos para administrar el contenido Premium de esta publicación.",
        });
        return;
      }

      if (status === 409) {
        const stateAlreadyActive =
          normalizedBackendMessage.includes("estado") &&
          (normalizedBackendMessage.includes("activo") || normalizedBackendMessage.includes("active"));

        const deleteCooldownDetected =
          normalizedBackendMessage.includes("cooldown") ||
          normalizedBackendMessage.includes("otro dia") ||
          normalizedBackendMessage.includes("24 hora") ||
          normalizedBackendMessage.includes("manana") ||
          (normalizedBackendMessage.includes("elimin") && normalizedBackendMessage.includes("esper"));

        const photoCooldownDetected =
          deleteCooldownDetected &&
          (isImageUploadAttempt ||
            normalizedBackendMessage.includes("foto") ||
            normalizedBackendMessage.includes("imagen") ||
            normalizedBackendMessage.includes("image"));

        if (stateAlreadyActive) {
          notifyError({
            title: "No puedes publicar otro estado todavía",
            description: "Este anuncio ya tiene un estado Premium activo. Espera a que finalice para volver a publicar.",
          });
          return;
        }

        if (photoCooldownDetected) {
          warning({
            title: "Foto premium en espera",
            description:
              "Como eliminaste un estado premium en foto, solo puedes volver a subir otra foto después de 24 horas.",
          });
          return;
        }

        if (deleteCooldownDetected) {
          warning({
            title: "Debes esperar hasta el otro día",
            description:
              "Después de eliminar un estado premium, el backend aplica un cooldown y no permite publicar otro hasta el día siguiente.",
          });
          return;
        }

        notifyError({
          title: "Premium no activado",
          description: "solo se puede subir un contenido en foto una vez al dia, intenta de nuevo en 24 horas",
        });
        return;
      }

      if (status === 413) {
        warning({
          title: "El archivo es demasiado grande",
          description: "Selecciona un archivo más pequeño e inténtalo nuevamente.",
        });
        return;
      }

      if (status === 429) {
        const deleteCooldownDetected =
          normalizedBackendMessage.includes("cooldown") ||
          normalizedBackendMessage.includes("otro dia") ||
          normalizedBackendMessage.includes("24 hora") ||
          normalizedBackendMessage.includes("manana") ||
          (normalizedBackendMessage.includes("elimin") && normalizedBackendMessage.includes("esper"));

        const photoCooldownDetected =
          deleteCooldownDetected &&
          (isImageUploadAttempt ||
            normalizedBackendMessage.includes("foto") ||
            normalizedBackendMessage.includes("imagen") ||
            normalizedBackendMessage.includes("image"));

        if (photoCooldownDetected) {
          warning({
            title: "Foto premium en espera",
            description:
              "El backend mantiene un cooldown de 24 horas después de eliminar una foto premium. Podrás subirla nuevamente mañana.",
          });
          return;
        }

        if (deleteCooldownDetected) {
          warning({
            title: "Bloqueo temporal por eliminación",
            description:
              "El estado anterior fue eliminado y debes esperar hasta el otro día para publicar uno nuevo.",
          });
          return;
        }

        warning({
          title: "Debes esperar un poco",
          description: "Alcanzaste el límite de publicaciones o todavía tienes un tiempo de espera activo.",
        });
        return;
      }

      if (status === 503) {
        notifyError({
          title: "No pudimos guardar tu estado",
          description: "El servicio de almacenamiento no está disponible en este momento. Inténtalo nuevamente más tarde.",
        });
        return;
      }

      notifyError({
        title: "No pudimos guardar tu estado",
        description: "Inténtalo nuevamente en unos minutos.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteState = async () => {
    if (isDeletingState) {
      return;
    }

    if (!state?.id) {
      warning({
        title: "Sin estado activo",
        description: "No hay un estado premium activo para eliminar.",
      });
      return;
    }

    const accepted = await confirm({
      title: "Eliminar estado premium",
      description: "Este estado se eliminará antes de su vencimiento y no se puede deshacer.",
      tone: "warning",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
    });

    if (!accepted) {
      return;
    }

    setIsDeletingState(true);

    const deletedStateWasImage = isImageStateType(state?.premiumStateMediaType);

    try {
      const { message } = await deletePremiumState(state.id);

      if (deletedStateWasImage) {
        setPhotoDeleteCooldown();
      }

      if (onRefreshSummary) {
        await onRefreshSummary();
      }

      success({
        title: "Estado premium eliminado",
        description:
          message ||
          "El estado premium se eliminó correctamente. Si el backend aplica cooldown, podrás publicar otro estado recién al día siguiente.",
      });
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || !error.response) {
        notifyError({
          title: "No pudimos conectarnos con el servidor",
          description: "Revisa tu conexión e inténtalo nuevamente.",
        });
        return;
      }

      const status = error.response.status;

      if (status === 403) {
        notifyError({
          title: "No tienes permisos para eliminar este estado",
          description: "Tu cuenta no tiene permisos sobre este estado premium.",
        });
        return;
      }

      if (status === 404) {
        warning({
          title: "Estado premium no encontrado",
          description: "El estado ya no existe o fue eliminado anteriormente.",
        });

        if (onRefreshSummary) {
          await onRefreshSummary();
        }
        return;
      }

      if (status === 409) {
        warning({
          title: "Estado ya no activo",
          description: "El estado premium ya no está activo y no puede eliminarse.",
        });

        if (onRefreshSummary) {
          await onRefreshSummary();
        }
        return;
      }

      if (status === 429) {
        warning({
          title: "Límite de eliminaciones excedido",
          description: "Debes esperar un poco antes de intentar otra eliminación.",
        });
        return;
      }

      notifyError({
        title: "No pudimos eliminar el estado",
        description: "Inténtalo nuevamente en unos minutos.",
      });
    } finally {
      setIsDeletingState(false);
    }
  };

  const isVideoPreview = Boolean(selectedFile?.type.startsWith("video/"));
  const stateMediaType = state?.premiumStateMediaType?.toUpperCase() || "";
  const stateIsVideo = stateMediaType.includes("VIDEO");
  const hasPhotoDeleteCooldown = Boolean(photoDeleteCooldownUntil && photoDeleteCooldownUntil > Date.now());

  const stateExpiresAtLabel = state?.expiresAt
    ? new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(state.expiresAt))
    : "Sin fecha";

  return (
    <section className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h4 className="text-base font-black text-[var(--vp-text-primary)]">Estados Premium</h4>
          <p className="text-sm text-[var(--vp-text-secondary)]">
            Publica un estado temporal para este anuncio. Los estados Premium tienen una duración de 24 horas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPublishing || isSummaryLoading}
          className="rounded-xl border border-[var(--vp-border)] bg-[var(--vp-card-secondary)] px-4 py-2 text-sm font-black text-[var(--vp-text-primary)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Agregar archivo
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MEDIA}
        disabled={isPublishing || isSummaryLoading}
        onChange={handleFileSelection}
        className="hidden"
      />

      <div className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--vp-accent)_25%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-accent)_8%,var(--vp-card-secondary))] p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--vp-text-secondary)]">Estado actual</p>
        {isSummaryLoading ? (
          <p className="mt-2 text-sm text-[var(--vp-text-secondary)]">Cargando resumen premium...</p>
        ) : state ? (
          <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-center">
            <div className="overflow-hidden rounded-xl border border-[var(--vp-border)] bg-black/70">
              {stateIsVideo ? (
                <video src={state.mediaUrl} className="h-24 w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <img src={state.mediaUrl} alt="Estado premium actual" className="h-24 w-full object-cover" />
              )}
            </div>

            <div>
              <p className="text-sm font-black text-[var(--vp-text-primary)]">Estado {state.status}</p>
              <p className="mt-1 text-xs text-[var(--vp-text-secondary)]">Tipo: {stateMediaType || "N/D"}</p>
              <p className="text-xs text-[var(--vp-text-secondary)]">Vence: {stateExpiresAtLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleDeleteState();
              }}
              disabled={isDeletingState || isSummaryLoading}
              className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingState ? "Eliminando..." : "Eliminar estado"}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--vp-text-secondary)]">No hay un estado premium activo para esta publicación.</p>
        )}
      </div>

      {hasPhotoDeleteCooldown ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="text-xs font-black uppercase tracking-[0.14em]">Advertencia de cooldown</p>
          <p className="mt-1 text-sm font-semibold">
            Eliminaste una foto premium. Solo podrás subir otra foto premium después de 24 horas.
          </p>
          <p className="mt-1 text-xs">
            Disponible nuevamente: {new Intl.DateTimeFormat("es-CL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(photoDeleteCooldownUntil!))}
          </p>
        </div>
      ) : null}

      {selectedFile ? (
        <div className="mt-4 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-secondary)] p-4">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vp-text-secondary)]">
            Archivo seleccionado
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--vp-text-primary)]">{selectedFile.name}</p>

          {previewUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--vp-border)] bg-black/70">
              {isVideoPreview ? (
                <video src={previewUrl} controls className="max-h-72 w-full object-contain" />
              ) : (
                <img src={previewUrl} alt="Vista previa del estado premium" className="max-h-72 w-full object-contain" />
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="vp-button-primary rounded-xl px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? "Publicando estado..." : "Publicar estado"}
            </button>
            <button
              type="button"
              onClick={resetSelection}
              disabled={isPublishing}
              className="rounded-xl border border-[var(--vp-border)] px-4 py-2 text-sm font-semibold text-[var(--vp-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_85%,transparent)] p-4 text-sm text-[var(--vp-text-secondary)]">
          Selecciona una imagen o video para publicar un estado Premium.
        </div>
      )}
    </section>
  );
};
