import { useEffect, useMemo, useState } from "react";
import { normalizeAccountType } from "@/features/auth/services/authService";
import { AUTH_STORAGE_KEYS, readStoredAuthState } from "@/features/auth/services/authStorage";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/features/auth/constants/adminPermissions";

export type AccountPermissionsState = {
  role: string | null;
  permissions: AdminPermission[];
  /**
   * False when the session does not expose its permissions (e.g. legacy tokens).
   * Protected functionality stays hidden until permissions are available.
   */
  resolved: boolean;
};

const PERMISSION_CLAIMS = ["permissions", "authorities", "scope", "scp", "roles"] as const;

const toStringList = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value.split(/[\s,]+/).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const candidate = record.authority ?? record.name ?? record.permission;
          return typeof candidate === "string" ? candidate : null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
  }

  return [];
};

const normalizePermission = (value: string) =>
  value.trim().toUpperCase().replace(/^(PERMISSION_|SCOPE_)/, "");

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const readPersistedPermissions = (): string[] | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.accountPermissions);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? toStringList(parsed).map(normalizePermission) : null;
  } catch {
    return null;
  }
};

const readTokenPermissions = (token: string | null): string[] | null => {
  if (!token) return null;

  const claims = decodeJwtPayload(token);
  if (!claims) return null;

  const hasExplicitClaim = Object.prototype.hasOwnProperty.call(claims, "permissions");
  const values = PERMISSION_CLAIMS.flatMap((claim) => toStringList(claims[claim])).map(normalizePermission);
  const knownValues = values.filter((value) => (ADMIN_PERMISSIONS as readonly string[]).includes(value));

  // Generic claims (authorities/roles) often only carry the role; only trust them when they include permissions.
  if (hasExplicitClaim || knownValues.length > 0) {
    return Array.from(new Set(values.filter((value) => !value.startsWith("ROLE_"))));
  }

  return null;
};

export const persistAccountPermissions = (permissions: unknown) => {
  const list = toStringList(permissions).map(normalizePermission);

  if (Array.isArray(permissions) || typeof permissions === "string") {
    localStorage.setItem(AUTH_STORAGE_KEYS.accountPermissions, JSON.stringify(list));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accountPermissions);
  }
};

export const readAccountPermissions = (): AccountPermissionsState => {
  const { token, accountType } = readStoredAuthState();
  const role = normalizeAccountType(accountType);
  const permissions = readPersistedPermissions() ?? readTokenPermissions(token);

  return {
    role,
    permissions: permissions ?? [],
    resolved: permissions !== null,
  };
};

export type PermissionRequirement = {
  /** Any of these permissions grants access. */
  anyOf?: readonly AdminPermission[];
  /** All of these permissions are required. */
  allOf?: readonly AdminPermission[];
};

export const canAccess = (
  state: AccountPermissionsState,
  requirement: PermissionRequirement = {}
): boolean => {
  if (state.role === "SUPER_ADMIN") return true;
  if (state.role !== "ADMIN") return false;

  const { anyOf = [], allOf = [] } = requirement;
  if (anyOf.length === 0 && allOf.length === 0) return true;
  if (!state.resolved) return false;

  const granted = new Set(state.permissions);
  const matchesAny = anyOf.length === 0 || anyOf.some((permission) => granted.has(permission));
  const matchesAll = allOf.every((permission) => granted.has(permission));
  return matchesAny && matchesAll;
};

export const useAccountPermissions = () => {
  const [state, setState] = useState<AccountPermissionsState>(readAccountPermissions);

  useEffect(() => {
    const sync = () => setState(readAccountPermissions());
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      can: (requirement: PermissionRequirement) => canAccess(state, requirement),
      hasPermission: (permission: AdminPermission) => canAccess(state, { allOf: [permission] }),
    }),
    [state]
  );
};
