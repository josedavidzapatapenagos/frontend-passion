import axios from "axios";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  activatePremiumPostOnline,
  deletePremiumVideo,
  deactivatePremiumPostOnline,
  publishPremiumVideo,
  type PremiumPostSummary,
} from "@/features/model-ads/services/modelPremiumService";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNotification } from "@/hooks/useNotification";

type Props = {
  postId: string | null;
  isPostOnline: boolean;
  summary: PremiumPostSummary | null;
  isSummaryLoading: boolean;
  onRefreshSummary?: () => Promise<PremiumPostSummary | null>;
  onOnlineStateChange?: (isOnline: boolean) => void;
};

const MAX_VIDEOS = 2;
const ACCEPTED_VIDEO = "video/*";

const isSupportedVideo = (file: File) => file.type.startsWith("video/");

const formatUploadedAt = (date: Date) => {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return formatUploadedAt(date);
};

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
    return data.message.trim();
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  if (Array.isArray(data?.messages)) {
    const firstMessage = data.messages.find(
      (candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0
    );

    if (firstMessage) {
      return firstMessage.trim();
    }
  }

  return "";
};

const humanizeBackendMessage = (rawMessage: string) => {
  const normalized = rawMessage.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const first = normalized.charAt(0).toUpperCase();
  return `${first}${normalized.slice(1)}`;
};

const normalizeComparableText = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

