import axios, { type AxiosProgressEvent } from "axios";
import apiClient from "@/services/apiClient";

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  at?: string;
  status?: string;
};

type RawContactMethod = {
  id?: string | number;
  contactMethodId?: string | number;
  app?: string;
  value?: string;
};

type RawModelProfile = {
  id?: string | number;
  alias?: string;
  description?: string;
  vipAreaId?: string | number | null;
  vip_area_id?: string | number | null;
  vipArea?: {
    id?: string | number | null;
    vipAreaId?: string | number | null;
    vip_area_id?: string | number | null;
  } | null;
  vip_area?: {
    id?: string | number | null;
    vipAreaId?: string | number | null;
    vip_area_id?: string | number | null;
  } | null;
  contactMethods?: RawContactMethod[];
};

type RawProfileImageUploadResult = {
  index?: number | string;
  status?: string;
  message?: string;
  contentId?: string | number | null;
  url?: string | null;
};

type RawProfileImagesUploadSummary = {
  total?: number | string;
  totalProcessed?: number | string;
  successCount?: number | string;
  rejectedCount?: number | string;
  failureCount?: number | string;
  success?: number | string;
  rejected?: number | string;
  failed?: number | string;
};

type RawProfileImagesUploadPayload = {
  results?: RawProfileImageUploadResult[];
  summary?: RawProfileImagesUploadSummary;
  message?: string;
  status?: string;
};

const hasUploadResults = (value: unknown): value is RawProfileImagesUploadPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { results?: unknown };
  return Array.isArray(candidate.results);
};

const readMessage = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return undefined;
};

export type ModelProfileContactMethod = {
  id: string;
  app: string;
  value: string;
};

export type ModelProfile = {
  id: string | null;
  alias: string;
  description: string;
  vipAreaId: string | null;
  contactMethods: ModelProfileContactMethod[];
};

export type SetUpModelProfilePayload = {
  alias: string;
  description: string;
};

export type SetUpFieldErrors = Partial<Record<"alias" | "description", string>>;
export type ContactMethodApp = "WHATSAPP" | "TELEGRAM";
export type AddContactMethodPayload = {
  app: ContactMethodApp;
  value: string;
};
export type UpdateContactMethodPayload = {
  app: ContactMethodApp;
  value: string;
};
export type ContactMethodFieldErrors = Partial<Record<"app" | "value", string>>;

export type ModelProfileImageUploadResult = {
  index: number;
  status: string;
  message: string;
  contentId: string | null;
  url: string | null;
};

export type UploadModelProfileImagesResponse = {
  httpStatus: number;
  results: ModelProfileImageUploadResult[];
  summary: {
    total: number;
    successCount: number;
    rejectedCount: number;
  };
  message: string;
  status: string;
  total: number;
  successCount: number;
  rejectedCount: number;
  isPartial: boolean;
};

export type ModelProfileMultimediaContentType = "IMAGE" | "VIDEO";

export type ModelProfileMultimediaContent = {
  id: string;
  contentType: ModelProfileMultimediaContentType;
  contentUrl: string;
  createdAt: string;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeContactMethodId = (method: RawContactMethod): string | null => {
  const rawId = method.id ?? method.contactMethodId;

  if (typeof rawId === "string" && rawId.trim()) {
    return rawId.trim();
  }

  if (typeof rawId === "number") {
    return String(rawId);
  }

  return null;
};

const readNullableString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
};

