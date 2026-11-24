import { Navigate, Outlet } from "react-router-dom";
import {
  canAccess,
  readAccountPermissions,
  type PermissionRequirement,
} from "@/features/auth/services/accountPermissions";

type PermissionGuardProps = PermissionRequirement & {
  redirectTo?: string;
};

export const PermissionGuard = ({ anyOf, allOf, redirectTo = "/account" }: PermissionGuardProps) => {
  if (canAccess(readAccountPermissions(), { anyOf, allOf })) {
    return <Outlet />;
  }

  return <Navigate to={redirectTo} replace />;
};
