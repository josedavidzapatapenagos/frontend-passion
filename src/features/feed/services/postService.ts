import apiClient from '@/services/apiClient';

type RawContactMethod = {
  app?: string;
  value?: string;
};

type RawMediaItem = {
  id?: string;
  contentUrl?: string;
  url?: string;
  contentType?: 'IMAGE' | 'VIDEO' | string;
  mediaType?: 'IMAGE' | 'VIDEO' | string;
  type?: 'IMAGE' | 'VIDEO' | string;
};

type RawModelProfile = {
  id?: string;
  modelId?: string;
  alias?: string;
  modelAlias?: string;
  displayName?: string;
  name?: string;
  profilePhotoUrl?: string;
  avatarUrl?: string;
  countryIsoCode?: string;
  countryCode?: string;
  contactMethods?: RawContactMethod[];
  vipAreaId?: string | number | null;
  vip_area_id?: string | number | null;
  vipArea?: {
    id?: string | number | null;
    vipAreaId?: string | number | null;
    vip_area_id?: string | number | null;
  };
  vip_area?: {
    id?: string | number | null;
    vipAreaId?: string | number | null;
    vip_area_id?: string | number | null;
  };
};

type RawPostDetail = {
  id?: string;
  modelId?: string;
  title?: string;
  description?: string;
  modelAlias?: string;
  alias?: string;
  coverPhotoUrl?: string;
  coverPhotoURL?: string;
  price?: {
    amount?: number;
    currency?: string;
  };
  isOnline?: boolean;
  hasPremium?: boolean;
  premium?: boolean;
  isVip?: boolean;
  vip?: boolean | { active?: boolean; status?: string };
  vipStatus?: string;
  hasVipArea?: boolean;
  status?: string;
  services?: string[];
  virtualServices?: string[];
  modelContents?: RawMediaItem[];
  postContents?: RawMediaItem[];
  media?: RawMediaItem[];
  gallery?: string[];
  photos?: string[];
  images?: string[];
  modelContactMethods?: RawContactMethod[];
  modelContactMethodResponses?: RawContactMethod[];
  contactMethods?: RawContactMethod[];
  whatsapp?: string;
  whatsappNumber?: string;
  contactPhone?: string;
  phone?: string;
  vipAreaId?: string | number | null;
  vip_area_id?: string | number | null;
  vipArea?: {
    id?: string | number | null;
    vipAreaId?: string | number | null;
    vip_area_id?: string | number | null;
  };
  vip_area?: {
    id?: string | number | null;
    vipAreaId?: string | number | null;
    vip_area_id?: string | number | null;
  };
  modelProfile?: RawModelProfile;
  profile?: RawModelProfile;
  model?: RawModelProfile;
};

export interface PostDetail {
  id: string;
  catalogId?: string;
  modelAlias: string;
  title: string;
  description: string;
  coverPhotoUrl: string;
  price: {
    amount: number;
    currency: string;
  };
  modelContents: {
    id: string;
    contentUrl: string;
    contentType: 'IMAGE' | 'VIDEO';
  }[];
  modelContactMethods: {
    app: string;
    value: string;
  }[];
  services: string[];
  hasPremium: boolean;
  isOnline: boolean;
  vipStatus?: string;
  vipAreaId?: string | null;
  modelProfile?: {
    id: string;
    alias: string;
    displayName: string;
    profilePhotoUrl: string;
    countryCode: string;
    vipAreaId: string | null;
  };
}

