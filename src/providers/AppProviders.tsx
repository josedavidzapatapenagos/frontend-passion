import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { SessionExpiredModal } from "../components/SessionExpiredModal";
import { ConfirmDialogContext, type ConfirmDialogOptions } from "../hooks/useConfirmDialog";
import { SessionContext } from "../hooks/useSession";
import { NotificationProvider } from "./NotificationProvider";
import { clearStoredAuth } from "../services/authService";
import { SESSION_EXPIRED_EVENT } from "../services/sessionEvents";
import { ModelAccessProvider } from "../features/account/contexts/ModelAccessContext";

type PendingConfirm = ConfirmDialogOptions & {
  resolve: (value: boolean) => void;
};

type Props = {
  children: ReactNode;
};

export const AppProviders = ({ children }: Props) => {
  const navigate = useNavigate();
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsSessionExpired(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const confirmContextValue = useMemo(
    () => ({
      confirm: (options: ConfirmDialogOptions) =>
        new Promise<boolean>((resolve) => {
          setPendingConfirm({ ...options, resolve });
        }),
    }),
    []
  );

  const continueToLogin = useCallback(() => {
    clearStoredAuth();
    window.dispatchEvent(new Event("auth-changed"));
    setIsSessionExpired(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const sessionContextValue = useMemo(
    () => ({
      isSessionExpired,
      expireSession: () => setIsSessionExpired(true),
      continueToLogin,
    }),
    [continueToLogin, isSessionExpired]
  );

  return (
    <NotificationProvider>
      <ModelAccessProvider>
        <ConfirmDialogContext.Provider value={confirmContextValue}>
          <SessionContext.Provider value={sessionContextValue}>
            {children}

            <ConfirmationDialog
              open={Boolean(pendingConfirm)}
              title={pendingConfirm?.title || ""}
              description={pendingConfirm?.description}
              tone={pendingConfirm?.tone}
              confirmLabel={pendingConfirm?.confirmLabel}
              cancelLabel={pendingConfirm?.cancelLabel}
              onCancel={() => {
                pendingConfirm?.resolve(false);
                setPendingConfirm(null);
              }}
              onConfirm={() => {
                pendingConfirm?.resolve(true);
                setPendingConfirm(null);
              }}
            />

            <SessionExpiredModal open={isSessionExpired} onConfirm={continueToLogin} />
          </SessionContext.Provider>
        </ConfirmDialogContext.Provider>
      </ModelAccessProvider>
    </NotificationProvider>
  );
};