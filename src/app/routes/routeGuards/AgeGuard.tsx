import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdultConfirmed } from "@/features/onboarding/services/navigationFlow";

export const AgeGuard = () => {
  const location = useLocation();

  if (isAdultConfirmed()) {
    return <Outlet />;
  }

  return (
    <Navigate
      to="/age-verification"
      replace
      state={{ from: location.pathname }}
    />
  );
};
