import apiClient from "../api/apiClient";
import type { Catalog } from "./flagService";
import type {
  ApiEnvelope,
  CreateModelPostPayload,
  ModelContentItem,
  UpdateModelPostPayload,
} from "../types/modelAds";

export const getActiveCatalogs = async (signal?: AbortSignal): Promise<Catalog[]> => {
  const response = await apiClient.get<ApiEnvelope<Catalog[]>>("/v1/catalogs", {
    signal,
  });

  return response.data?.data || [];
};

export const getModelContent = async (signal?: AbortSignal): Promise<ModelContentItem[]> => {
  const response = await apiClient.get<ApiEnvelope<ModelContentItem[]>>("/v1/model-content", {
    signal,
    headers: {
      accept: "*/*",
    },
  });

  const allContent = response.data?.data || [];
  return allContent.filter((content) => content.contentType === "IMAGE");
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
