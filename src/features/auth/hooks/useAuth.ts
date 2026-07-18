import { normalizeAccountType } from "../../../services/authService";

export const useAuth = () => {
  const role = normalizeAccountType(localStorage.getItem("accountType"));

  return {
    role,
    isAuthenticated: !!localStorage.getItem("token"),
    isUser: role === "USER",
    isModel: role === "MODEL",
    isAdmin: role === "ADMIN",
    isSuperAdmin: role === "SUPER_ADMIN",
  };
};
