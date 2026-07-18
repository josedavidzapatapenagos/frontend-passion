import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  getIdentityVerificationStatus,
  submitIdentityVerification,
  type IdentityVerificationStatus,
} from "../../../services/identityVerificationService";
import {
  canSubmitIdentityVerification,
  getVerificationLockReason,
} from "../domain/identityVerificationPolicy";
import { getBackendErrorMessage, getUserFacingErrorMessage } from "../../../services/errorMapper";

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "DNI", label: "DNI" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "DRIVER_LICENSE", label: "Licencia de conducir" },
  { value: "OTHER", label: "Otro" },
] as const;

const VALID_DOCUMENT_TYPES = new Set(
  DOCUMENT_TYPE_OPTIONS.map((option) => option.value)
);

const isPngFile = (file: File) =>
  file.type === "image/png" || file.name.toLowerCase().endsWith(".png");

const maskDocumentNumber = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }

  return `${"*".repeat(trimmed.length - 4)}${trimmed.slice(-4)}`;
};

export const useIdentityVerification = (isModel: boolean) => {
  const submitInFlightRef = useRef(false);
  const [documentType, setDocumentType] = useState("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentImage, setDocumentImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);

  const [status, setStatus] = useState<IdentityVerificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isVerificationLocked = !canSubmitIdentityVerification(status);
  const verificationLockReason = getVerificationLockReason(status);

  const syncStatusInStorage = (verificationStatus: IdentityVerificationStatus | null) => {
    if (verificationStatus?.status) {
      localStorage.setItem("modelVerificationStatus", verificationStatus.status);
      return;
    }

    localStorage.removeItem("modelVerificationStatus");
  };

  const handleCheckStatus = useCallback(async (showFeedback = true) => {
    setLoadingStatus(true);

    if (showFeedback) {
      setError("");
      setMessage("");
    }

    try {
      const verificationStatus = await getIdentityVerificationStatus();
      setStatus(verificationStatus);
      syncStatusInStorage(verificationStatus);
      if (!showFeedback) {
        return;
      }
    } catch (err: unknown) {
      if (!showFeedback) {
        return;
      }

      const statusCode = (err as { response?: { status?: number } }).response?.status;
      const backendMessage = getBackendErrorMessage(err);

      console.error(
        "[IdentityVerification] Error al consultar estado (GET /identity-verification/status)",
        {
          request: { showFeedback },
          response: {
            statusCode,
            message: backendMessage || (err instanceof Error ? err.message : String(err)),
          },
        }
      );

      if (statusCode === 401) {
        setError("La sesión ha expirado.");
      } else {
        setError(
          getUserFacingErrorMessage(err, {
            defaultMessage: "No pudimos revisar tu estado de verificación en este momento.",
            forbiddenMessage: "No tienes permisos para consultar el estado de verificación.",
          })
        );
      }
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const handleSubmitVerification = async (event: FormEvent) => {
    event.preventDefault();

    if (submitInFlightRef.current || sendingVerification) {
      return;
    }

    setMessage("");
    setError("");

    if (!isModel) {
      setError("Esta funcionalidad solo está disponible para perfiles MODEL.");
      return;
    }

    if (isVerificationLocked) {
      setError(verificationLockReason || "No puedes enviar una nueva verificación en este momento.");
      return;
    }

    if (
      !VALID_DOCUMENT_TYPES.has(
        documentType as (typeof DOCUMENT_TYPE_OPTIONS)[number]["value"]
      )
    ) {
      setError("Selecciona un tipo de documento válido antes de enviar la verificación.");
      return;
    }

    if (!documentNumber.trim() || !documentImage || !selfieImage) {
      setError(
        "Por favor, completa todos los campos del formulario, incluyendo la foto de tu documento y tu selfie."
      );
      return;
    }

    if (!isPngFile(documentImage) || !isPngFile(selfieImage)) {
      setError("Solo se aceptan imágenes en formato PNG para el documento y la selfie.");
      return;
    }

    submitInFlightRef.current = true;
    setSendingVerification(true);

    try {
      const response = await submitIdentityVerification({
        documentType,
        documentNumber,
        documentImage,
        selfieImage,
      });

      setMessage(
        response.message ||
          "Tu documentación fue enviada con éxito. El equipo de revisión la evaluará pronto."
      );

      await handleCheckStatus(false);
    } catch (err: unknown) {
      const statusCode = (err as { response?: { status?: number } }).response?.status;
      const backendMessage = getBackendErrorMessage(err);
      const sentPayload = {
        documentType,
        documentNumberMasked: maskDocumentNumber(documentNumber),
        documentImageName: documentImage?.name || null,
        selfieImageName: selfieImage?.name || null,
      };

      if (statusCode === 400) {
        console.error(
          "[IdentityVerification] Error al enviar verificacion (POST /identity-verification)",
          {
            request: sentPayload,
            response: {
              statusCode,
              message: backendMessage || (err instanceof Error ? err.message : String(err)),
            },
          }
        );
        setError("Algunos datos o imágenes tienen un formato inválido. Revísalos.");
      } else if (statusCode === 409) {
        console.warn(
          "[IdentityVerification] Conflicto al enviar verificacion (POST /identity-verification)",
          {
            request: sentPayload,
            response: {
              statusCode,
              message: backendMessage || "Solicitud ya existente",
            },
          }
        );
        setError("");
        setMessage("Tu solicitud ya estaba registrada. Estado sincronizado correctamente.");
        await handleCheckStatus(false);
      } else if (statusCode === 401) {
        console.error(
          "[IdentityVerification] Error al enviar verificacion (POST /identity-verification)",
          {
            request: sentPayload,
            response: {
              statusCode,
              message: backendMessage || (err instanceof Error ? err.message : String(err)),
            },
          }
        );
        setError("La sesión ha expirado.");
      } else {
        console.error(
          "[IdentityVerification] Error al enviar verificacion (POST /identity-verification)",
          {
            request: sentPayload,
            response: {
              statusCode,
              message: backendMessage || (err instanceof Error ? err.message : String(err)),
            },
          }
        );
        setError(
          getUserFacingErrorMessage(err, {
            defaultMessage: "No pudimos enviar tu verificación en este momento.",
            badRequestMessage: "Revisa los datos y los archivos cargados antes de intentarlo nuevamente.",
            conflictMessage: "Ya existe una solicitud activa para tu cuenta.",
          })
        );
      }
    } finally {
      submitInFlightRef.current = false;
      setSendingVerification(false);
    }
  };

  const handleDocumentImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setDocumentImage(null);
      return;
    }

    if (!isPngFile(file)) {
      setDocumentImage(null);
      setError("La imagen del documento debe estar en formato PNG.");
      return;
    }

    setError("");
    setDocumentImage(file);
  };

  const handleSelfieImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelfieImage(null);
      return;
    }

    if (!isPngFile(file)) {
      setSelfieImage(null);
      setError("La selfie debe estar en formato PNG.");
      return;
    }

    setError("");
    setSelfieImage(file);
  };

  useEffect(() => {
    if (!isModel) {
      return;
    }

    void handleCheckStatus(false);
  }, [handleCheckStatus, isModel]);

  return {
    documentType,
    setDocumentType,
    documentNumber,
    setDocumentNumber,
    status,
    loadingStatus,
    sendingVerification,
    message,
    error,
    isVerificationLocked,
    verificationLockReason,
    handleCheckStatus,
    handleSubmitVerification,
    handleDocumentImageChange,
    handleSelfieImageChange,
  };
};
