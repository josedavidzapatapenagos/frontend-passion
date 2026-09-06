import { Navigate, Outlet } from "react-router-dom";
import { useModelAccess } from "@/features/account/hooks/useModelAccess";

export const ProfileGuard = () => {
  const { accountApproved, hasCompletedOnboarding, hasResolvedAccess, isLoading } = useModelAccess();

  if (!hasResolvedAccess && isLoading) {
    return null;
  }

  if (!accountApproved) {
    return <Navigate to="/account" replace />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};
