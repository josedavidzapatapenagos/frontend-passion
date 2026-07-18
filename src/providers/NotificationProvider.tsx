import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { NotificationContainer } from "../components/NotificationContainer";
import { NotificationContext } from "../hooks/useNotification";
import { notificationService, type NotificationPayload } from "../services/notificationService";
import type { NotificationItem } from "../components/NotificationCard";

type Props = {
  children: ReactNode;
};

const nextNotificationId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildItem = (payload: NotificationPayload): NotificationItem => ({
  id: nextNotificationId(),
  ...payload,
  tone: payload.tone || "info",
});

export const NotificationProvider = ({ children }: Props) => {
  const [queue, setQueue] = useState<NotificationItem[]>([]);
  const [current, setCurrent] = useState<NotificationItem | null>(null);

  const enqueue = useCallback((payload: NotificationPayload) => {
    setQueue((currentQueue) => [...currentQueue, buildItem(payload)]);
  }, []);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((event) => {
      if (event.kind === "notify") {
        enqueue(event.payload);
      }
    });

    return unsubscribe;
  }, [enqueue]);

  useEffect(() => {
    if (current || queue.length === 0) {
      return;
    }

    const [next, ...remaining] = queue;
    setCurrent(next);
    setQueue(remaining);
  }, [current, queue]);

  const contextValue = useMemo(
    () => ({
      notify: (payload: NotificationPayload) => notificationService.notify(payload),
      success: (payload: Omit<NotificationPayload, "tone">) => notificationService.success(payload),
      info: (payload: Omit<NotificationPayload, "tone">) => notificationService.info(payload),
      warning: (payload: Omit<NotificationPayload, "tone">) => notificationService.warning(payload),
      error: (payload: Omit<NotificationPayload, "tone">) => notificationService.error(payload),
    }),
    []
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        current={current}
        onExited={() => {
          setCurrent(null);
        }}
      />
    </NotificationContext.Provider>
  );
};
