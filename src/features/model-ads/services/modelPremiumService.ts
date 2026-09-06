import apiClient from "@/services/apiClient";
import type { ApiEnvelope } from "@/features/model-ads/types/modelAds";

type PremiumStatePublishResponse = {
  message?: string;
  at?: string;
  status?: string;
};

type PremiumVideoPublishResponse = {
  data?: string;
  message?: string;
  at?: string;
  status?: string;
};

export type PremiumSummaryVideo = {
  id: string;
  postId: string;
  videoUrl: string;
  createdAt: string;
};

export type PremiumSummaryState = {
  id: string;
  postId: string;
  mediaUrl: string;
  premiumStateMediaType: "IMAGE" | "VIDEO" | string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export type PremiumPostSummary = {
  postId: string;
  postIsOnline: boolean;
  premiumStart: string | null;
  premiumEndAt: string | null;
  premiumVideos: PremiumSummaryVideo[];
  premiumState: PremiumSummaryState | null;
};

const extractResponseMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const data = payload as { message?: unknown };
  if (typeof data.message === "string") {
    return data.message.trim();
  }

  return "";
};

const normalizePostId = (postId: string) => {
  const normalizedPostId = postId.trim();

  if (!normalizedPostId) {
    throw new Error("postId is required");
  }

  return normalizedPostId;
};

const normalizePremiumSummary = (payload: unknown): PremiumPostSummary => {
  const data = (payload && typeof payload === "object" ? payload : {}) as {
    post_id?: unknown;
    postId?: unknown;
    post_is_online?: unknown;
    postIsOnline?: unknown;
    premium_start?: unknown;
    premiumStart?: unknown;
    premium_end_at?: unknown;
    premiumEndAt?: unknown;
    post_premium_video_responses?: unknown;
    postPremiumVideoResponses?: unknown;
    premium_state_response?: unknown;
    premiumStateResponse?: unknown;
  };

  const rawVideos = Array.isArray(data.post_premium_video_responses)
    ? data.post_premium_video_responses
    : Array.isArray(data.postPremiumVideoResponses)
      ? data.postPremiumVideoResponses
      : [];

  const premiumVideos = rawVideos
    .map((entry) => {
      const video = (entry && typeof entry === "object" ? entry : {}) as {
        id?: unknown;
        postId?: unknown;
        post_id?: unknown;
        videoUrl?: unknown;
        video_url?: unknown;
        createdAt?: unknown;
        created_at?: unknown;
      };

      const id = typeof video.id === "string" ? video.id : "";
      const postId =
        typeof video.postId === "string"
          ? video.postId
          : typeof video.post_id === "string"
            ? video.post_id
            : "";
      const videoUrl =
        typeof video.videoUrl === "string"
          ? video.videoUrl
          : typeof video.video_url === "string"
            ? video.video_url
            : "";
      const createdAt =
        typeof video.createdAt === "string"
          ? video.createdAt
          : typeof video.created_at === "string"
            ? video.created_at
            : "";

      if (!id || !postId || !videoUrl || !createdAt) {
        return null;
      }

      return {
        id,
        postId,
        videoUrl,
        createdAt,
      };
    })
    .filter((entry): entry is PremiumSummaryVideo => Boolean(entry));

  const rawState =
    data.premium_state_response && typeof data.premium_state_response === "object"
      ? data.premium_state_response
      : data.premiumStateResponse && typeof data.premiumStateResponse === "object"
        ? data.premiumStateResponse
        : null;

  const premiumState = rawState
    ? (() => {
        const state = rawState as {
          id?: unknown;
          postId?: unknown;
          post_id?: unknown;
          mediaUrl?: unknown;
          media_url?: unknown;
          premumStateMediaType?: unknown;
          premiumStateMediaType?: unknown;
          status?: unknown;
          createdAt?: unknown;
          created_at?: unknown;
          expiresAt?: unknown;
          expires_at?: unknown;
        };

        const id = typeof state.id === "string" ? state.id : "";
        const postId =
          typeof state.postId === "string"
            ? state.postId
            : typeof state.post_id === "string"
              ? state.post_id
              : "";
        const mediaUrl =
          typeof state.mediaUrl === "string"
            ? state.mediaUrl
            : typeof state.media_url === "string"
              ? state.media_url
              : "";
        const premiumStateMediaType =
          typeof state.premiumStateMediaType === "string"
            ? state.premiumStateMediaType
            : typeof state.premumStateMediaType === "string"
              ? state.premumStateMediaType
              : "";
        const status = typeof state.status === "string" ? state.status : "";
        const createdAt =
          typeof state.createdAt === "string"
            ? state.createdAt
            : typeof state.created_at === "string"
              ? state.created_at
              : "";
        const expiresAt =
          typeof state.expiresAt === "string"
            ? state.expiresAt
            : typeof state.expires_at === "string"
              ? state.expires_at
              : "";

        if (!id || !postId || !mediaUrl || !premiumStateMediaType || !status || !createdAt || !expiresAt) {
          return null;
        }

        return {
          id,
          postId,
          mediaUrl,
          premiumStateMediaType,
          status,
          createdAt,
          expiresAt,
        };
      })()
    : null;

  return {
    postId:
      typeof data.post_id === "string"
        ? data.post_id
        : typeof data.postId === "string"
          ? data.postId
          : "",
    postIsOnline:
      typeof data.post_is_online === "boolean"
        ? data.post_is_online
        : typeof data.postIsOnline === "boolean"
          ? data.postIsOnline
          : false,
    premiumStart:
      typeof data.premium_start === "string"
        ? data.premium_start
        : typeof data.premiumStart === "string"
          ? data.premiumStart
          : null,
    premiumEndAt:
      typeof data.premium_end_at === "string"
        ? data.premium_end_at
        : typeof data.premiumEndAt === "string"
          ? data.premiumEndAt
          : null,
    premiumVideos,
    premiumState,
  };
};

