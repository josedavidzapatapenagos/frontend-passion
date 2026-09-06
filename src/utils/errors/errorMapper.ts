import axios from "axios";

type ErrorMapperOptions = {
  defaultMessage?: string;
  badRequestMessage?: string;
  unauthorizedMessage?: string;
  forbiddenMessage?: string;
  notFoundMessage?: string;
  conflictMessage?: string;
  allowBackendMessageForBadRequest?: boolean;
  allowBackendMessageForConflict?: boolean;
  allowBackendMessageForForbidden?: boolean;
};

const TECHNICAL_PATTERNS = [
  "axioserror",
  "network error",
  "unauthorized",
  "forbidden",
  "stacktrace",
  "exception",
  "java.",
  "org.springframework",
  "trace",
];

export const getBackendErrorMessage = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const data = error.response?.data as
    | {
        message?: string;
        messages?: string[];
        error?: string;
      }
    | undefined;

  return data?.messages?.[0] || data?.message || data?.error;
};

const isTechnicalMessage = (message?: string): boolean => {
  if (!message) {
    return true;
  }

  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (normalized.startsWith("{") || normalized.startsWith("[")) {
    return true;
  }

  return TECHNICAL_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const getSafeBackendMessage = (error: unknown): string | undefined => {
  const message = getBackendErrorMessage(error);
  return isTechnicalMessage(message) ? undefined : message;
};

export const getUserFacingErrorMessage = (
  error: unknown,
  options: ErrorMapperOptions = {}
): string => {
  const {
    defaultMessage = "Ocurrió un problema inesperado.",
    badRequestMessage = "Revisa la información ingresada e inténtalo nuevamente.",
    unauthorizedMessage = "La sesión ha expirado.",
    forbiddenMessage = "No tienes permisos para realizar esta acción.",
    notFoundMessage = "El recurso solicitado ya no existe.",
    conflictMessage = "No fue posible completar la acción porque el estado cambió.",
    allowBackendMessageForBadRequest = true,
    allowBackendMessageForConflict = true,
    allowBackendMessageForForbidden = false,
  } = options;

  if (!axios.isAxiosError(error)) {
    return defaultMessage;
  }

  if (!error.response) {
    return "No pudimos comunicarnos con el servidor. Verifica tu conexión e inténtalo nuevamente.";
  }

  const status = error.response.status;
  const backendMessage = getSafeBackendMessage(error);

  if (status === 400) {
    return allowBackendMessageForBadRequest && backendMessage ? backendMessage : badRequestMessage;
  }

  if (status === 401) {
    return unauthorizedMessage;
  }

  if (status === 403) {
    return allowBackendMessageForForbidden && backendMessage ? backendMessage : forbiddenMessage;
  }

  if (status === 404) {
    return notFoundMessage;
  }

  if (status === 409) {
    return allowBackendMessageForConflict && backendMessage ? backendMessage : conflictMessage;
  }

  if (status >= 500) {
    return "Ocurrió un problema inesperado.";
  }

  return backendMessage || defaultMessage;
};