import apiClient from '@/services/apiClient';

type RawContactMethod = {
  app?: string;
  value?: string;
};

type RawPost = {
  id?: string;
  title?: string;
  description?: string;
  coverPhotoUrl?: string;
  coverPhotoURL?: string;
  price?: {
    amount?: number;
    currency?: string;
  };
  isOnline?: boolean;
  hasPremium?: boolean;
  services?: string[];
  modelContents?: {
    id?: string;
    contentUrl?: string;
    url?: string;
    contentType?: 'IMAGE' | 'VIDEO' | string;
    mediaType?: 'IMAGE' | 'VIDEO' | string;
    type?: 'IMAGE' | 'VIDEO' | string;
  }[];
  postContents?: {
    id?: string;
    contentUrl?: string;
    url?: string;
    contentType?: 'IMAGE' | 'VIDEO' | string;
    mediaType?: 'IMAGE' | 'VIDEO' | string;
    type?: 'IMAGE' | 'VIDEO' | string;
  }[];
  media?: {
    id?: string;
    contentUrl?: string;
    url?: string;
    contentType?: 'IMAGE' | 'VIDEO' | string;
    mediaType?: 'IMAGE' | 'VIDEO' | string;
    type?: 'IMAGE' | 'VIDEO' | string;
  }[];
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
  modelProfile?: {
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
  profile?: {
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
  model?: {
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
};

export interface Post {
  id: string;
  title: string;
  description: string;
  coverPhotoUrl: string;
  price: {
    amount: number;
    currency: string;
  };
  isOnline: boolean;
  hasPremium: boolean;
  services?: string[];
  modelContents?: {
    id: string;
    contentUrl: string;
    contentType: 'IMAGE' | 'VIDEO';
  }[];
  modelContactMethods?: {
    app: string;
    value: string;
  }[];
  vipAreaId?: string | null;
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

const resolveVipAreaId = (rawPost: RawPost): string | null => {
  const profile = rawPost.modelProfile || rawPost.profile || rawPost.model;

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
    findVipAreaIdDeep(rawPost)
  );
};

const extractContactMethods = (rawPost: RawPost): { app: string; value: string }[] => {
  const baseMethods =
    rawPost.modelContactMethods ||
    rawPost.modelContactMethodResponses ||
    rawPost.contactMethods ||
    [];

  const normalizedBaseMethods = baseMethods
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

  if (whatsappValue && !normalizedBaseMethods.some((method) => method.app === 'WHATSAPP')) {
    normalizedBaseMethods.push({
      app: 'WHATSAPP',
      value: whatsappValue,
    });
  }

  return normalizedBaseMethods;
};

const extractModelContents = (
  rawPost: RawPost
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
    ...(rawPost.gallery || []),
    ...(rawPost.photos || []),
    ...(rawPost.images || []),
  ];

  const normalizedStrings = stringCollections.map((url, index) => ({
    id: `image-${index}-${url}`,
    contentUrl: url,
    contentType: 'IMAGE' as const,
  }));

  const merged = [...normalizedObjects, ...normalizedStrings];
  const seenUrls = new Set<string>();

  return merged.filter((item) => {
    if (seenUrls.has(item.contentUrl)) {
      return false;
    }

    seenUrls.add(item.contentUrl);
    return true;
  });
};

const normalizeCatalogPost = (rawPost: RawPost): Post => ({
  id: rawPost.id || '',
  title: rawPost.title || '',
  description: rawPost.description || '',
  coverPhotoUrl: rawPost.coverPhotoUrl || rawPost.coverPhotoURL || '',
  price: {
    amount: rawPost.price?.amount || 0,
    currency: rawPost.price?.currency || 'USD',
  },
  isOnline: Boolean(rawPost.isOnline),
  hasPremium: Boolean(rawPost.hasPremium),
  services: rawPost.services || [],
  modelContents: extractModelContents(rawPost),
  modelContactMethods: extractContactMethods(rawPost),
  vipAreaId: resolveVipAreaId(rawPost),
});

// Añadimos 'page' con valor por defecto 0
export const getCatalogPosts = async (catalogId: string, page: number = 0): Promise<Post[]> => {
  const parseCatalogResponse = (rawResponse: unknown): Post[] => {
    const payload = (rawResponse as { data?: unknown })?.data ?? rawResponse;

    if (Array.isArray(payload)) {
      return payload.map((rawPost) => normalizeCatalogPost(rawPost as RawPost));
    }

    if (Array.isArray((payload as { content?: unknown[] })?.content)) {
      return (payload as { content: RawPost[] }).content.map((rawPost: RawPost) =>
        normalizeCatalogPost(rawPost)
      );
    }

    if (Array.isArray((payload as { data?: { content?: unknown[] } })?.data?.content)) {
      return (payload as { data: { content: RawPost[] } }).data.content.map(
        (rawPost: RawPost) => normalizeCatalogPost(rawPost)
      );
    }

    return [];
  };

  const response = await apiClient.get(`/v1/posts/catalogs/${catalogId}`, {
    params: {
      page,
      size: 15,
    },
    // This endpoint must stay public for anonymous browsing.
    withCredentials: false,
  });

  return parseCatalogResponse(response.data);
};