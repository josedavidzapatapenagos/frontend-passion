import apiClient from "@/services/apiClient";

type PremiumCatalogEnvelope = {
  data?: unknown;
  message?: string;
  at?: string;
  status?: string;
};

export type PremiumCatalogState = {
  id: string;
  postId: string | null;
  vipAreaId: string | null;
  modelName: string;
  modelAlias: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  expiresAt: string | null;
};

export type PremiumCatalogStatesResponse = {
  catalogId: string;
  catalogName: string;
  currency: string;
  activeStates: PremiumCatalogState[];
  totalCount: number;
};

type GenericRecord = Record<string, unknown>;

const readString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const readNullableString = (...values: unknown[]): string | null => {
  const value = readString(...values);
  return value || null;
};

const readNestedObject = (value: unknown): GenericRecord | null => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as GenericRecord)
    : null;
};

const normalizeMediaType = (...values: unknown[]): "IMAGE" | "VIDEO" => {
  const rawType = readString(...values).toUpperCase();
  return rawType.includes("VIDEO") ? "VIDEO" : "IMAGE";
};

const normalizePremiumCatalogState = (entry: unknown, index: number): PremiumCatalogState | null => {
  const state = readNestedObject(entry);
  if (!state) {
    return null;
  }

  const modelProfile = readNestedObject(state.modelProfile) || readNestedObject(state.profile) || readNestedObject(state.model);
  const vipArea = readNestedObject(state.vipArea) || readNestedObject(state.vip_area);
  const post = readNestedObject(state.post);

  const mediaUrl = readString(
    state.mediaUrl,
    state.media_url,
    state.contentUrl,
    state.content_url,
    state.coverPhotoUrl,
    state.cover_photo_url,
    post?.coverPhotoUrl,
    post?.cover_photo_url,
    modelProfile?.profilePhotoUrl,
    modelProfile?.avatarUrl
  );

  if (!mediaUrl) {
    return null;
  }

  const modelAlias = readString(
    modelProfile?.alias,
    modelProfile?.modelAlias,
    state.modelAlias,
    state.model_alias,
    state.alias
  );

  const modelName = readString(
    modelProfile?.displayName,
    modelProfile?.name,
    state.displayName,
    state.display_name,
    state.modelName,
    state.model_name,
    modelAlias,
    state.title,
    post?.title,
    `Premium ${index + 1}`
  );

  return {
    id: readString(state.id, state.stateId, state.state_id, `${modelName}-${index}`),
    postId: readNullableString(state.postId, state.post_id, post?.id),
    vipAreaId: readNullableString(
      state.vipAreaId,
      state.vip_area_id,
      vipArea?.id,
      vipArea?.vipAreaId,
      vipArea?.vip_area_id,
      modelProfile?.vipAreaId,
      modelProfile?.vip_area_id,
      post?.vipAreaId,
      post?.vip_area_id
    ),
    modelName,
    modelAlias,
    title: readString(state.title, post?.title, "Estado premium activo"),
    description: readString(
      state.description,
      post?.description,
      `Descubre el contenido premium activo de ${modelName}.`
    ),
    mediaUrl,
    mediaType: normalizeMediaType(
      state.premiumStateMediaType,
      state.premumStateMediaType,
      state.mediaType,
      state.media_type,
      state.contentType,
      state.content_type
    ),
    profilePhotoUrl: readString(
      modelProfile?.profilePhotoUrl,
      modelProfile?.avatarUrl,
      modelProfile?.photoUrl,
      state.profilePhotoUrl,
      state.profile_photo_url,
      state.avatarUrl,
      state.avatar_url,
      mediaUrl
    ),
    coverPhotoUrl: readString(state.coverPhotoUrl, state.cover_photo_url, post?.coverPhotoUrl, post?.cover_photo_url, mediaUrl),
    expiresAt: readNullableString(state.expiresAt, state.expires_at),
  };
};

const normalizePremiumCatalogResponse = (payload: unknown): PremiumCatalogStatesResponse => {
  const envelope = readNestedObject(payload) as PremiumCatalogEnvelope | null;
  const levelOne = envelope?.data;
  const data = readNestedObject(readNestedObject(levelOne)?.data ?? levelOne) || {};

  const rawStates = Array.isArray(data.activeStates)
    ? data.activeStates
    : Array.isArray(data.active_states)
      ? data.active_states
      : [];

  const activeStates = rawStates
    .map((entry, index) => normalizePremiumCatalogState(entry, index))
    .filter((entry): entry is PremiumCatalogState => Boolean(entry));

  return {
    catalogId: readString(data.catalogId, data.catalog_id),
    catalogName: readString(data.catalogName, data.catalog_name),
    currency: readString(data.currency, "USD"),
    activeStates,
    totalCount:
      typeof data.totalCount === "number"
        ? data.totalCount
        : typeof data.total_count === "number"
          ? data.total_count
          : activeStates.length,
  };
};

export const getCatalogPremiumStates = async (catalogId: string): Promise<PremiumCatalogStatesResponse> => {
  const normalizedCatalogId = catalogId.trim();

  if (!normalizedCatalogId) {
    throw new Error("catalogId is required");
  }

  const response = await apiClient.get<PremiumCatalogEnvelope>(
    `/v1/models/premium/posts/states/catalog/${normalizedCatalogId}`,
    {
      headers: {
        accept: "*/*",
      },
      withCredentials: false,
    }
  );

  return normalizePremiumCatalogResponse(response.data);
};