export const publishPremiumState = async (postId: string, mediaFile: File) => {
  const normalizedPostId = normalizePostId(postId);

  const formData = new FormData();
  formData.append("mediaFile", mediaFile);

  const response = await apiClient.post<ApiEnvelope<PremiumStatePublishResponse> | PremiumStatePublishResponse>(
    `/v1/models/premium/posts/${normalizedPostId}/states`,
    formData,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  return response;
};

export const publishPremiumVideo = async (postId: string, videoFile: File) => {
  const normalizedPostId = normalizePostId(postId);

  const formData = new FormData();
  formData.append("videoFile", videoFile);

  const response = await apiClient.post<
    ApiEnvelope<string> | PremiumVideoPublishResponse
  >(`/v1/models/premium/posts/${normalizedPostId}/videos`, formData, {
    headers: {
      accept: "*/*",
    },
  });

  const message = extractResponseMessage(response.data);

  return {
    response,
    message,
  };
};

export const deactivatePremiumPostOnline = async (postId: string) => {
  const normalizedPostId = normalizePostId(postId);

  const response = await apiClient.patch<ApiEnvelope<string> | PremiumVideoPublishResponse>(
    `/v1/models/premium/posts/${normalizedPostId}/online/deactivate`,
    undefined,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  const message = extractResponseMessage(response.data);

  return {
    response,
    message,
  };
};

export const activatePremiumPostOnline = async (postId: string) => {
  const normalizedPostId = normalizePostId(postId);

  const response = await apiClient.patch<ApiEnvelope<string> | PremiumVideoPublishResponse>(
    `/v1/models/premium/posts/${normalizedPostId}/online/activate`,
    undefined,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  const message = extractResponseMessage(response.data);

  return {
    response,
    message,
  };
};

export const getPostPremiumSummary = async (postId: string) => {
  const normalizedPostId = normalizePostId(postId);

  const response = await apiClient.get<ApiEnvelope<unknown> | unknown>(
    `/v1/models/premium/posts/${normalizedPostId}/premium-summary`,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  const envelope = response.data as ApiEnvelope<unknown>;
  const sourcePayload = typeof envelope === "object" && envelope !== null && "data" in envelope ? envelope.data : response.data;
  const summary = normalizePremiumSummary(sourcePayload);

  return {
    response,
    summary,
  };
};

export const deletePremiumVideo = async (postId: string, videoId: string) => {
  const normalizedPostId = normalizePostId(postId);
  const normalizedVideoId = videoId.trim();

  if (!normalizedVideoId) {
    throw new Error("videoId is required");
  }

  const response = await apiClient.delete<ApiEnvelope<string> | PremiumVideoPublishResponse>(
    `/v1/models/premium/posts/${normalizedPostId}/premium-videos/${normalizedVideoId}`,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  const message = extractResponseMessage(response.data);

  return {
    response,
    message,
  };
};

export const deletePremiumState = async (stateId: string) => {
  const normalizedStateId = stateId.trim();

  if (!normalizedStateId) {
    throw new Error("stateId is required");
  }

  const response = await apiClient.delete<ApiEnvelope<string> | PremiumVideoPublishResponse>(
    `/v1/models/premium/posts/states/${normalizedStateId}`,
    {
      headers: {
        accept: "*/*",
      },
    }
  );

  const message = extractResponseMessage(response.data);

  return {
    response,
    message,
  };
};
