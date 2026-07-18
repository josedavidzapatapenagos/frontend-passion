export type NotificationTone = "success" | "info" | "warning" | "error";

export type NotificationPayload = {
  title: string;
  description?: string;
  tone?: NotificationTone;
  durationMs?: number;
  persistent?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

type NotificationEvent = {
  kind: "notify";
  payload: NotificationPayload;
};

type NotificationListener = (event: NotificationEvent) => void;

const listeners = new Set<NotificationListener>();

const DEFAULT_DURATIONS: Record<NotificationTone, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

const normalizePayload = (payload: NotificationPayload): NotificationPayload => {
  const tone = payload.tone || "info";

  return {
    ...payload,
    tone,
    durationMs: payload.durationMs ?? DEFAULT_DURATIONS[tone],
  };
};

const emit = (event: NotificationEvent) => {
  listeners.forEach((listener) => {
    listener(event);
  });
};

export const notificationService = {
  subscribe(listener: NotificationListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  notify(payload: NotificationPayload) {
    emit({ kind: "notify", payload: normalizePayload(payload) });
  },
  toast(payload: NotificationPayload) {
    emit({ kind: "notify", payload: normalizePayload(payload) });
  },
  success(payload: Omit<NotificationPayload, "tone">) {
    emit({ kind: "notify", payload: normalizePayload({ tone: "success", ...payload }) });
  },
  info(payload: Omit<NotificationPayload, "tone">) {
    emit({ kind: "notify", payload: normalizePayload({ tone: "info", ...payload }) });
  },
  warning(payload: Omit<NotificationPayload, "tone">) {
    emit({ kind: "notify", payload: normalizePayload({ tone: "warning", ...payload }) });
  },
  error(payload: Omit<NotificationPayload, "tone">) {
    emit({ kind: "notify", payload: normalizePayload({ tone: "error", ...payload }) });
  },
};