import { normalizeAccountType } from "@/features/auth/services/authService";
import { readStoredAuthState } from "@/features/auth/services/authStorage";

export type AccountType = "USER" | "CLIENT" | "MODEL" | "ADMIN" | "SUPER_ADMIN";

type AuthState = {
  accountType: AccountType | null;
  isAuthenticated: boolean;
};

export const COUNTRY_STORAGE_KEY = "catalogId";
export const AGE_STORAGE_KEY = "isAdult";

const readStorageValue = (key: string) => {
  const value = localStorage.getItem(key)?.trim();

  if (!value) {
    return null;
  }

  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "null" || normalizedValue === "undefined") {
    return null;
  }

  return value;
};

export const readSelectedCountry = () => readStorageValue(COUNTRY_STORAGE_KEY);

export const hasSelectedCountry = () => readSelectedCountry() !== null;

export const isAdultConfirmed = () => readStorageValue(AGE_STORAGE_KEY) === "true";

export const persistSelectedCountry = (catalogId: string) => {
  localStorage.setItem(COUNTRY_STORAGE_KEY, catalogId.trim());
  localStorage.removeItem(AGE_STORAGE_KEY);
};

export const persistAdultConfirmation = () => {
  localStorage.setItem(AGE_STORAGE_KEY, "true");
};

export const readAuthState = (): AuthState => {
  const { hasToken, hasSessionFlag, accountType } = readStoredAuthState();

  return {
    isAuthenticated: hasToken || hasSessionFlag,
    accountType: normalizeAccountType(accountType) as AccountType | null,
  };
};

export const resolveInitialPath = () => {
  return "/select-country";
};