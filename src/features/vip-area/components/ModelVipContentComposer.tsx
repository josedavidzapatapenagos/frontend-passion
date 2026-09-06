import { useMemo, useState, type FormEvent } from "react";
import { InfoCard } from "@/components/common/InfoCard";
import {
  createMyVipAreaContent,
  type CreateMyVipAreaContentPayload,
} from "@/features/vip-area/services/vipAreaService";
import type { VipPublishType } from "@/features/vip-area/types/vipArea";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

type Props = {
  onPublished: () => Promise<void> | void;
};

const PUBLICATION_TYPE_OPTIONS: Array<{ value: VipPublishType; label: string; hint: string }> = [
  {
    value: "NORMAL",
    label: "Normal",
    hint: "El contenido queda disponible para suscriptoras activas de tu VIP.",
  },
  {
    value: "UNLOCKABLE",
    label: "Unlockable",
    hint: "Las suscriptoras deben pagar un extra para desbloquear este contenido.",
  },
];

const parsePositiveAmount = (rawValue: string): number | null => {
  const normalized = rawValue.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const isBlockedNumericKey = (key: string) => {
  return key === "e" || key === "E" || key === "+" || key === "-";
};

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKb = sizeInBytes / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`;
};

export const ModelVipContentComposer = ({ onPublished }: Props) => {
  const [publicationType, setPublicationType] = useState<VipPublishType>("NORMAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [unlockPriceInput, setUnlockPriceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedType = useMemo(
    () => PUBLICATION_TYPE_OPTIONS.find((option) => option.value === publicationType) || PUBLICATION_TYPE_OPTIONS[0],
    [publicationType]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);
    setSuccessMessage(null);

    if (!selectedFile) {
      setFormError("Debes seleccionar una imagen o video para publicar en tu Area VIP.");
      return;
    }

    const parsedUnlockPrice = parsePositiveAmount(unlockPriceInput);

    if (publicationType === "UNLOCKABLE" && parsedUnlockPrice === null) {
      setFormError("Para publicaciones Unlockable debes indicar un monto de desbloqueo valido mayor a 0.");
      return;
    }

    const payload: CreateMyVipAreaContentPayload = {
      type: publicationType,
      file: selectedFile,
      description: description.trim() || undefined,
      unlockPriceAmount: publicationType === "UNLOCKABLE" ? parsedUnlockPrice || undefined : undefined,
    };

    setIsSubmitting(true);

    try {
      await createMyVipAreaContent(payload);
      await onPublished();

      setSelectedFile(null);
      setDescription("");
      setUnlockPriceInput("");
      setPublicationType("NORMAL");
      setSuccessMessage("Contenido VIP publicado correctamente.");
    } catch (error) {
      setFormError(
        getUserFacingErrorMessage(error, {
          defaultMessage: "No fue posible publicar el contenido VIP en este momento.",
          badRequestMessage: "La informacion enviada no es valida. Revisa tipo, archivo y monto.",
          forbiddenMessage: "Tu cuenta no tiene permisos o tu Area VIP aun no esta activa.",
          notFoundMessage: "No encontramos un perfil de modelo para esta cuenta.",
          allowBackendMessageForBadRequest: true,
          allowBackendMessageForForbidden: false,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="vp-vip-card rounded-[1.7rem] border p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#00BCD4]">Publicar contenido</p>
          <h2 className="vp-text-primary mt-1 text-2xl font-black">Nueva publicacion VIP</h2>
        </div>
      </div>

      {formError && <InfoCard title="No pudimos publicar" description={formError} tone="warning" />}
      {successMessage && <InfoCard title="Listo" description={successMessage} tone="success" />}

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold vp-text-primary" htmlFor="vip-publication-type">
            Tipo de publicacion
          </label>
          <div className="vp-vip-card-strong relative overflow-hidden rounded-2xl border p-1 shadow-[0_10px_30px_rgba(0,188,212,0.14)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#00BCD4]/18 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#FD0083]/14 blur-2xl" />
            <select
              id="vip-publication-type"
              value={publicationType}
              onChange={(event) => setPublicationType(event.target.value as VipPublishType)}
              className="vp-vip-card vp-text-primary relative z-[1] w-full appearance-none rounded-xl border px-4 py-3 pr-12 text-sm font-semibold outline-none transition focus:border-[#00BCD4]"
            >
              {PUBLICATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 z-[2] flex items-center text-[#00BCD4]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-xs vp-vip-muted">{selectedType.hint}</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold vp-text-primary" htmlFor="vip-upload-file">
            Archivo multimedia
          </label>
          <input
            id="vip-upload-file"
            type="file"
            accept="image/*,video/*"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setSelectedFile(nextFile);
              setSuccessMessage(null);
            }}
            className="vp-vip-card-strong vp-text-primary block w-full rounded-xl border px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#00BCD4]/15 file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-[#00BCD4]"
          />
          {selectedFile && (
            <p className="mt-2 text-xs vp-vip-muted">
              Seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold vp-text-primary" htmlFor="vip-upload-description">
            Descripcion (opcional)
          </label>
          <textarea
            id="vip-upload-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Escribe un texto corto para presentar tu contenido VIP"
            className="vp-vip-card-strong vp-text-primary w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-[#00BCD4]"
          />
          <p className="mt-2 text-xs vp-vip-muted">{description.length}/280 caracteres</p>
        </div>

        {publicationType === "UNLOCKABLE" && (
          <div>
            <label className="mb-2 block text-sm font-semibold vp-text-primary" htmlFor="vip-upload-unlock-price">
              Monto de desbloqueo
            </label>
            <input
              id="vip-upload-unlock-price"
              type="number"
              inputMode="numeric"
              min={0.01}
              step="0.01"
              value={unlockPriceInput}
              onKeyDown={(event) => {
                if (isBlockedNumericKey(event.key)) {
                  event.preventDefault();
                }
              }}
              onChange={(event) => {
                const nextValue = event.target.value;

                if (!nextValue) {
                  setUnlockPriceInput("");
                  return;
                }

                const normalized = nextValue.replace(",", ".");
                if (!/^\d*(\.\d{0,2})?$/.test(normalized)) {
                  return;
                }

                setUnlockPriceInput(normalized);
              }}
              placeholder="Ej: 25.99"
              className="vp-vip-card-strong vp-text-primary w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-[#00BCD4]"
            />
            <p className="mt-2 text-xs vp-vip-muted">
              Este monto solo se aplica para contenido Unlockable.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#FD0083] px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#ff1a8f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Publicando..." : "Publicar en VIP"}
        </button>
      </form>
    </section>
  );
};
