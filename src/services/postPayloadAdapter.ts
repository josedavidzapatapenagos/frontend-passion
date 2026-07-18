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

export type RawPostPayload = {
  id?: string;
  title?: string;
  description?: string;
  modelAlias?: string;
  coverPhotoUrl?: string;
  coverPhotoURL?: string;
  price?: {
    amount?: number;
    currency?: string;
  };
  isOnline?: boolean;
  hasPremium?: boolean;
  services?: string[];
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
};

export type NormalizedPostMedia = {
  id: string;
  contentUrl: string;
  contentType: 'IMAGE' | 'VIDEO';
};

export const unwrapApiPayload = (payload: unknown): RawPostPayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const envelope = payload as { data?: unknown };

  if (envelope.data && typeof envelope.data === 'object') {
    return envelope.data as RawPostPayload;
  }

  return payload as RawPostPayload;
};

export const extractModelContents = (rawPost: RawPostPayload): NormalizedPostMedia[] => {
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
    .filter((item): item is NormalizedPostMedia => Boolean(item));

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

export const extractContactMethods = (rawPost: RawPostPayload): { app: string; value: string }[] => {
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

export const resolveCoverPhoto = (
  rawPost: RawPostPayload,
  modelContents: NormalizedPostMedia[]
) =>
  rawPost.coverPhotoUrl ||
  rawPost.coverPhotoURL ||
  modelContents.find((content) => content.contentType === 'IMAGE')?.contentUrl ||
  modelContents[0]?.contentUrl ||
  '';