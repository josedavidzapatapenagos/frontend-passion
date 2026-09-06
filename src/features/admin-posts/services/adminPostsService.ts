import axios from "axios";
import apiClient from "@/services/apiClient";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import type {
  AdminPendingPostDetail,
  AdminPendingPostListItem,
  ApiEnvelope,
  PendingPostsPage,
  PendingPostsQuery,
  RejectPendingPostPayload,
} from "../types/adminPosts";

type UnknownRecord = Record<string, unknown>;

type PendingPostsPaginatedPayload = {
  content?: unknown[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  number?: number;
  size?: number;
};

const asRecord = (value: unknown): UnknownRecord => {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return {};
};

const readString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
};

const readNumber = (...values: unknown[]): number | null => {
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

  return null;
};

const normalizeStatus = (value: unknown): string => {
  const status = readString(value);
  return status || "PENDING";
};

const normalizeListItem = (input: unknown): AdminPendingPostListItem => {
  const post = asRecord(input);

  return {
    id: readString(post.id, post.postId) || "",
    createdAt: readString(post.createdAt, post.creationDate, post.createdOn),
    status: normalizeStatus(post.status),
  };
};

const normalizeDetail = (input: unknown): AdminPendingPostDetail => {
  const post = asRecord(input);
  const price = asRecord(post.price);

  return {
    id: readString(post.id, post.postId) || "",
    title: readString(post.title) || "Sin titulo",
    description: readString(post.description, post.summary) || "",
    coverImageUrl:
      readString(
        post.coverImageUrl,
        post.coverUrl,
        post.coverPhotoUrl,
        post.imageUrl,
        post.thumbnailUrl
      ) || null,
    priceAmount: readNumber(post.priceAmount, post.amount, price.amount),
    currency: readString(post.currency, price.currency),
    createdAt: readString(post.createdAt, post.creationDate, post.createdOn),
    status: normalizeStatus(post.status),
  };
};

const sortByNewest = (items: AdminPendingPostListItem[]): AdminPendingPostListItem[] => {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
};

const normalizePaginatedPayload = (
  payload: PendingPostsPaginatedPayload,
  query: PendingPostsQuery
): PendingPostsPage => {
  const rawContent = Array.isArray(payload.content) ? payload.content : [];
  const content = sortByNewest(rawContent.map(normalizeListItem).filter((item) => Boolean(item.id)));

  const page = payload.number ?? payload.page ?? query.page;
  const size = payload.size ?? query.size;
  const totalElements = payload.totalElements ?? content.length;
  const totalPages = payload.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

  return {
    content,
    totalElements,
    totalPages,
    page,
    size,
  };
};

export const getPendingPosts = async (query: PendingPostsQuery): Promise<PendingPostsPage> => {
  let response;

  try {
    response = await apiClient.get<ApiEnvelope<PendingPostsPaginatedPayload | unknown[]>>(
      "/v1/admin/posts/pending",
      {
        params: {
          pageNumber: query.page,
          pageSize: query.size,
        },
        headers: {
          accept: "*/*",
        },
      }
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        content: [],
        page: query.page,
        size: query.size,
        totalElements: 0,
        totalPages: 0,
      };
    }

    throw error;
  }

  const payload = response.data?.data;

  if (Array.isArray(payload)) {
    const content = sortByNewest(payload.map(normalizeListItem).filter((item) => Boolean(item.id)));
    return {
      content,
      page: query.page,
      size: query.size,
      totalElements: content.length,
      totalPages: query.size > 0 ? Math.ceil(content.length / query.size) : 0,
    };
  }

  return normalizePaginatedPayload(payload || {}, query);
};

export const getPendingPostById = async (id: string): Promise<AdminPendingPostDetail> => {
  const response = await apiClient.get<ApiEnvelope<unknown>>(`/v1/admin/posts/pending/${id}`, {
    headers: {
      accept: "*/*",
    },
  });

  return normalizeDetail(response.data?.data);
};

export const approvePendingPost = async (postId: string): Promise<void> => {
  await apiClient.patch(`/v1/admin/posts/${postId}/approve`, null, {
    headers: {
      accept: "*/*",
    },
  });
};

export const rejectPendingPost = async (
  postId: string,
  payload: RejectPendingPostPayload
): Promise<void> => {
  await apiClient.patch(`/v1/admin/posts/${postId}/reject`, payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
  });
};

export const getPendingPostsErrorMessage = (error: unknown): string => {
  return getUserFacingErrorMessage(error, {
    defaultMessage: "No fue posible completar la revisión de publicaciones.",
    forbiddenMessage: "No tienes permisos para revisar publicaciones.",
    notFoundMessage: "La publicación ya no se encuentra disponible.",
    conflictMessage: "La publicación ya fue revisada por otro administrador.",
  });
};
