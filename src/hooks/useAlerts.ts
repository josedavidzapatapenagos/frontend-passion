import type { AlertTone } from "../components/alertTone";

type AlertConfig = {
  title: string;
  description?: string;
  tone: AlertTone;
};

export const useAlerts = () => {
  const build = (tone: AlertTone, title: string, description?: string): AlertConfig => ({
    tone,
    title,
    description,
  });

  return {
    success: (title: string, description?: string) => build("success", title, description),
    info: (title: string, description?: string) => build("info", title, description),
    warning: (title: string, description?: string) => build("warning", title, description),
    error: (title: string, description?: string) => build("error", title, description),
  };
};