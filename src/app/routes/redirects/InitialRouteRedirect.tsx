import { Navigate } from "react-router-dom";
import { resolveInitialPath } from "@/features/onboarding/services/navigationFlow";

export const InitialRouteRedirect = () => {
  return <Navigate to={resolveInitialPath()} replace />;
};
