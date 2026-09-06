export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  at?: string;
  status?: string;
};

export type MyModelPostStatus = "ACTIVE" | "INACTIVE" | string;

export type MyModelPost = {
  id: string;
  title?: string;
  description?: string;
  status?: MyModelPostStatus;
  isOnline?: boolean;
  rejectionReason?: string;
  catalogId?: string;
  catalogName?: string;
  categoryName?: string;
  createdAt?: string;
  deactivatedAt?: string;
  clickCount?: number;
  hasPremium?: boolean;
  premiumUntil?: string;
  coverPhotoUrl?: string;
  services?: string[];
  price?: {
    amount?: number;
    currency?: string;
  };
};

export type ModelPostStatusAction = "activate" | "deactivate";