const VIP_ID_KEYS = new Set(["vipAreaId", "vip_area_id", "vipareaid"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const findVipAreaIdDeep = (value: unknown, depth = 0): string | null => {
  if (!value || typeof value !== "object" || depth > 5) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findVipAreaIdDeep(item, depth + 1);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>);

  for (const [key, rawFieldValue] of entries) {
    const normalizedKey = key.toLowerCase();
    if (!VIP_ID_KEYS.has(normalizedKey)) {
      continue;
    }

    const candidate = readNullableString(rawFieldValue);
    if (candidate) {
      return candidate;
    }
  }

  for (const [, rawFieldValue] of entries) {
    const candidate = readNullableString(rawFieldValue);
    if (candidate && UUID_REGEX.test(candidate)) {
      return candidate;
    }
  }

  for (const [, rawFieldValue] of entries) {
    const nested = findVipAreaIdDeep(rawFieldValue, depth + 1);
    if (nested) {
      return nested;
    }
  }

  return null;
};

const resolveVipAreaId = (rawProfile: RawModelProfile): string | null => {
  return (
    readNullableString(rawProfile.vipAreaId) ||
    readNullableString(rawProfile.vip_area_id) ||
    readNullableString(rawProfile.vipArea?.id) ||
    readNullableString(rawProfile.vipArea?.vipAreaId) ||
    readNullableString(rawProfile.vipArea?.vip_area_id) ||
    readNullableString(rawProfile.vip_area?.id) ||
    readNullableString(rawProfile.vip_area?.vipAreaId) ||
    readNullableString(rawProfile.vip_area?.vip_area_id) ||
    findVipAreaIdDeep(rawProfile)
  );
};

const normalizeProfile = (rawProfile: RawModelProfile | null | undefined): ModelProfile | null => {
  if (!rawProfile) {
    return null;
  }

  const contactMethods = (rawProfile.contactMethods || [])
    .filter((method) => Boolean(method?.app && method?.value))
    .map((method) => ({
      id: normalizeContactMethodId(method) || `${String(method.app).toUpperCase()}-${String(method.value)}`,
      app: String(method.app).toUpperCase(),
      value: String(method.value),
    }));

  return {
    id: readNullableString(rawProfile.id),
    alias: rawProfile.alias || "",
    description: rawProfile.description || "",
    vipAreaId: resolveVipAreaId(rawProfile),
    contactMethods,
  };
};

export const getModelProfileMeApi = async () => {
  const response = await apiClient.get<ApiEnvelope<RawModelProfile>>("/v1/models/profiles/me", {
    headers: {
      accept: "*/*",
    },
  });

  return normalizeProfile(response.data?.data);
};

export const getModelProfileMeOrNull = async () => {
  try {
    return await getModelProfileMeApi();
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404) {
      return null;
    }

    throw error;
  }
};

export const setUpModelProfileApi = async (payload: SetUpModelProfilePayload) => {
  return apiClient.post<ApiEnvelope<null>>("/v1/models/profiles/me/set-up", payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
  });
};

export const addModelContactMethodApi = async (payload: AddContactMethodPayload) => {
  return apiClient.post<ApiEnvelope<null>>("/v1/models/profiles/me/contact-methods", payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
  });
};

export const updateModelContactMethodApi = async (
  contactMethodId: string,
  payload: UpdateContactMethodPayload
) => {
  return apiClient.patch<ApiEnvelope<null>>(`/v1/models/profiles/me/contact-methods/${contactMethodId}`, payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
    },
  });
};

export const deleteModelContactMethodApi = async (contactMethodId: string) => {
  return apiClient.delete<ApiEnvelope<null>>(`/v1/models/profiles/me/contact-methods/${contactMethodId}`, {
    headers: {
      accept: "*/*",
    },
  });
};

