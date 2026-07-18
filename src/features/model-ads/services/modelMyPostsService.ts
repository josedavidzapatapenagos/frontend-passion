import apiClient from "../../../api/apiClient";
import type { ApiEnvelope, MyModelPost } from "../types/modelMyPosts";

export const getMyModelPosts = async (): Promise<MyModelPost[]> => {
  const response = await apiClient.get<ApiEnvelope<unknown[]>>("/v1/models/posts/me", {
    headers: {
      accept: "*/*",
    },
  });

  const rawList = response.data?.data;
  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList.map((item) => {
    const record = (item || {}) as Record<string, unknown>;
    const rawPrice = (record.price || {}) as Record<string, unknown>;
    const rawServices = Array.isArray(record.services)
      ? record.services
      : Array.isArray(record.virtualServices)
        ? record.virtualServices
        : [];

    const normalizedServices = rawServices.filter((service): service is string => typeof service === "string");

    return {
      id: String(record.id || ""),
      title: typeof record.title === "string" ? record.title : undefined,
      description: typeof record.description === "string" ? record.description : undefined,
      status: typeof record.status === "string" ? record.status : undefined,
      rejectionReason:
        typeof record.rejectionReason === "string" ? record.rejectionReason : undefined,
      catalogId: typeof record.catalogId === "string" ? record.catalogId : undefined,
      catalogName: typeof record.catalogName === "string" ? record.catalogName : undefined,
      categoryName: typeof record.categoryName === "string" ? record.categoryName : undefined,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
      clickCount: typeof record.clickCount === "number" ? record.clickCount : undefined,
      hasPremium:
        typeof record.hasPremium === "boolean"
          ? record.hasPremium
          : typeof record.premium === "boolean"
            ? record.premium
            : typeof record.isVip === "boolean"
              ? record.isVip
              : undefined,
      premiumUntil:
        typeof record.premiumUntil === "string"
          ? record.premiumUntil
          : typeof record.vipUntil === "string"
            ? record.vipUntil
            : typeof record.activeUntil === "string"
              ? record.activeUntil
              : typeof record.expiresAt === "string"
                ? record.expiresAt
                : undefined,
      coverPhotoUrl:
        typeof record.coverPhotoUrl === "string"
          ? record.coverPhotoUrl
          : typeof record.coverPhotoURL === "string"
            ? record.coverPhotoURL
            : typeof record.thumbnailUrl === "string"
              ? record.thumbnailUrl
              : typeof record.imageUrl === "string"
                ? record.imageUrl
                : undefined,
      services: normalizedServices,
      price: {
        amount: typeof rawPrice.amount === "number" ? rawPrice.amount : undefined,
        currency: typeof rawPrice.currency === "string" ? rawPrice.currency : undefined,
      },
    };
  });
};

export const activateMyModelPost = async (postId: string): Promise<ApiEnvelope<unknown>> => {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/activate`,
    undefined,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  return response.data;
};

export const deactivateMyModelPost = async (postId: string): Promise<ApiEnvelope<unknown>> => {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/deactivate`,
    undefined,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  return response.data;
};
