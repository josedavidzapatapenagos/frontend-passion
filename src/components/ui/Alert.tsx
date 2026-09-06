import { useEffect } from "react";
import type { ReactNode } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { getAlertToneClasses, type AlertTone } from "@/components/ui/AlertTone";

export type AlertAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type AlertProps = {
  tone?: AlertTone;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: AlertAction[];
  onClose?: () => void;
  autoCloseMs?: number;
  compact?: boolean;
};

const getIconName = (tone: AlertTone) => {
  switch (tone) {
    case "success":
      return "success" as const;
    case "warning":
      return "warning" as const;
    case "error":
      return "error" as const;
    default:
      return "info" as const;
  }
};

export const Alert = ({
  tone = "info",
  title,
  description,
  icon,
  actions,
  onClose,
  autoCloseMs,
  compact = false,
}: AlertProps) => {
  useEffect(() => {
    if (!autoCloseMs || !onClose) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoCloseMs, onClose]);

  const classes = getAlertToneClasses(tone);

  return (
    <div className={`rounded-2xl border px-4 py-4 ${classes.container}`} role="status">
      <div className={`flex gap-3 ${compact ? "items-center" : "items-start"}`}>
        <div className={`mt-0.5 shrink-0 ${classes.icon}`}>{icon || <AppIcon name={getIconName(tone)} />}</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{title}</p>
          {description ? <div className="mt-1 text-sm opacity-90">{description}</div> : null}
          {actions?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={
                    action.variant === "primary"
                      ? "rounded-xl bg-[#FD0083] px-3 py-2 text-sm font-bold text-white hover:opacity-90"
                      : `rounded-xl border px-3 py-2 text-sm font-bold hover:opacity-90 ${classes.secondaryButton}`
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};