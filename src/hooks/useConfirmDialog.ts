import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { AlertTone } from "../components/alertTone";

export type ConfirmDialogOptions = {
  title: string;
  description?: ReactNode;
  tone?: AlertTone;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ConfirmDialogContextValue = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

export const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error("useConfirmDialog must be used within AppProviders.");
  }

  return context.confirm;
};