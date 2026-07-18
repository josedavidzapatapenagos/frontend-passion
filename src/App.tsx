import { useEffect } from "react";
import { useSession } from "./hooks/useSession";
import { setSessionExpiredEmissionEnabled } from "./api/apiClient";
import { AppRoutes } from "./routers/AppRoutes";
import {
  AUTH_SESSION_KEY,
  clearStoredAuth,
  validateStoredSession,
} from "./services/authService";

function App() {
  const { expireSession } = useSession();

  useEffect(() => {
    let isCancelled = false;

    const bootstrapAuth = async (silentOnInvalid: boolean) => {
      const hasToken = !!localStorage.getItem("token");
      const hasSessionFlag = localStorage.getItem(AUTH_SESSION_KEY) === "true";
      const hasSession = hasToken || hasSessionFlag;

      if (!hasSession) {
        return;
      }

      const isSessionValid = await validateStoredSession();

      if (isCancelled) {
        return;
      }

      if (!isSessionValid) {
        if (silentOnInvalid) {
          clearStoredAuth();
          window.dispatchEvent(new Event("auth-changed"));
          return;
        }

        expireSession();
      }
    };

    void (async () => {
      await bootstrapAuth(true);

      if (!isCancelled) {
        setSessionExpiredEmissionEnabled(true);
      }
    })();

    const revalidateOnFocus = () => {
      void bootstrapAuth(false);
    };

    window.addEventListener("focus", revalidateOnFocus);

    return () => {
      isCancelled = true;
      setSessionExpiredEmissionEnabled(false);
      window.removeEventListener("focus", revalidateOnFocus);
    };
  }, [expireSession]);

  return <AppRoutes />;
}

export default App;