import { Navigate, Outlet } from "react-router-dom";
import { readAuthState, type AccountType } from "@/features/onboarding/services/navigationFlow";

type AccountTypeGuardProps = {
  allowed: AccountType[];
};

export const AccountTypeGuard = ({ allowed }: AccountTypeGuardProps) => {
  const { accountType } = readAuthState();

  if (accountType && allowed.includes(accountType)) {
    return <Outlet />;
  }

  return <Navigate to="/feed" replace />;
};
