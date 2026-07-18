import axios from "axios";
import { AUTH_SESSION_KEY } from "../services/authService";
import { emitSessionExpired } from "../services/sessionEvents";

let canEmitSessionExpired = false;

export const setSessionExpiredEmissionEnabled = (enabled: boolean) => {
  canEmitSessionExpired = enabled;
};

const apiClient = axios.create({
  // In dev, use Vite proxy to avoid browser CORS issues.
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (config.withCredentials === false) {
    return config;
  }

  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hasSessionFlag = localStorage.getItem(AUTH_SESSION_KEY) === "true";
    const hasToken = Boolean(localStorage.getItem("token"));
    // Only show session-expired when we have a confirmed authenticated context.
    const hasAuthenticatedSession = hasToken && hasSessionFlag;

    if (status === 401 && hasAuthenticatedSession && canEmitSessionExpired) {
      emitSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default apiClient;