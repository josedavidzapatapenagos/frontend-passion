import type { IdentityVerificationStatus } from "../../../services/identityVerificationService";

export const isVerificationApproved = (
  status: IdentityVerificationStatus | null
) => status?.status === "APPROVED";

export const isVerificationPending = (
  status: IdentityVerificationStatus | null
) => status?.status === "PENDING";

export const canSubmitIdentityVerification = (
  status: IdentityVerificationStatus | null
) => !isVerificationApproved(status) && !isVerificationPending(status);

export const getVerificationLockReason = (
  status: IdentityVerificationStatus | null
) => {
  if (isVerificationApproved(status)) {
    return "Tu cuenta ya está verificada y activa. No puedes volver a enviar datos de verificación.";
  }

  if (isVerificationPending(status)) {
    return "Ya tienes una solicitud en revisión. Debes esperar el resultado antes de enviar nuevos datos.";
  }

  return "";
};