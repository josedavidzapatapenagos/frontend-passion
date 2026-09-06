export type Money = {
  amount: number;
  currency: string;
};

export type VipAreaInfo = {
  id: string;
  alias: string;
  coverPhotoUrl: string | null;
  description: string;
  monthlyPrice: Money;
  photoCount: number;
  videoCount: number;
  unlockableCount: number;
};

export type VipMediaType = "PHOTO" | "VIDEO" | string;
export type VipAccessType = "NORMAL" | "UNLOCKABLE" | string;
export type VipPublishType = "NORMAL" | "UNLOCKABLE";

export type VipAreaContent = {
  id: string;
  mediaType: VipMediaType;
  accessType: VipAccessType;
  description: string | null;
  contentUrl: string;
  unlockPrice: Money | null;
  unlocked: boolean;
  createdAt: string;
};

export type VipAreaApiResponse = {
  data: VipAreaInfo;
  message?: string;
  at?: string;
  status?: string;
};

export type VipAreaContentsApiResponse = {
  data: VipAreaContent[];
  message?: string;
  at?: string;
  status?: string;
};

export type VipSubscriptionCheckout = {
  paymentId: string;
  reference: string;
  status: string;
  checkoutUrl: string;
  externalReference: string;
  vipAreaId: string;
  createdAt: string;
};

export type VipSubscriptionCheckoutApiResponse = {
  data: VipSubscriptionCheckout;
  message?: string;
  at?: string;
  status?: string;
};

export type VipActionApiResponse<TData = unknown> = {
  data?: TData;
  message?: string;
  at?: string;
  status?: string;
};

export type VipAreaErrorCode = "FORBIDDEN" | "NOT_FOUND" | "NETWORK" | "UNKNOWN";

export type VipAreaError = {
  code: VipAreaErrorCode;
  message: string;
  status?: number;
  backendMessage?: string;
};