const normalizeUploadResult = (
  rawResult: RawProfileImageUploadResult,
  fallbackIndex: number
): ModelProfileImageUploadResult => {
  const resolvedIndex = typeof rawResult.index === "number"
    ? rawResult.index
    : Number.parseInt(String(rawResult.index ?? fallbackIndex), 10);

  const normalizedIndex = Number.isFinite(resolvedIndex) ? resolvedIndex : fallbackIndex;
  const normalizedStatus = String(rawResult.status || "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
  const normalizedMessage = readMessage(rawResult.message) || "Sin detalle adicional.";
  const contentId =
    typeof rawResult.contentId === "number"
      ? String(rawResult.contentId)
      : readMessage(rawResult.contentId) || null;
  const url = readMessage(rawResult.url) || null;

  return {
    index: normalizedIndex,
    status: normalizedStatus,
    message: normalizedMessage,
    contentId,
    url,
  };
};

export const uploadModelProfileImagesApi = async (
  images: File[],
  onProgress?: (progressPercentage: number) => void
): Promise<UploadModelProfileImagesResponse> => {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await apiClient.post<ApiEnvelope<RawProfileImagesUploadPayload> | RawProfileImagesUploadPayload>(
    "/v1/models/profiles/me/images",
    formData,
    {
      headers: {
        accept: "*/*",
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (!onProgress || !progressEvent.total) {
          return;
        }

        const ratio = Math.min(progressEvent.loaded / progressEvent.total, 1);
        onProgress(Math.round(ratio * 100));
      },
    }
  );

  const responseData = response.data as
    | (ApiEnvelope<RawProfileImagesUploadPayload> & { summary?: RawProfileImagesUploadSummary })
    | RawProfileImagesUploadPayload
    | undefined;
  const payload: unknown =
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;
  const envelopeSummary =
    responseData && typeof responseData === "object" && "summary" in responseData
      ? responseData.summary
      : undefined;
  const rawResults = hasUploadResults(payload) ? payload.results || [] : [];
  let normalizedResults = rawResults.map((rawResult: RawProfileImageUploadResult, index: number) =>
    normalizeUploadResult(rawResult, index)
  );

  if (normalizedResults.length === 0 && response.status === 201) {
    normalizedResults = images.map((_, index) => ({
      index,
      status: "SUCCESS",
      message: "Imagen subida correctamente.",
      contentId: null,
      url: null,
    }));
  }

  const successCount = normalizedResults.filter(
    (result: ModelProfileImageUploadResult) => result.status === "SUCCESS"
  ).length;
  const rawSummary = hasUploadResults(payload) ? payload.summary : envelopeSummary;
  const fallbackTotal = normalizedResults.length || images.length;
  const fallbackRejectedCount = Math.max(fallbackTotal - successCount, 0);
  const total = readNumber(rawSummary?.total) ?? readNumber(rawSummary?.totalProcessed) ?? fallbackTotal;
  const rejectedCount =
    readNumber(rawSummary?.rejectedCount) ??
    readNumber(rawSummary?.failureCount) ??
    readNumber(rawSummary?.rejected) ??
    readNumber(rawSummary?.failed) ??
    fallbackRejectedCount;
  const resolvedSuccessCount =
    readNumber(rawSummary?.successCount) ?? readNumber(rawSummary?.success) ?? successCount;
  const status =
    (hasUploadResults(payload) ? readMessage(payload.status) : undefined) ||
    (responseData && typeof responseData === "object" && "status" in responseData
      ? readMessage(responseData.status)
      : undefined) ||
    (response.status === 201 ? "SUCCESS" : "UNKNOWN");
  const message =
    (hasUploadResults(payload) ? readMessage(payload.message) : undefined) ||
    (responseData && typeof responseData === "object" && "message" in responseData
      ? readMessage(responseData.message)
      : undefined) ||
    "Carga completada.";

  return {
    httpStatus: response.status,
    results: normalizedResults,
    summary: {
      total,
      successCount: resolvedSuccessCount,
      rejectedCount,
    },
    message,
    status,
    total,
    successCount: resolvedSuccessCount,
    rejectedCount,
    isPartial: response.status === 200 || (resolvedSuccessCount > 0 && rejectedCount > 0),
  };
};

const normalizeMultimediaContent = (value: unknown): ModelProfileMultimediaContent | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    id?: unknown;
    contentType?: unknown;
    contentUrl?: unknown;
    createdAt?: unknown;
  };

  const id = readMessage(candidate.id);
  const contentUrl = readMessage(candidate.contentUrl);
  const createdAt = readMessage(candidate.createdAt);
  const contentType = readMessage(candidate.contentType)?.toUpperCase();

  if (!id || !contentUrl || !createdAt || (contentType !== "IMAGE" && contentType !== "VIDEO")) {
    return null;
  }

  return {
    id,
    contentType,
    contentUrl,
    createdAt,
  };
};

