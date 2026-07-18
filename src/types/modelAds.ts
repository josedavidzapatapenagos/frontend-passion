export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  at?: string;
  status?: string;
};

export type ModelContentType = "IMAGE" | "VIDEO";

export type ModelContentItem = {
  id: string;
  contentType: ModelContentType;
  contentUrl: string;
  createdAt: string;
};

export type ModelAdMode = "create" | "edit";

export type ModelAdFormValues = {
  title: string;
  description: string;
  priceAmount: string;
  catalogId: string;
  coverPhotoContentId: string;
  services: string[];
};

export type ModelAdFormErrors = Partial<Record<keyof ModelAdFormValues, string>>;

export type CreateModelPostPayload = {
  title: string;
  description: string;
  coverPhotoContentId: string;
  catalogId: string;
  priceAmount: number;
  services: string[];
};

export type UpdateModelPostPayload = Partial<CreateModelPostPayload>;