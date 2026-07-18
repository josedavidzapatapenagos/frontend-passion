// src/services/authService.ts
import apiClient from "../api/apiClient";

export const AUTH_SESSION_KEY = "auth_session";

export const normalizeAccountType = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value
    .toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");

  if (
    normalized === "USER" ||
    normalized === "MODEL" ||
    normalized === "ADMIN" ||
    normalized === "SUPER_ADMIN"
  ) {
    return normalized;
  }

  return null;
};

export const login = async (email: string, password: string) => {
  return apiClient.post("/v1/auth/login", { email, password });
};

export const verifyEmail = async (token: string) => {
  return apiClient.post("/v1/models/accounts/email/verify", null, {
    params: { token },
  });
};

export const logout = async () => {
  return apiClient.post("/v1/auth/logout");
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem("accountName");
  localStorage.removeItem("accountFullName");
  localStorage.removeItem("accountType");
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("modelVerificationStatus");
};

export const inferAccountTypeFromSession = async (): Promise<string | null> => {
  return normalizeAccountType(localStorage.getItem("accountType"));
};

export const validateStoredSession = async (): Promise<boolean> => {
  const hasToken = Boolean(localStorage.getItem("token"));
  const hasSessionFlag = localStorage.getItem(AUTH_SESSION_KEY) === "true";

  if (!hasToken && !hasSessionFlag) {
    return false;
  }

  const accountType = normalizeAccountType(localStorage.getItem("accountType"));
  if (!accountType) {
    return false;
  }

  // Cookie-based sessions cannot be proactively validated without a token.
  if (!hasToken) {
    return true;
  }

  try {
    if (accountType === "ADMIN" || accountType === "SUPER_ADMIN") {
      await apiClient.get("/v1/admin/identity-verifications/pending", {
        params: { pageNumber: 0, pageSize: 1 },
        headers: { accept: "*/*" },
      });
    } else if (accountType === "MODEL") {
      await apiClient.get("/v1/models/accounts/me", {
        headers: { accept: "*/*" },
      });
    } else {
      // USER cannot be validated against role-specific endpoints without backend role introspection.
      return true;
    }

    return true;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 403 || status === 404 || !status) return true; // Preserva estado en 403/404 o error de red
    if (status === 401) return false;
    return true;
  }
};