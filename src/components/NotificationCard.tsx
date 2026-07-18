import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "./Alert";
import type { NotificationPayload } from "../services/notificationService";

export type NotificationItem = NotificationPayload & {
  id: string;
  tone: "success" | "info" | "warning" | "error";
};

type Props = {
  item: NotificationItem;
  onExited: () => void;
};

const EXIT_ANIMATION_MS = 220;

export const NotificationCard = ({ item, onExited }: Props) => {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      onExited();
    }, EXIT_ANIMATION_MS);
  }, [isClosing, onExited]);

  useEffect(() => {
    if (item.persistent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      close();
    }, item.durationMs || 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [close, item.durationMs, item.persistent]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`pointer-events-auto relative w-full max-w-xl ${
        isClosing
          ? "animate-[notification-out_220ms_ease-in_forwards]"
          : "animate-[notification-in_260ms_cubic-bezier(0.22,1,0.36,1)]"
      }`}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar notificación"
        className="absolute right-3 top-3 z-10 h-8 w-8 rounded-lg border border-white/20 bg-white/10 text-sm font-bold text-white/90 hover:bg-white/20"
      >
        ×
      </button>

      <Alert
        tone={item.tone}
        title={item.title}
        description={item.description}
        actions={
          item.actionLabel && item.onAction
            ? [
                {
                  label: item.actionLabel,
                  onClick: () => {
                    item.onAction?.();
                    close();
                  },
                  variant: "secondary",
                },
              ]
            : undefined
        }
      />
    </div>
  );
};