export const PremiumVideosSection = ({
  postId,
  isPostOnline,
  summary,
  isSummaryLoading,
  onRefreshSummary,
  onOnlineStateChange,
}: Props) => {
  const { success, warning, error: notifyError } = useNotification();
  const confirm = useConfirmDialog();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(isPostOnline);
  const [isUpdatingOnlineState, setIsUpdatingOnlineState] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentVideos = summary?.premiumVideos ?? [];
  const reachedVideoLimit = currentVideos.length >= MAX_VIDEOS;

  useEffect(() => {
    if (summary && postId && summary.postId === postId) {
      setIsOnline(summary.postIsOnline);
      return;
    }

    setIsOnline(isPostOnline);
  }, [isPostOnline, postId, summary]);

  const selectedPreviewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl);
      }
    };
  }, [selectedPreviewUrl]);

  const resetSelection = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (!isSupportedVideo(file)) {
      warning({
        title: "Formato no compatible",
        description: "Selecciona un archivo de video válido para publicar en Premium.",
      });
      event.currentTarget.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadVideo = async () => {
    if (isUploading) {
      return;
    }

    if (!postId) {
      notifyError({
        title: "No pudimos identificar el anuncio",
        description: "Cierra y vuelve a abrir la gestión del anuncio para continuar.",
      });
      return;
    }

    if (!selectedFile) {
      warning({
        title: "Selecciona un video",
        description: "Elige un video antes de intentar publicarlo.",
      });
      return;
    }

    if (reachedVideoLimit) {
      warning({
        title: "Límite alcanzado",
        description: "Esta publicación ya tiene el máximo de 2 videos premium.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const { message } = await publishPremiumVideo(postId, selectedFile);
      const backendMessage = humanizeBackendMessage(message);

      if (onRefreshSummary) {
        await onRefreshSummary();
      }

      success({
        title: "Video premium publicado",
        description: backendMessage || "Tu video quedó disponible correctamente en Premium.",
      });

      resetSelection();
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || !error.response) {
        notifyError({
          title: "No pudimos conectar con el servidor",
          description: "Revisa tu conexión e inténtalo nuevamente.",
        });
        return;
      }

      const status = error.response.status;
      const backendRawMessage = readBackendMessage(error);
      const backendMessage = humanizeBackendMessage(backendRawMessage);
      const backendMessageLower = backendRawMessage.toLowerCase();

      if (status === 400 || status === 422) {
        warning({
          title: "No pudimos subir el video",
          description:
            backendMessage || "El archivo no cumple con los requisitos esperados por el servidor.",
        });
        return;
      }

      if (status === 403) {
        notifyError({
          title: "No puedes publicar en este anuncio",
          description:
            backendMessage || "No tienes permisos para administrar los videos Premium de esta publicación.",
        });
        return;
      }

      if (status === 404) {
        notifyError({
          title: "Publicación no encontrada",
          description: backendMessage || "No encontramos el anuncio que intentas gestionar.",
        });
        return;
      }

      if (status === 409) {
        const reachedVideoLimit =
          backendMessageLower.includes("límite") ||
          backendMessageLower.includes("limite") ||
          backendMessageLower.includes("max") ||
          backendMessageLower.includes("2");

        if (reachedVideoLimit) {
          warning({
            title: "Ya alcanzaste el máximo",
            description:
              backendMessage || "Esta publicación ya tiene la cantidad máxima de videos Premium permitidos.",
          });
          return;
        }

        notifyError({
          title: "No se pudo publicar el video",
          description:
            backendMessage || "Tu plan Premium no está activo o el anuncio no permite esta acción ahora mismo.",
        });
        return;
      }

      if (status === 413) {
        warning({
          title: "Archivo demasiado grande",
          description: backendMessage || "Selecciona un video más liviano para continuar.",
        });
        return;
      }

      if (status === 415) {
        warning({
          title: "Formato de video no permitido",
          description: backendMessage || "Prueba con otro formato de video e inténtalo nuevamente.",
        });
        return;
      }

      if (status === 429) {
        warning({
          title: "Debes esperar un poco",
          description: backendMessage || "Alcanzaste un límite temporal de carga. Inténtalo en unos minutos.",
        });
        return;
      }

      if (status === 503) {
        notifyError({
          title: "Servicio temporalmente no disponible",
          description:
            backendMessage || "No fue posible guardar el video ahora. Inténtalo nuevamente más tarde.",
        });
        return;
      }

      notifyError({
        title: "No pudimos publicar tu video",
        description: backendMessage || "Ocurrió un error inesperado. Inténtalo nuevamente en unos minutos.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (deletingVideoId) {
      return;
    }

    if (!postId) {
      notifyError({
        title: "No pudimos identificar el anuncio",
        description: "Cierra y vuelve a abrir la gestión del anuncio para continuar.",
      });
      return;
    }

    const accepted = await confirm({
      title: "Eliminar video premium",
      description: "Este video se eliminará de forma permanente de tu publicación premium.",
      tone: "warning",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
    });

    if (!accepted) {
      return;
    }

    setDeletingVideoId(videoId);

    try {
      const { message } = await deletePremiumVideo(postId, videoId);
      if (onRefreshSummary) {
        await onRefreshSummary();
      }

      success({
        title: "Video premium eliminado",
        description: humanizeBackendMessage(message) || "El video se eliminó correctamente.",
      });
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || !error.response) {
        notifyError({
          title: "No pudimos conectar con el servidor",
          description: "Revisa tu conexión e inténtalo nuevamente.",
        });
        return;
      }

      const status = error.response.status;
      const backendRawMessage = readBackendMessage(error);
      const backendMessage = humanizeBackendMessage(backendRawMessage);

      if (status === 403) {
        notifyError({
          title: "No tienes permisos para eliminar este video",
          description: backendMessage || "Tu cuenta no puede operar esta publicación.",
        });
        return;
      }

      if (status === 404) {
        warning({
          title: "Video no encontrado",
          description: backendMessage || "El video ya no existe para esta publicación.",
        });

        if (onRefreshSummary) {
          await onRefreshSummary();
        }
        return;
      }

      if (status === 409) {
        warning({
          title: "No se pudo eliminar el video",
          description: backendMessage || "La publicación no cumple las reglas para eliminar videos premium.",
        });
        return;
      }

      notifyError({
        title: "No pudimos eliminar el video",
        description: backendMessage || "Inténtalo nuevamente en unos minutos.",
      });
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleToggleOnlineState = async () => {
    if (isUpdatingOnlineState) {
      return;
    }

    if (!postId) {
      notifyError({
        title: "No pudimos identificar el anuncio",
        description: "Cierra y vuelve a abrir la gestión del anuncio para continuar.",
      });
      return;
    }

    setIsUpdatingOnlineState(true);

    try {
      const isActivating = !isOnline;
      const { message } = isActivating
        ? await activatePremiumPostOnline(postId)
        : await deactivatePremiumPostOnline(postId);
      const backendMessage = humanizeBackendMessage(message);

      const refreshedSummary = onRefreshSummary ? await onRefreshSummary() : null;
      const nextOnlineState = refreshedSummary?.postIsOnline ?? isActivating;

      setIsOnline(nextOnlineState);
      onOnlineStateChange?.(nextOnlineState);

      success({
        title: isActivating ? "Publicación en línea" : "Publicación fuera de línea",
        description:
          backendMessage ||
          (nextOnlineState
            ? "Tu publicación se marcó como en línea correctamente."
            : "Tu publicación se marcó como fuera de línea correctamente."),
      });
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || !error.response) {
        notifyError({
          title: "No pudimos conectar con el servidor",
          description: "Revisa tu conexión e inténtalo nuevamente.",
        });
        return;
      }

      const status = error.response.status;
      const backendRawMessage = readBackendMessage(error);
      const backendMessage = humanizeBackendMessage(backendRawMessage);
      const normalizedBackendMessage = normalizeComparableText(backendRawMessage);
      const isActivating = !isOnline;

      if (status === 403) {
        notifyError({
          title: "No tienes permisos para esta acción",
          description:
            backendMessage || "Tu cuenta no puede operar esta publicación en este momento.",
        });
        return;
      }

      if (status === 404) {
        notifyError({
          title: "Publicación no encontrada",
          description: backendMessage || "No encontramos la publicación que intentas actualizar.",
        });
        return;
      }

      if (status === 409) {
        const alreadyOffline =
          normalizedBackendMessage.includes("ya esta") &&
          (normalizedBackendMessage.includes("fuera de linea") || normalizedBackendMessage.includes("desactivad"));
        const alreadyOnline =
          normalizedBackendMessage.includes("ya esta") &&
          (normalizedBackendMessage.includes("en linea") || normalizedBackendMessage.includes("activad"));

        if (!isActivating && alreadyOffline) {
          setIsOnline(false);
          onOnlineStateChange?.(false);
          if (onRefreshSummary) {
            await onRefreshSummary();
          }
          warning({
            title: "La publicación ya estaba fuera de línea",
            description:
              backendMessage || "Actualizamos la vista para reflejar el estado real de tu publicación.",
          });
          return;
        }

        if (isActivating && alreadyOnline) {
          setIsOnline(true);
          onOnlineStateChange?.(true);
          if (onRefreshSummary) {
            await onRefreshSummary();
          }
          warning({
            title: "La publicación ya estaba en línea",
            description:
              backendMessage || "Actualizamos la vista para reflejar el estado real de tu publicación.",
          });
          return;
        }

        warning({
          title: isActivating
            ? "No se pudo activar el estado en línea"
            : "No se pudo desactivar el estado en línea",
          description:
            backendMessage ||
            (isActivating
              ? "La publicación no cumple las reglas necesarias para quedar en línea."
              : "La publicación no cumple las reglas necesarias para quedar fuera de línea."),
        });
        return;
      }

      notifyError({
        title: "No pudimos actualizar el estado online",
        description: backendMessage || "Inténtalo nuevamente en unos minutos.",
      });
    } finally {
      setIsUpdatingOnlineState(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border-2 border-dashed border-[color-mix(in_srgb,var(--vp-accent)_42%,transparent)] bg-[color-mix(in_srgb,var(--vp-card-bg)_94%,var(--vp-accent)_6%)] p-4 md:p-5">
      <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--vp-text-primary)]">En línea</p>
            <p className="mt-1 text-sm text-[var(--vp-text-secondary)]">
              {isOnline
                ? "Tu anuncio aparece como disponible para contacto inmediato."
                : "Tu anuncio está marcado como fuera de línea."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleToggleOnlineState();
            }}
            disabled={isUpdatingOnlineState || isSummaryLoading}
            className={`relative h-8 w-14 rounded-full border transition ${
              isOnline
                ? "border-emerald-300 bg-emerald-500"
                : "border-[var(--vp-border)] bg-[var(--vp-card-secondary)]"
            } ${isUpdatingOnlineState || isSummaryLoading ? "cursor-not-allowed opacity-70" : ""}`}
            aria-label="Estado premium del anuncio"
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                isOnline ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-card-bg)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="text-base font-black text-[var(--vp-text-primary)]">Videos Premium</h4>
            <p className="mt-1 text-sm text-[var(--vp-text-secondary)]">
              Agrega hasta 2 videos cortos para destacar este anuncio.
            </p>
            <p className="mt-1 text-xs text-[var(--vp-text-secondary)]">
              Registrados: {currentVideos.length} / {MAX_VIDEOS} videos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || reachedVideoLimit || isSummaryLoading}
            className="rounded-xl border border-[color-mix(in_srgb,var(--vp-accent)_35%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-accent)_10%,var(--vp-card-secondary))] px-4 py-2 text-sm font-black text-[var(--vp-text-primary)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Agregar nuevo video
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_VIDEO}
          disabled={isUploading || reachedVideoLimit || isSummaryLoading}
          onChange={handleSelectFile}
          className="hidden"
        />

        {isSummaryLoading ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--vp-border)] bg-[color-mix(in_srgb,var(--vp-card-secondary)_88%,transparent)] p-4 text-center">
            <p className="text-sm font-semibold text-[var(--vp-text-primary)]">Cargando videos premium...</p>
          </div>
        ) : currentVideos.length > 0 ? (
          <div className="mt-4 space-y-3">
            {currentVideos.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-xl border border-[var(--vp-border)] bg-[var(--vp-card-secondary)]"
              >
                <div className="grid gap-3 p-3 md:grid-cols-[140px_1fr_auto] md:items-center">
                  <div className="overflow-hidden rounded-lg border border-[var(--vp-border)] bg-black/70">
                    <video src={video.videoUrl} className="h-24 w-full object-cover" muted playsInline preload="metadata" />
                  </div>

                  <div>
                    <p className="truncate text-sm font-black text-[var(--vp-text-primary)]">Video premium</p>
                    <p className="mt-1 text-xs text-[var(--vp-text-secondary)]">Tamaño: calculado por servidor</p>
                    <p className="text-xs text-[var(--vp-text-secondary)]">Subido: {formatTimestamp(video.createdAt)}</p>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteVideo(video.id);
                      }}
                      disabled={Boolean(deletingVideoId) || isSummaryLoading}
                      className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-black text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingVideoId === video.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[color-mix(in_srgb,var(--vp-accent)_30%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-card-secondary)_88%,transparent)] p-4 text-center">
            <p className="text-sm font-semibold text-[var(--vp-text-primary)]">Aún no cargaste videos Premium</p>
            <p className="mt-1 text-xs text-[var(--vp-text-secondary)]">
              Selecciona un video y publícalo para que aparezca en este panel.
            </p>
          </div>
        )}

        {selectedFile ? (
          <div className="mt-4 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-card-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-text-secondary)]">Video seleccionado</p>
            <p className="mt-1 truncate text-sm font-black text-[var(--vp-text-primary)]">{selectedFile.name}</p>

            {selectedPreviewUrl ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-[var(--vp-border)] bg-black/70">
                <video src={selectedPreviewUrl} controls className="max-h-72 w-full object-contain" />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUploadVideo}
                disabled={isUploading || reachedVideoLimit || isSummaryLoading}
                className="vp-button-primary rounded-xl px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Publicando video..." : "Publicar video"}
              </button>
              <button
                type="button"
                onClick={resetSelection}
                disabled={isUploading}
                className="rounded-xl border border-[var(--vp-border)] px-4 py-2 text-sm font-semibold text-[var(--vp-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpiar
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--vp-accent)_16%,var(--vp-border))] bg-[color-mix(in_srgb,var(--vp-accent)_7%,var(--vp-card-secondary))] p-3 text-xs text-[var(--vp-text-secondary)]">
          Los videos Premium son visibles mientras tu servicio Premium esté activo. Puedes eliminarlos cuando lo necesites.
        </div>
      </div>
    </section>
  );
};
