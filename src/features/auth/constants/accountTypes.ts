export const ALLOWED_ACCOUNT_TYPES = [
  "USER",
  "MODEL",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type AllowedAccountType =
  (typeof ALLOWED_ACCOUNT_TYPES)[number];

export const toAllowedAccountType = (
  value: unknown
): AllowedAccountType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toUpperCase() as AllowedAccountType;
  return ALLOWED_ACCOUNT_TYPES.includes(normalized)
    ? normalized
    : null;
};

export const getAccountTypeFromAuthPayload = (
  payload: unknown
): AllowedAccountType | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = (payload as Record<string, unknown>).accountType;
  return toAllowedAccountType(candidate);
};

export const getAuthTokenFromAuthPayload = (
  payload: unknown
): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const token =
    (record.accessToken as string | undefined) ||
    (record.token as string | undefined);
  return typeof token === "string" && token.trim().length > 0
    ? token
    : null;
};

export const getAccountFullNameFromAuthPayload = (
  payload: unknown
): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const fullName =
    (record.accountFullName as string | undefined) ||
    (record.fullName as string | undefined);
  return typeof fullName === "string" && fullName.trim().length > 0
    ? fullName
    : null;
};
