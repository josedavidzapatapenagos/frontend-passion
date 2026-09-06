import apiClient from "@/services/apiClient";
import axios from "axios";
import type {
  VipActionApiResponse,
  VipAreaApiResponse,
  VipAreaContentsApiResponse,
  VipAreaContent,
  VipPublishType,
  VipAreaInfo,
  VipSubscriptionCheckout,
  VipSubscriptionCheckoutApiResponse,
} from "@/features/vip-area/types/vipArea";

const sanitizeVipAreaId = (vipAreaId: string) => {
  const normalized = vipAreaId.trim();

  if (!normalized) {
    throw new Error("vipAreaId is required");
  }

  return normalized;
};

export const getVipAreaInfo = async (vipAreaId: string): Promise<VipAreaInfo> => {
  const normalizedVipAreaId = sanitizeVipAreaId(vipAreaId);
  const response = await apiClient.get<VipAreaApiResponse>(`/v1/vip-areas/${normalizedVipAreaId}/info`, {
    headers: {
      accept: "*/*",
    },
  });

  return response.data.data;
};

const vipAreaInfoCache = new Map<string, Promise<VipAreaInfo | null>>();

export const getVipAreaInfoOrNull = async (vipAreaId: string): Promise<VipAreaInfo | null> => {
  try {
    return await getVipAreaInfo(vipAreaId);
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 404) {
      return null;
    }

    throw error;
  }
};

export const getVipAreaInfoCached = (vipAreaId: string): Promise<VipAreaInfo | null> => {
  const normalizedVipAreaId = sanitizeVipAreaId(vipAreaId);
  const existing = vipAreaInfoCache.get(normalizedVipAreaId);
  if (existing) {
    return existing;
  }

  const request = getVipAreaInfoOrNull(normalizedVipAreaId).catch((error) => {
    vipAreaInfoCache.delete(normalizedVipAreaId);
    throw error;
  });

  vipAreaInfoCache.set(normalizedVipAreaId, request);
  return request;
};

export const getVipAreaContents = async (vipAreaId: string): Promise<VipAreaContent[]> => {
  const normalizedVipAreaId = sanitizeVipAreaId(vipAreaId);
  try {
    const response = await apiClient.get<VipAreaContentsApiResponse>(`/v1/vip-areas/${normalizedVipAreaId}/contents`, {
      headers: {
        accept: "*/*",
      },
    });

    return response.data.data || [];
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const accountType = (localStorage.getItem("accountType") || "").trim().toUpperCase().replace("ROLE_", "");
    const isModelAccount = accountType === "MODEL";

    if (status !== 403 || !isModelAccount) {
      throw error;
    }

    const ownerResponse = await apiClient.get<VipAreaContentsApiResponse>("/v1/models/me/vip-area/contents", {
      headers: {
        accept: "*/*",
      },
    });

    return ownerResponse.data.data || [];
  }
};

export type VipSubscriptionCheckoutAttempt = {
  idempotencyKey: string;
  execute: () => Promise<VipSubscriptionCheckout>;
};

const postVipSubscriptionCheckout = async (
  vipAreaId: string,
  idempotencyKey: string
): Promise<VipSubscriptionCheckout> => {
  const normalizedVipAreaId = sanitizeVipAreaId(vipAreaId);

  const response = await apiClient.post<VipSubscriptionCheckoutApiResponse>(
    `/v1/vip-areas/${normalizedVipAreaId}/subscriptions`,
    "",
    {
      headers: {
        accept: "*/*",
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data.data;
};

export const createVipSubscriptionCheckoutAttempt = (vipAreaId: string): VipSubscriptionCheckoutAttempt => {
  const idempotencyKey = crypto.randomUUID();

  return {
    idempotencyKey,
    execute: () => postVipSubscriptionCheckout(vipAreaId, idempotencyKey),
  };
};

type CreateVipSubscriptionCheckoutOptions = {
  idempotencyKey?: string;
};

export const createVipSubscriptionCheckout = async (
  vipAreaId: string,
  options: CreateVipSubscriptionCheckoutOptions = {}
): Promise<{ checkout: VipSubscriptionCheckout; idempotencyKey: string }> => {
  const idempotencyKey = options.idempotencyKey ?? crypto.randomUUID();
  const checkout = await postVipSubscriptionCheckout(vipAreaId, idempotencyKey);

  return {
    checkout,
    idempotencyKey,
  };
};

export const enableMyVipArea = async () => {
  await apiClient.post<VipActionApiResponse<string>>("/v1/models/me/vip-area", {}, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
  });
};

export type CreateMyVipAreaContentPayload = {
  type: VipPublishType;
  file: File;
  description?: string;
  unlockPriceAmount?: number;
};

export const createMyVipAreaContent = async (payload: CreateMyVipAreaContentPayload) => {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("file", payload.file);

  const normalizedDescription = payload.description?.trim();
  if (normalizedDescription) {
    formData.append("description", normalizedDescription);
  }

  if (payload.type === "UNLOCKABLE" && typeof payload.unlockPriceAmount === "number" && payload.unlockPriceAmount > 0) {
    formData.append("unlockPriceAmount", payload.unlockPriceAmount.toString());
  }

  await apiClient.post<VipActionApiResponse<string>>("/v1/models/me/vip-area/contents", formData, {
    headers: {
      accept: "*/*",
      "Content-Type": "multipart/form-data",
    },
  });
};

export type RequestMyVipAreaContentDeletionPayload = {
  vipAreaContentId: string;
  reason: string;
};

export const requestMyVipAreaContentDeletion = async (payload: RequestMyVipAreaContentDeletionPayload) => {
  const { vipAreaContentId, reason } = payload;
  const normalizedVipAreaContentId = vipAreaContentId.trim();
  const normalizedReason = reason.trim();

  if (!normalizedVipAreaContentId) {
    throw new Error("vipAreaContentId is required");
  }

  if (!normalizedReason) {
    throw new Error("reason is required");
  }

  await apiClient.post<VipActionApiResponse<string>>(
    "/v1/models/me/vip-area/contents/deletion-requests",
    {
      vipAreaContentId: normalizedVipAreaContentId,
      reason: normalizedReason,
    },
    {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );
};
