import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import type { AlertTone } from "@/components/ui/AlertTone";

type Props = {
  title: string;
  description: ReactNode;
  tone?: AlertTone;
  actionLabel?: string;
  onAction?: () => void;
};

export const InfoCard = ({ title, description, tone = "info", actionLabel, onAction }: Props) => {
  return (
    <Alert
      tone={tone}
      title={title}
      description={description}
      actions={actionLabel && onAction ? [{ label: actionLabel, onClick: onAction, variant: "secondary" }] : undefined}
    />
  );
};