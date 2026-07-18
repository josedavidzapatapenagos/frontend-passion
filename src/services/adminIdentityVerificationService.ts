import apiClient from "../api/apiClient";

type ApiEnvelope<T> = {
  data: T;
  message: string;
  at: string;
  status: string;
};

export type PendingIdentityVerification = {
  id: string;
  modelId?: string;
  modelAlias?: string;
  documentType?: string;
  documentNumber?: string;
  submissionDate?: string;
  submittedAt?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

type PaginatedResponse<T> = {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  page?: number;
  size?: number;
};

export const getPendingIdentityVerifications = async (
  page = 0,
  size = 10
): Promise<PaginatedResponse<PendingIdentityVerification>> => {
  const response = await apiClient.get<ApiEnvelope<PaginatedResponse<PendingIdentityVerification> | PendingIdentityVerification[]>>(
    "/v1/admin/identity-verifications/pending",
    {
      params: { pageNumber: page, pageSize: size },
      headers: {
        accept: "*/*",
      },
    }
  );

  const payload = response.data.data;

  if (Array.isArray(payload)) {
    return {
      content: payload,
      totalElements: payload.length,
      totalPages: 1,
      number: 0,
    };
  }

  return {
    content: payload?.content || [],
    totalElements: payload?.totalElements || 0,
    totalPages: payload?.totalPages || 0,
    number: payload?.number ?? payload?.page ?? 0,
    page: payload?.page ?? payload?.number ?? 0,
    size: payload?.size ?? size,
  };
};

export const approveIdentityVerification = async (id: string) => {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    `/v1/admin/identity-verifications/${id}/actions/approve`,
    null,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  return response.data;
};

export const rejectIdentityVerification = async (
  id: string,
  rejectionReason: string
) => {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    `/v1/admin/identity-verifications/${id}/actions/reject`,
    { rejectionReason },
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  return response.data;
};
