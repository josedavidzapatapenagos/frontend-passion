import { normalizeAccountType } from "@/features/auth/services/authService";
import { readStoredAuthState } from "@/features/auth/services/authStorage";

export const useAuth = () => {
  const { accountType, hasToken, hasSessionFlag } = readStoredAuthState();
  const role = normalizeAccountType(accountType);

  return {
    role,
    isAuthenticated: hasToken || hasSessionFlag,
    isUser: role === "USER",
    isClient: role === "CLIENT",
    isModel: role === "MODEL",
    isAdmin: role === "ADMIN",
    isSuperAdmin: role === "SUPER_ADMIN",
  };
};