export const getModelProfileMultimediaContentApi = async (
  contentType: ModelProfileMultimediaContentType = "IMAGE"
) => {
  const response = await apiClient.get<ApiEnvelope<unknown>>("/v1/models/profiles/me/multimedia-content", {
    params: {
      contentType,
    },
    headers: {
      accept: "*/*",
    },
  });

  const rawData = response.data?.data;
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData
    .map((item) => normalizeMultimediaContent(item))
    .filter((item): item is ModelProfileMultimediaContent => Boolean(item));
};

export const deleteModelProfileMultimediaContentApi = async (contentId: string) => {
  return apiClient.delete<ApiEnvelope<unknown>>(`/v1/models/profiles/me/multimedia-content/${contentId}/delete`, {
    headers: {
      accept: "*/*",
    },
  });
};

export const extractSetUpFieldErrors = (error: unknown): SetUpFieldErrors => {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const data = error.response?.data as
    | {
        errors?: unknown;
        fieldErrors?: unknown;
        violations?: unknown;
      }
    | undefined;

  const fieldErrors: SetUpFieldErrors = {};
  const rawCandidates = [data?.errors, data?.fieldErrors, data?.violations].filter(Boolean);

  rawCandidates.forEach((rawCandidate) => {
    if (Array.isArray(rawCandidate)) {
      rawCandidate.forEach((item) => {
        if (!item || typeof item !== "object") {
          return;
        }

        const candidate = item as Record<string, unknown>;
        const field = candidate.field || candidate.path || candidate.name;
        const message = readMessage(candidate.message || candidate.error || candidate.defaultMessage);

        if (field === "alias" && message) {
          fieldErrors.alias = fieldErrors.alias || message;
        }

        if (field === "description" && message) {
          fieldErrors.description = fieldErrors.description || message;
        }
      });

      return;
    }

    if (rawCandidate && typeof rawCandidate === "object") {
      const candidateObject = rawCandidate as Record<string, unknown>;
      const aliasMessage = readMessage(candidateObject.alias);
      const descriptionMessage = readMessage(candidateObject.description);

      if (aliasMessage) {
        fieldErrors.alias = fieldErrors.alias || aliasMessage;
      }

      if (descriptionMessage) {
        fieldErrors.description = fieldErrors.description || descriptionMessage;
      }
    }
  });

  return fieldErrors;
};

export const extractContactMethodFieldErrors = (error: unknown): ContactMethodFieldErrors => {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const data = error.response?.data as
    | {
        errors?: unknown;
        fieldErrors?: unknown;
        violations?: unknown;
      }
    | undefined;

  const fieldErrors: ContactMethodFieldErrors = {};
  const rawCandidates = [data?.errors, data?.fieldErrors, data?.violations].filter(Boolean);

  rawCandidates.forEach((rawCandidate) => {
    if (Array.isArray(rawCandidate)) {
      rawCandidate.forEach((item) => {
        if (!item || typeof item !== "object") {
          return;
        }

        const candidate = item as Record<string, unknown>;
        const field = candidate.field || candidate.path || candidate.name;
        const message = readMessage(candidate.message || candidate.error || candidate.defaultMessage);

        if (field === "app" && message) {
          fieldErrors.app = fieldErrors.app || message;
        }

        if (field === "value" && message) {
          fieldErrors.value = fieldErrors.value || message;
        }
      });

      return;
    }

    if (rawCandidate && typeof rawCandidate === "object") {
      const candidateObject = rawCandidate as Record<string, unknown>;
      const appMessage = readMessage(candidateObject.app);
      const valueMessage = readMessage(candidateObject.value);

      if (appMessage) {
        fieldErrors.app = fieldErrors.app || appMessage;
      }

      if (valueMessage) {
        fieldErrors.value = fieldErrors.value || valueMessage;
      }
    }
  });

  return fieldErrors;
};