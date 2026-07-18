import { createContext, useContext } from "react";

export type SessionContextValue = {
  isSessionExpired: boolean;
  expireSession: () => void;
  continueToLogin: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within AppProviders.");
  }

  return context;
};