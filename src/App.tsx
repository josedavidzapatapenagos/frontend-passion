import { useEffect } from "react";
import { useSession } from "./hooks/useSession";
import { setSessionExpiredEmissionEnabled } from "@/services/apiClient";
import { AppRoutes } from "@/app/routes/AppRoutes";
import {
  clearStoredAuth,
  validateStoredSession,
} from "@/features/auth/services/authService";
import { readStoredAuthState } from "@/features/auth/services/authStorage";

function App() {
  const { expireSession } = useSession();

  useEffect(() => {
    let isCancelled = false;

    const bootstrapAuth = async (silentOnInvalid: boolean) => {
      const { isLogged } = readStoredAuthState();

      if (!isLogged) {
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