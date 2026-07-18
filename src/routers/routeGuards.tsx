import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useModelAccess } from "../features/account/hooks/useModelAccess";
import {
  type AccountType,
  hasSelectedCountry,
  isAdultConfirmed,
  readAuthState,
  resolveInitialPath,
} from "../services/navigationFlow";

type AccountTypeGuardProps = {
  allowed: AccountType[];
};

export const InitialRouteRedirect = () => {
  return <Navigate to={resolveInitialPath()} replace />;
};

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

export const AccountTypeGuard = ({ allowed }: AccountTypeGuardProps) => {
  const { accountType } = readAuthState();

  if (accountType && allowed.includes(accountType)) {
    return <Outlet />;
  }

  return <Navigate to="/feed" replace />;
};

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