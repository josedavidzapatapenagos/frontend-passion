import apiClient from "@/services/apiClient";
import type { ApiEnvelope } from "@/features/admin-posts/types/adminPosts";

export type PositioningPlanType = "MANUAL" | "AUTOMATIC";

export type PositioningPlan = {
  id: string;
  name: string;
  type: PositioningPlanType | string;
  description: string;
  durationDays: number;
  dailyLimit: number;
  price: number;
  currency: string;
  status: string;
};

export type CreatePositioningPlanPayload = {
  name: string;
  type: PositioningPlanType;
  description: string;
  duration_days: number;
  daily_limit: number;
  price: number;
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

const normalizePlan = (value: unknown): PositioningPlan => {
  const plan = asRecord(value);
  return {
    id: readString(plan.id, plan.planId),
    name: readString(plan.name),
    type: readString(plan.type),
    description: readString(plan.description),
    durationDays: readNumber(plan.durationDays, plan.duration_days),
    dailyLimit: readNumber(plan.dailyLimit, plan.daily_limit),
    price: readNumber(plan.price, plan.priceAmount),
    currency: readString(plan.currency) || "EUR",
    status: readString(plan.status) || "ACTIVE",
  };
};

const readPlans = (value: unknown): PositioningPlan[] => {
  if (Array.isArray(value)) {
    return value.map(normalizePlan).filter((plan) => Boolean(plan.id));
  }

  const payload = asRecord(value);
  const content = Array.isArray(payload.content) ? payload.content : payload.items;
  return Array.isArray(content)
    ? content.map(normalizePlan).filter((plan) => Boolean(plan.id))
    : [];
};

export const getActivePositioningPlans = async (): Promise<PositioningPlan[]> => {
  const response = await apiClient.get<ApiEnvelope<unknown>>("/v1/positioning/plans/actives", {
    withCredentials: false,
    headers: {
      accept: "*/*",
    },
  });
  return readPlans(response.data?.data);
};

export const createPositioningPlan = async (payload: CreatePositioningPlanPayload): Promise<void> => {
  await apiClient.post<ApiEnvelope<unknown>>("/v1/admins/positioning-plans", payload);
};

export const disablePositioningPlan = async (planId: string): Promise<void> => {
  await apiClient.patch<ApiEnvelope<unknown>>(`/v1/admins/positioning-plans/${planId}/disable`);
};