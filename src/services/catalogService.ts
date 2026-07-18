import apiClient from '../api/apiClient';

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
}

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