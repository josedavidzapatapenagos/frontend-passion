import apiClient from "../api/apiClient";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IdentityVerificationStatus = {
  status: VerificationStatus;
  submissionDate: string;
  rejectionReason: string | null;
};

type ApiEnvelope<T> = {
  data: T;
  message: string;
  at: string;
  status: string;
};

type SupportedDocumentType = "DNI" | "PASSPORT" | "DRIVER_LICENSE" | "OTHER";

const DOCUMENT_TYPE_CANDIDATES: Record<SupportedDocumentType, string[]> = {
  DNI: ["DNI"],
  PASSPORT: ["PASSPORT", "PASAPORTE"],
  DRIVER_LICENSE: ["DRIVER_LICENSE", "DRIVING_LICENSE", "LICENSE", "LICENCIA_CONDUCIR", "LICENCIA_DE_CONDUCIR"],
  OTHER: ["OTHER", "OTRO"],
};

const postIdentityVerification = async (
  payload: {
    documentType: string;
    documentNumber: string;
    documentImage: File;
    selfieImage: File;
  },
  documentType: string
) => {
  const formData = new FormData();
  formData.append("documentType", documentType);
  formData.append("documentNumber", payload.documentNumber);
  formData.append("documentImage", payload.documentImage);
  formData.append("selfieImage", payload.selfieImage);

  return apiClient.post<ApiEnvelope<unknown>>(
    "/v1/models/identity-verifications",
    formData,
    {
      headers: {
        accept: "*/*",
      },
    }
  );
};

export const submitIdentityVerification = async (payload: {
  documentType: string;
  documentNumber: string;
  documentImage: File;
  selfieImage: File;
}) => {
  const typedDocumentType = payload.documentType as SupportedDocumentType;
  const candidates = DOCUMENT_TYPE_CANDIDATES[typedDocumentType] || [payload.documentType];

  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const response = await postIdentityVerification(payload, candidate);
      return response.data;
    } catch (error: unknown) {
      const statusCode = (error as { response?: { status?: number } }).response?.status;
      const shouldTryNext = (statusCode === 400 || statusCode === 422) && candidate !== candidates[candidates.length - 1];

      if (shouldTryNext) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

export const getIdentityVerificationStatus = async (): Promise<IdentityVerificationStatus | null> => {
  try {
    const response = await apiClient.get<ApiEnvelope<IdentityVerificationStatus>>(
      "/v1/models/identity-verifications/me/status",
      {
        headers: {
          accept: "*/*",
        },
      }
    );

    return response.data.data;
  } catch (error: unknown) {
    const apiError = error as {
      response?: {
        status?: number;
      };
    };

    if (apiError.response?.status === 404) {
      return null;
    }

    throw error;
  }
};
