import { createContext, useContext } from "react";
import type { NotificationPayload } from "../services/notificationService";

export type NotificationContextValue = {
  notify: (payload: NotificationPayload) => void;
  success: (payload: Omit<NotificationPayload, "tone">) => void;
  info: (payload: Omit<NotificationPayload, "tone">) => void;
  warning: (payload: Omit<NotificationPayload, "tone">) => void;
  error: (payload: Omit<NotificationPayload, "tone">) => void;
};

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider.");
  }

  return context;
};
