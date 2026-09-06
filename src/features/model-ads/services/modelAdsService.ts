import apiClient from "@/services/apiClient";
import { getModelProfileMultimediaContentApi } from "@/features/model-profile/services/modelProfileService";
import type { Catalog } from "@/features/onboarding/services/flagService";
import type {
  ApiEnvelope,
  CreateModelPostPayload,
  ModelContentItem,
  UpdateModelPostPayload,
} from "@/features/model-ads/types/modelAds";

type RawAddPostContentsResult = {
  index?: number;
  status?: string;
  message?: string;
  contentId?: string;
};

type RawAddPostContentsSummary = {
  totalProcessed?: number;
  successCount?: number;
  failureCount?: number;
};

type RawAddPostContentsData = {
  results?: RawAddPostContentsResult[];
  summary?: RawAddPostContentsSummary;
};

export type AddPostContentsResponse = {
  results: Array<{
    index: number;
    status: string;
    message: string;
    contentId: string;
  }>;
  summary: {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
  };
};

export const getActiveCatalogs = async (signal?: AbortSignal): Promise<Catalog[]> => {
  const response = await apiClient.get<ApiEnvelope<Catalog[]>>("/v1/catalogs", {
    signal,
  });

  return response.data?.data || [];
};

export const getModelContent = async (signal?: AbortSignal): Promise<ModelContentItem[]> => {
  const content = await getModelProfileMultimediaContentApi("IMAGE");
  if (signal?.aborted) {
    return [];
  }

  return content;
};

export const createModelPost = async (payload: CreateModelPostPayload) => {
  const response = await apiClient.post<ApiEnvelope<unknown>>("/v1/models/posts", payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

export const updateModelPost = async (postId: string, payload: UpdateModelPostPayload) => {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}`,
    payload,
    {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const addModelPostContents = async (postId: string, contentIds: string[]) => {
  const response = await apiClient.post<ApiEnvelope<RawAddPostContentsData>>(
    `/v1/models/posts/${postId}/contents`,
    {
      contentIds,
    },
    {
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  const results = (response.data?.data?.results || []).map((item, index) => ({
    index: typeof item.index === "number" ? item.index : index,
    status: String(item.status || "UNKNOWN").toUpperCase(),
    message: String(item.message || "Sin detalle"),
    contentId: String(item.contentId || ""),
  }));

  const rawSummary = response.data?.data?.summary;
  return {
    results,
    summary: {
      totalProcessed: rawSummary?.totalProcessed ?? results.length,
      successCount:
        rawSummary?.successCount ?? results.filter((item) => item.status === "SUCCESS").length,
      failureCount:
        rawSummary?.failureCount ?? results.filter((item) => item.status !== "SUCCESS").length,
    },
  };
};

export const removeModelPostContent = async (postId: string, contentId: string) => {
  const response = await apiClient.delete<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/contents/${contentId}`,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  return response.data;
};
