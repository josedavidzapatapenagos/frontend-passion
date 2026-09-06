import apiClient from "@/services/apiClient";
import type { ApiEnvelope, MyModelPost } from "../types/modelMyPosts";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return {};
};

const readString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
};

const readNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const readBoolean = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      if (value === 1) {
        return true;
      }

      if (value === 0) {
        return false;
      }
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") {
        return true;
      }

      if (normalized === "false" || normalized === "0") {
        return false;
      }
    }
  }

  return undefined;
};

const isValidCoverPhotoUrl = (value?: string): value is string => {
  if (!value) {
    return false;
  }

  return !/seed[_-]cover(?:\.[a-z0-9]+)?$/i.test(value);
};

const pickCoverPhotoUrl = (record: UnknownRecord): string | undefined => {
  const directCoverPhotoUrl = readString(record.coverPhotoUrl, record.coverPhotoURL, record.cover_photo_url);
  if (isValidCoverPhotoUrl(directCoverPhotoUrl)) {
    return directCoverPhotoUrl;
  }

  const thumbnailOrImageUrl = readString(record.thumbnailUrl, record.imageUrl);
  if (isValidCoverPhotoUrl(thumbnailOrImageUrl)) {
    return thumbnailOrImageUrl;
  }

  return getFirstContentImageUrl(record);
};

const getFirstContentImageUrl = (record: UnknownRecord): string | undefined => {
  const contentCollections = [record.contents, record.modelContents, record.postContents, record.media];

  for (const collection of contentCollections) {
    if (!Array.isArray(collection)) {
      continue;
    }

    for (const item of collection) {
      const entry = asRecord(item);
      const type = readString(entry.contentType, entry.mediaType, entry.type);
      const candidateUrl = readString(entry.contentUrl, entry.url, entry.mediaUrl, entry.fileUrl);

      if (!candidateUrl) {
        continue;
      }

      if (!type || type.toUpperCase().includes("IMAGE")) {
        return candidateUrl;
      }
    }

    for (const item of collection) {
      const entry = asRecord(item);
      const candidateUrl = readString(entry.contentUrl, entry.url, entry.mediaUrl, entry.fileUrl);
      if (candidateUrl) {
        return candidateUrl;
      }
    }
  }

  return undefined;
};

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
    const record = asRecord(item);
    const rawPrice = asRecord(record.price);
    const rawServices = Array.isArray(record.services)
      ? record.services
      : Array.isArray(record.virtualServices)
        ? record.virtualServices
        : [];

    const normalizedServices = rawServices
      .filter((service): service is string => typeof service === "string")
      .map((service) => service.trim())
      .filter(Boolean);

    const coverPhotoUrl = pickCoverPhotoUrl(record) || getFirstContentImageUrl(record);

    return {
      id: readString(record.id) || "",
      title: readString(record.title),
      description: readString(record.description),
      status: readString(record.status),
      isOnline: readBoolean(record.isOnline, record.is_online, record.online, record.onlineActive),
      rejectionReason: readString(record.rejectionReason, record.rejection_reason),
      catalogId: readString(record.catalogId, record.catalog_id),
      catalogName: readString(record.catalogName, record.catalog_name),
      categoryName: readString(record.categoryName, record.category_name),
      createdAt: readString(record.createdAt, record.created_at),
      deactivatedAt: readString(record.deactivatedAt, record.deactivated_at),
      clickCount: readNumber(record.clickCount, record.click_count),
      hasPremium:
        typeof record.hasPremium === "boolean"
          ? record.hasPremium
          : typeof record.premium === "boolean"
            ? record.premium
            : typeof record.is_premium_active === "boolean"
              ? record.is_premium_active
              : typeof record.isPremiumActive === "boolean"
                ? record.isPremiumActive
            : typeof record.isVip === "boolean"
              ? record.isVip
              : undefined,
      premiumUntil:
        typeof record.premiumUntil === "string"
          ? record.premiumUntil
          : typeof record.premium_until === "string"
            ? record.premium_until
          : typeof record.vipUntil === "string"
            ? record.vipUntil
            : typeof record.activeUntil === "string"
              ? record.activeUntil
              : typeof record.expiresAt === "string"
                ? record.expiresAt
                : undefined,
      coverPhotoUrl,
      services: normalizedServices,
      price: {
        amount: readNumber(rawPrice.amount),
        currency: readString(rawPrice.currency),
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
