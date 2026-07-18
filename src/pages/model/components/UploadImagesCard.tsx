import axios from "axios";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useModelProfileAccess } from "../../../features/account/hooks/useModelAccess";
import { useNotification } from "../../../hooks/useNotification";
import { uploadModelProfileImagesApi } from "../../../services/modelProfileService";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const extractExtension = (fileName: string) => {
  const sections = fileName.split(".");
  return sections.length > 1 ? sections[sections.length - 1].toLowerCase() : "";
};

const isAllowedImage = (file: File) => {
  const extension = extractExtension(file.name);

  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return true;
  }

  return ALLOWED_EXTENSIONS.has(extension);
};

const readBackendMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return "";
  }

  const data = error.response?.data as
    | {
        message?: unknown;
        messages?: unknown;
        error?: unknown;
        detail?: unknown;
        title?: unknown;
      }
    | undefined;

  const candidates = [data?.message, data?.error, data?.detail, data?.title];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
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

type UploadSummary = {
  total: number;
  successCount: number;
  rejectedCount: number;
  status: string;
  message: string;
};

type UploadImagesCardProps = {
  onUploadSuccess: () => void;
};

export const UploadImagesCard = ({ onUploadSuccess }: UploadImagesCardProps) => {
  const { success, warning, error: notifyError, info } = useNotification();
  const { isLoading } = useModelProfileAccess();

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasFiles = files.length > 0;

  const queueFiles = useCallback(
    (incomingFiles: File[]) => {
      if (isUploading || !incomingFiles.length) {
        return;
      }

      const validFiles: File[] = [];
      let invalidCount = 0;

      incomingFiles.forEach((file) => {
        if (isAllowedImage(file)) {
          validFiles.push(file);
        } else {
          invalidCount += 1;
        }
      });

      if (invalidCount > 0) {
        notifyError({
          title: "Algunas fotos no se pudieron agregar.",
          description: "Usa archivos en formato JPG, PNG o WEBP.",
        });
      }

      if (!validFiles.length) {
        return;
      }

      setFiles((currentFiles) => {
        const seen = new Set(currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
        const nextFiles = [...currentFiles];

        validFiles.forEach((file) => {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (seen.has(key)) {
            return;
          }

          seen.add(key);
          nextFiles.push(file);
        });

        return nextFiles;
      });

      setSummary(null);
    },
    [isUploading, notifyError]
  );

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    queueFiles(selectedFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (isUploading) {
      setIsDragging(false);
      return;
    }

    setIsDragging(false);
    queueFiles(Array.from(event.dataTransfer.files || []));
  };

  const clearSelection = () => {
    if (isUploading) {
      return;
    }

    setFiles([]);
    setSummary(null);
  };

  const handleUpload = async () => {
    if (!hasFiles || isUploading) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setSummary(null);

    try {
      const response = await uploadModelProfileImagesApi(files, (progressPercentage) => {
        setUploadProgress(progressPercentage);
      });

      setSummary({
        total: response.summary.total,
        successCount: response.summary.successCount,
        rejectedCount: response.summary.rejectedCount,
        status: response.status,
        message: response.message,
      });

      setFiles([]);
      onUploadSuccess();

      if (response.httpStatus === 201 && response.rejectedCount === 0) {
        success({
          title: "Tus fotos ya están guardadas.",
          description: "La galería se actualizó automáticamente.",
        });
        return;
      }

      if (response.isPartial || response.rejectedCount > 0) {
        warning({
          title: "Guardamos parte de tus fotos.",
          description: "Algunas fotos no se pudieron subir. La galería ya se actualizó.",
        });
        return;
      }

      info({
        title: "Proceso completado",
        description: "Terminamos de revisar tu carga de fotos.",
      });
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const backendMessage = readBackendMessage(error).toLowerCase();

      if (status === 400) {
        notifyError({
          title: "No pudimos subir esas fotos.",
          description: "Revisa el formato e inténtalo nuevamente.",
        });
        return;
      }

      if (status === 404) {
        notifyError({
          title: "Primero debes completar tu perfil.",
          description: "Termina la configuración de tu perfil y vuelve a intentarlo.",
        });
        return;
      }

      if (status === 409) {
        if (backendMessage.includes("diario") || backendMessage.includes("daily")) {
          notifyError({
            title: "Llegaste al límite diario de subidas.",
            description: "Podrás volver a subir fotos más tarde.",
          });
          return;
        }

        notifyError({
          title: "Ya llegaste al límite de fotos en tu perfil.",
        });
        return;
      }

      if (status === 429) {
        notifyError({
          title: "Lo intentaste muchas veces en poco tiempo.",
          description: "Espera un momento y vuelve a intentarlo.",
        });
        return;
      }

      if (status === 500) {
        notifyError({
          title: "Tuvimos un problema al subir tus fotos.",
          description: "Intenta de nuevo en unos minutos.",
        });
        return;
      }

      notifyError({
        title: "No pudimos completar la subida.",
        description: "Intenta nuevamente en unos minutos.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress((currentProgress) => (currentProgress < 100 ? currentProgress : 100));
    }
  };

  const handlePrimaryAction = () => {
    if (isUploading || isLoading) {
      return;
    }

    if (hasFiles) {
      void handleUpload();
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4 md:p-5">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!isUploading) {
            setIsDragging(true);
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isUploading) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
          isDragging
            ? "border-[#9924D3] bg-fuchsia-50 dark:bg-[#9924D3]/15"
            : "border-[#9924D3]/60 bg-white/70 dark:bg-white/5"
        } ${isUploading ? "opacity-70" : ""}`}
      >
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isUploading || isLoading}
          className="rounded-xl border border-[#9924D3]/70 px-6 py-3 text-sm font-black text-[#9924D3] transition hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#b45ce4]/70 dark:text-fuchsia-100 dark:hover:bg-[#9924D3]/20"
        >
          + Agregar contenido
        </button>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
          Arrastra y suelta imagenes aqui
        </p>

        <p className="mt-3 text-xs text-slate-500 dark:text-white/60">
          Formatos permitidos: JPG, JPEG, PNG, WEBP
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          disabled={isUploading || isLoading}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="mt-5 rounded-xl border border-sky-300/70 bg-sky-50/80 p-4 text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-100">
          <p className="text-sm font-bold uppercase tracking-wide">Subiendo imagenes...</p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sky-200/70 dark:bg-sky-500/20">
            <div
              className="h-full rounded-full bg-[#00BCD4] transition-[width] duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold">{uploadProgress}%</p>
        </div>
      )}

      {hasFiles && !isUploading && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-left dark:border-white/20 dark:bg-white/5">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Imágenes seleccionadas</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/75">
            Tienes {files.length} archivo{files.length === 1 ? "" : "s"} listo{files.length === 1 ? "" : "s"} para subir.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {files.map((file) => (
              <span
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-white/75"
              >
                {file.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {summary && summary.total > 0 && (
        <div className="mt-5 rounded-xl border border-amber-300/80 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-400/35 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="text-sm font-black uppercase tracking-wide">Resumen de tu carga</p>
          <p className="mt-2 text-sm">Revisamos {summary.total} fotos en total.</p>
          <p className="mt-1 text-sm">{summary.successCount} fotos se guardaron correctamente.</p>
          {summary.rejectedCount > 0 ? (
            <p className="mt-1 text-sm">{summary.rejectedCount} fotos no se pudieron guardar en este intento.</p>
          ) : (
            <p className="mt-1 text-sm">Todo salió bien con tus fotos.</p>
          )}
          <p className="mt-1 text-xs opacity-85">{summary.message}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {hasFiles && (
          <button
            type="button"
            onClick={clearSelection}
            disabled={isUploading || isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Cancelar
          </button>
        )}
      </div>
    </section>
  );
};