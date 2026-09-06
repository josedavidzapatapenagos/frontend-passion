import { Navigate, Outlet, useLocation } from "react-router-dom";
import { readAuthState } from "@/features/onboarding/services/navigationFlow";

export const AuthGuard = () => {
  const location = useLocation();
  const { isAuthenticated, accountType } = readAuthState();

  if (isAuthenticated && accountType) {
    return <Outlet />;
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname }}
    />
  );
};
