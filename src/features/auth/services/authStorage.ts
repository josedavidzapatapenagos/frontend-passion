export const AUTH_STORAGE_KEYS = {
  session: "auth_session",
  token: "token",
  accessToken: "accessToken",
  accountName: "accountName",
  accountFullName: "accountFullName",
  accountType: "accountType",
  modelVerificationStatus: "modelVerificationStatus",
} as const;

export type StoredAuthState = {
  token: string | null;
  accountType: string | null;
  accountName: string | null;
  accountFullName: string | null;
  modelVerificationStatus: string | null;
  hasToken: boolean;
  hasSessionFlag: boolean;
  isLogged: boolean;
  isAuthenticatedSession: boolean;
};

export const readStoredAuthState = (): StoredAuthState => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.token);
  const hasSessionFlag = localStorage.getItem(AUTH_STORAGE_KEYS.session) === "true";
  const accountType = localStorage.getItem(AUTH_STORAGE_KEYS.accountType);
  const accountName = localStorage.getItem(AUTH_STORAGE_KEYS.accountName);
  const accountFullName = localStorage.getItem(AUTH_STORAGE_KEYS.accountFullName);
  const modelVerificationStatus = localStorage.getItem(AUTH_STORAGE_KEYS.modelVerificationStatus);

  return {
    token,
    accountType,
    accountName,
    accountFullName,
    modelVerificationStatus,
    hasToken: Boolean(token),
    hasSessionFlag,
    isLogged: Boolean(token || hasSessionFlag),
    isAuthenticatedSession: Boolean(token) && hasSessionFlag,
  };
};

export const clearStoredAuthState = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  localStorage.removeItem(AUTH_STORAGE_KEYS.accountName);
  localStorage.removeItem(AUTH_STORAGE_KEYS.accountFullName);
  localStorage.removeItem(AUTH_STORAGE_KEYS.accountType);
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.modelVerificationStatus);
};