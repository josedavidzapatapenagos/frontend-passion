import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasSelectedCountry } from "@/features/onboarding/services/navigationFlow";

export const CountryGuard = () => {
  const location = useLocation();

  if (hasSelectedCountry()) {
    return <Outlet />;
  }

  return (
    <Navigate
      to="/select-country"
      replace
      state={{ from: location.pathname }}
    />
  );
};
