import { STATUS_COLORS } from "@/utils/statusColors";
import { STATUS_ICONS } from "@/utils/statusIcons";
import { STATUS_LABELS } from "@/utils/statusLabels";

export type StatusTone = "success" | "info" | "warning" | "error" | "neutral";

export type StatusMeta = {
  label: string;
  color: StatusTone;
  icon: "check" | "clock" | "pause" | "close" | "info";
  description?: string;
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  ACTIVE: "La publicación está visible para los usuarios.",
  INACTIVE: "La publicación está oculta y puedes reactivarla cuando lo necesites.",
  SUSPENDED: "La publicación está suspendida temporalmente y puedes activarla cuando lo necesites.",
  PENDING_REVIEW: "Nuestro equipo está revisando esta publicación.",
  REJECTED: "Corrige la información indicada y vuelve a enviarla.",
  APPROVED: "La información ya fue aprobada.",
  PENDING: "Nuestro equipo está revisando la información.",
};

export const getStatusMeta = (status?: string | null): StatusMeta => {
  const normalized = status?.trim().toUpperCase();

  if (!normalized) {
    return {
      label: "Actualizando estado",
      color: "neutral",
      icon: "info",
    };
  }

  return {
    label: STATUS_LABELS[normalized] || "Actualizando estado",
    color: STATUS_COLORS[normalized] || "neutral",
    icon: STATUS_ICONS[normalized] || "info",
    description: STATUS_DESCRIPTIONS[normalized],
  };
};