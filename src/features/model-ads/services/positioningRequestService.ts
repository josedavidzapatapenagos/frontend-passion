import apiClient from "@/services/apiClient";
import type { ApiEnvelope } from "@/features/model-ads/types/modelAds";

export type PositioningPlanType = "MANUAL" | "AUTOMATIC";

export type PositioningSource = "MANUAL" | "AUTOMATIC";

export type PositioningRequest = {
  requestId: string;
  status: string;
  source: string;
  requestedAt: string;
  reservedAt: string;
  activatedAt: string;
  cycleId: string;
  cycleStatus: string;
  cycleStartedAt: string;
  cycleEndsAt: string;
};

export type PositioningActivePlan = {
  planName: string;
  planType: string;
  planDurationDays: number;
  planDailyLimit: number;
  priceAmount: number;
  priceCurrency: string;
  startDate: string;
  expirationDate: string;
  availableUses: number;
  consumedUses: number;
  expiredUses: number;
};

export type PositioningHistoryPeriod = "DAY" | "WEEK" | "MONTH";

export type PositioningHistoryEntry = {
  id: string;
  status: string;
  source: string;
  requestedAt: string;
  activatedAt: string;
  startedAt: string;
  endsAt: string;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  typeof value === "object" && value !== null ? value as UnknownRecord : {};

const readString = (...values: unknown[]): string => {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof value === "string" ? value.trim() : "";
};

const readNumber = (...values: unknown[]): number => {
  const value = values.find((candidate) => typeof candidate === "number" && Number.isFinite(candidate));
  return typeof value === "number" ? value : 0;
};

export const getPostPositioningRequest = async (postId: string): Promise<PositioningRequest | null> => {
  const response = await apiClient.get<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/positioning-request`,
    { headers: { accept: "*/*" } },
  );

  if (response.status === 204 || !response.data?.data) {
    return null;
  }

  const request = asRecord(response.data.data);

  return {
    requestId: readString(request.request_id, request.requestId),
    status: readString(request.status),
    source: readString(request.source),
    requestedAt: readString(request.requested_at, request.requestedAt),
    reservedAt: readString(request.reserved_at, request.reservedAt),
    activatedAt: readString(request.activated_at, request.activatedAt),
    cycleId: readString(request.cycle_id, request.cycleId),
    cycleStatus: readString(request.cycle_status, request.cycleStatus),
    cycleStartedAt: readString(request.cycle_started_at, request.cycleStartedAt),
    cycleEndsAt: readString(request.cycle_ends_at, request.cycleEndsAt),
  };
};

export const getPostActivePositioningPlan = async (postId: string): Promise<PositioningActivePlan | null> => {
  const response = await apiClient.get<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/positioning-plan`,
    { headers: { accept: "*/*" } },
  );

  if (response.status === 204 || !response.data?.data) {
    return null;
  }

  const plan = asRecord(response.data.data);

  return {
    planName: readString(plan.plan_name, plan.planName) || "Plan de posicionamiento",
    planType: readString(plan.plan_type, plan.planType),
    planDurationDays: readNumber(plan.plan_duration_days, plan.planDurationDays),
    planDailyLimit: readNumber(plan.plan_daily_limit, plan.planDailyLimit),
    priceAmount: readNumber(plan.price_amount, plan.priceAmount),
    priceCurrency: readString(plan.price_currency, plan.priceCurrency) || "EUR",
    startDate: readString(plan.start_date, plan.startDate),
    expirationDate: readString(plan.expiration_date, plan.expirationDate),
    availableUses: readNumber(plan.available_uses, plan.availableUses),
    consumedUses: readNumber(plan.consumed_uses, plan.consumedUses),
    expiredUses: readNumber(plan.expired_uses, plan.expiredUses),
  };
};

export const getPostPositioningHistory = async (
  postId: string,
  period: PositioningHistoryPeriod,
): Promise<PositioningHistoryEntry[]> => {
  const response = await apiClient.get<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/positioning-history`,
    { headers: { accept: "*/*" }, params: { period } },
  );

  if (response.status === 204 || !Array.isArray(response.data?.data)) {
    return [];
  }

  return response.data.data.map((value, index) => {
    const item = asRecord(value);
    const requestedAt = readString(item.requested_at, item.requestedAt);

    return {
      id: readString(item.request_id, item.requestId) || `${requestedAt}-${index}`,
      status: readString(item.status),
      source: readString(item.source),
      requestedAt,
      activatedAt: readString(item.activated_at, item.activatedAt),
      startedAt: readString(item.started_at, item.startedAt),
      endsAt: readString(item.ends_at, item.endsAt),
    };
  });
};

export type ManualPositioningRequestAttempt = {
  idempotencyKey: string;
  execute: () => Promise<string>;
};

const postManualPositioningRequest = async (postId: string, idempotencyKey: string): Promise<string> => {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    `/v1/models/posts/${postId}/positioning/manual-requests`,
    undefined,
    { headers: { accept: "*/*", "Idempotency-Key": idempotencyKey } },
  );

  return readString(response.data?.message) || "Solicitud de posicionamiento enviada correctamente.";
};

// La clave se genera una sola vez por intento para que los reintentos no dupliquen la solicitud.
export const createManualPositioningRequestAttempt = (postId: string): ManualPositioningRequestAttempt => {
  const idempotencyKey = crypto.randomUUID();

  return {
    idempotencyKey,
    execute: () => postManualPositioningRequest(postId, idempotencyKey),
  };
};