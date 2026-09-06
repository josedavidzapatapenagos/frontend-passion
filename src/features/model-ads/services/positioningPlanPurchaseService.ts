import apiClient from "@/services/apiClient";
import type { ApiEnvelope } from "@/features/model-ads/types/modelAds";

type PositioningPurchaseData = string | {
  checkoutUrl?: unknown;
  checkout_url?: unknown;
  paymentUrl?: unknown;
  payment_url?: unknown;
  url?: unknown;
};

const readCheckoutUrl = (data: PositioningPurchaseData): string => {
  if (typeof data === "string") {
    return data.trim();
  }

  const value = data.checkoutUrl ?? data.checkout_url ?? data.paymentUrl ?? data.payment_url ?? data.url;
  return typeof value === "string" ? value.trim() : "";
};

export type PositioningPlanPurchaseAttempt = {
  idempotencyKey: string;
  execute: () => Promise<string>;
};

const postPositioningPlanPurchase = async (
  postId: string,
  positioningPlanId: string,
  idempotencyKey: string,
): Promise<string> => {
  const response = await apiClient.post<ApiEnvelope<PositioningPurchaseData>>(
    `/v1/models/posts/${postId}/positioning-plan/purchases`,
    {
      plan_id: positioningPlanId,
      idempotency_key: idempotencyKey,
    },
    { headers: { accept: "*/*" } },
  );

  return readCheckoutUrl(response.data.data);
};

export const createPositioningPlanPurchaseAttempt = (
  postId: string,
  positioningPlanId: string,
): PositioningPlanPurchaseAttempt => {
  const idempotencyKey = crypto.randomUUID();

  return {
    idempotencyKey,
    execute: () => postPositioningPlanPurchase(postId, positioningPlanId, idempotencyKey),
  };
};