const VIP_ID_KEYS = new Set(["vipareaid", "vip_area_id"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readNullableString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

const findVipAreaIdDeep = (value: unknown, depth = 0): string | null => {
  if (!value || typeof value !== 'object' || depth > 5) {
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

  for (const [rawKey, rawFieldValue] of entries) {
    const normalizedKey = rawKey.toLowerCase();
    if (!VIP_ID_KEYS.has(normalizedKey)) {
      continue;
    }

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

const resolveVipAreaId = (rawPost: RawPostDetail): string | null => {
  const profile = rawPost.modelProfile || rawPost.profile || rawPost.model;
  const vipFromModelId = rawPost.hasVipArea ? readNullableString(rawPost.modelId) : null;

  return (
    readNullableString(rawPost.vipAreaId) ||
    readNullableString(rawPost.vip_area_id) ||
    readNullableString(rawPost.vipArea?.id) ||
    readNullableString(rawPost.vipArea?.vipAreaId) ||
    readNullableString(rawPost.vipArea?.vip_area_id) ||
    readNullableString(rawPost.vip_area?.id) ||
    readNullableString(rawPost.vip_area?.vipAreaId) ||
    readNullableString(rawPost.vip_area?.vip_area_id) ||
    readNullableString(profile?.vipAreaId) ||
    readNullableString(profile?.vip_area_id) ||
    readNullableString(profile?.vipArea?.id) ||
    readNullableString(profile?.vipArea?.vipAreaId) ||
    readNullableString(profile?.vipArea?.vip_area_id) ||
    readNullableString(profile?.vip_area?.id) ||
    readNullableString(profile?.vip_area?.vipAreaId) ||
    readNullableString(profile?.vip_area?.vip_area_id) ||
    vipFromModelId ||
    findVipAreaIdDeep(rawPost)
  );
};

const normalizeContactMethods = (rawPost: RawPostDetail): { app: string; value: string }[] => {
  const profile = rawPost.modelProfile || rawPost.profile || rawPost.model;
  const baseMethods = [
    ...(rawPost.modelContactMethods || []),
    ...(rawPost.modelContactMethodResponses || []),
    ...(rawPost.contactMethods || []),
    ...(profile?.contactMethods || []),
  ];

  const normalizedMethods = baseMethods
    .filter((method) => Boolean(method?.app && method?.value))
    .map((method) => ({
      app: String(method.app).toUpperCase(),
      value: String(method.value),
    }));

  const whatsappValue =
    rawPost.whatsapp ||
    rawPost.whatsappNumber ||
    rawPost.contactPhone ||
    rawPost.phone;

  if (whatsappValue && !normalizedMethods.some((method) => method.app === 'WHATSAPP')) {
    normalizedMethods.push({
      app: 'WHATSAPP',
      value: whatsappValue,
    });
  }

  return normalizedMethods;
};

const normalizeModelContents = (
  rawPost: RawPostDetail
): {
  id: string;
  contentUrl: string;
  contentType: 'IMAGE' | 'VIDEO';
}[] => {
  const objectCollections = [
    ...(rawPost.modelContents || []),
    ...(rawPost.postContents || []),
    ...(rawPost.media || []),
  ];

  const normalizedObjects = objectCollections
    .map((item, index) => {
      const contentUrl = item.contentUrl || item.url;
      if (!contentUrl) {
        return null;
      }

      const rawType = (item.contentType || item.mediaType || item.type || 'IMAGE')
        .toString()
        .toUpperCase();
      const contentType = rawType.includes('VIDEO') ? 'VIDEO' : 'IMAGE';

      return {
        id: item.id || `${contentType.toLowerCase()}-${index}-${contentUrl}`,
        contentUrl,
        contentType,
      };
    })
    .filter((item): item is { id: string; contentUrl: string; contentType: 'IMAGE' | 'VIDEO' } => Boolean(item));

  const stringCollections = [
    rawPost.coverPhotoUrl || rawPost.coverPhotoURL || '',
    ...(rawPost.gallery || []),
    ...(rawPost.photos || []),
    ...(rawPost.images || []),
  ].filter(Boolean) as string[];

  const normalizedStrings = stringCollections.map((url, index) => ({
    id: `image-${index}-${url}`,
    contentUrl: url,
    contentType: 'IMAGE' as const,
  }));

  const merged = [...normalizedObjects, ...normalizedStrings];
  const seenUrls = new Set<string>();

  return merged.filter((item) => {
    if (!item.contentUrl || seenUrls.has(item.contentUrl)) {
      return false;
    }

    seenUrls.add(item.contentUrl);
    return true;
  });
};

const normalizeModelProfile = (rawPost: RawPostDetail) => {
  const profile = rawPost.modelProfile || rawPost.profile || rawPost.model;
  if (!profile && !rawPost.modelAlias && !rawPost.alias) {
    return undefined;
  }

  const alias =
    profile?.alias ||
    profile?.modelAlias ||
    rawPost.modelAlias ||
    rawPost.alias ||
    '';

  return {
    id: profile?.id || profile?.modelId || '',
    alias,
    displayName: profile?.displayName || profile?.name || alias,
    profilePhotoUrl: profile?.profilePhotoUrl || profile?.avatarUrl || '',
    countryCode: profile?.countryIsoCode || profile?.countryCode || '',
    vipAreaId: resolveVipAreaId(rawPost),
  };
};

const normalizeVipState = (rawPost: RawPostDetail): { hasPremium: boolean; vipStatus?: string } => {
  const vipPayload = rawPost.vip;
  const nestedVipActive = typeof vipPayload === 'object' ? Boolean(vipPayload?.active) : false;
  const nestedVipStatus = typeof vipPayload === 'object' ? vipPayload?.status : undefined;

  const hasPremium =
    Boolean(rawPost.hasPremium) ||
    Boolean(rawPost.premium) ||
    Boolean(rawPost.isVip) ||
    nestedVipActive ||
    vipPayload === true;

  const statusValue = rawPost.vipStatus || nestedVipStatus || rawPost.status;

  return {
    hasPremium,
    vipStatus: statusValue,
  };
};

const unwrapPostDetailPayload = (rawResponse: unknown): RawPostDetail | null => {
  const levelOne = (rawResponse as { data?: unknown })?.data;

  if (levelOne && typeof levelOne === 'object') {
    const levelTwo = (levelOne as { data?: unknown })?.data;
    if (levelTwo && typeof levelTwo === 'object') {
      return levelTwo as RawPostDetail;
    }

    return levelOne as RawPostDetail;
  }

  if (rawResponse && typeof rawResponse === 'object') {
    return rawResponse as RawPostDetail;
  }

  return null;
};

const normalizePostDetail = (rawPost: RawPostDetail): PostDetail => {
  const modelProfile = normalizeModelProfile(rawPost);
  const vip = normalizeVipState(rawPost);

  return {
    id: rawPost.id || '',
    catalogId: (rawPost as RawPostDetail & { catalogId?: string }).catalogId || '',
    modelAlias: modelProfile?.alias || rawPost.modelAlias || rawPost.alias || '',
    title: rawPost.title || '',
    description: rawPost.description || '',
    coverPhotoUrl: rawPost.coverPhotoUrl || rawPost.coverPhotoURL || '',
    price: {
      amount: rawPost.price?.amount || 0,
      currency: rawPost.price?.currency || 'USD',
    },
    modelContents: normalizeModelContents(rawPost),
    modelContactMethods: normalizeContactMethods(rawPost),
    services: rawPost.services || rawPost.virtualServices || [],
    hasPremium: vip.hasPremium,
    isOnline: Boolean(rawPost.isOnline),
    vipStatus: vip.vipStatus,
    vipAreaId: resolveVipAreaId(rawPost),
    modelProfile,
  };
};

export const getPostById = async (
  postId: string,
  options?: {
    isPublicRequest?: boolean;
  }
): Promise<PostDetail | null> => {
  try {
    const forcePublicRequest = options?.isPublicRequest ?? true;

    const response = await apiClient.get(`/v1/posts/${postId}`, {
      // For anonymous users we force a public request without credentials.
      withCredentials: forcePublicRequest ? false : undefined,
    });

    const rawPost = unwrapPostDetailPayload(response.data);
    if (!rawPost) {
      return null;
    }

    return normalizePostDetail(rawPost);
  } catch (error: unknown) {
    const apiError = error as {
      response?: {
        status?: number;
      };
    };

    if (apiError.response?.status !== 401 && apiError.response?.status !== 404) {
      console.error("Error al obtener detalle:", error);
    }

    return null;
  }
};