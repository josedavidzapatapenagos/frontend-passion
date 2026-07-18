import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getModelAccountMeApi } from "../../../services/accountSettingsService";
import { getModelProfileMeOrNull, type ModelProfile } from "../../../services/modelProfileService";
import { readAuthState } from "../../../services/navigationFlow";
import { getIdentityVerificationStatus } from "../../../services/identityVerificationService";

type ModelAccessState = {
  accountApproved: boolean;
  hasProfile: boolean;
  hasCompletedOnboarding: boolean;
  profile: ModelProfile | null;
  isLoading: boolean;
  hasResolvedAccess: boolean;
};

type ModelAccessContextValue = ModelAccessState & {
  refreshAccess: () => Promise<void>;
};

const defaultState: ModelAccessState = {
  accountApproved: false,
  hasProfile: false,
  hasCompletedOnboarding: false,
  profile: null,
  isLoading: false,
  hasResolvedAccess: false,
};

const APPROVED_ACCOUNT_STATUSES = new Set(["APPROVED", "ACTIVE", "VERIFIED"]);

const isApprovedAccountStatus = (status: unknown) => {
  if (typeof status !== "string") {
    return false;
  }

  return APPROVED_ACCOUNT_STATUSES.has(status.trim().toUpperCase());
};

const ModelAccessContext = createContext<ModelAccessContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export const ModelAccessProvider = ({ children }: Props) => {
  const [{ accountApproved, hasProfile, hasCompletedOnboarding, profile, isLoading, hasResolvedAccess }, setState] = useState<ModelAccessState>(() => {
    const auth = readAuthState();

    return {
      ...defaultState,
      isLoading: auth.accountType === "MODEL" && auth.isAuthenticated,
    };
  });

  const requestCounterRef = useRef(0);

  const refreshAccess = useCallback(async () => {
    const authState = readAuthState();

    if (!authState.isAuthenticated || authState.accountType !== "MODEL") {
      setState({
        ...defaultState,
        hasResolvedAccess: true,
      });
      return;
    }

    setState((current) => ({
      ...current,
      isLoading: !current.hasResolvedAccess,
    }));

    const requestId = requestCounterRef.current + 1;
    requestCounterRef.current = requestId;

    try {
      const [accountResult, verificationResult] = await Promise.allSettled([
        getModelAccountMeApi(),
        getIdentityVerificationStatus(),
      ]);

      const accountStatus =
        accountResult.status === "fulfilled" ? accountResult.value.data?.data?.status : null;

      const verificationStatus =
        verificationResult.status === "fulfilled" ? verificationResult.value?.status : null;

      const approved =
        isApprovedAccountStatus(accountStatus) ||
        (typeof verificationStatus === "string" && verificationStatus.toUpperCase() === "APPROVED");

      if (!approved) {
        if (requestCounterRef.current === requestId) {
          setState({
            accountApproved: false,
            hasProfile: false,
            hasCompletedOnboarding: false,
            profile: null,
            isLoading: false,
            hasResolvedAccess: true,
          });
        }

        return;
      }

      const modelProfile = await getModelProfileMeOrNull();

      if (requestCounterRef.current === requestId) {
        const hasProfile = Boolean(modelProfile);
        const hasCompletedOnboarding = hasProfile && (modelProfile?.contactMethods.length || 0) > 0;

        setState({
          accountApproved: true,
          hasProfile,
          hasCompletedOnboarding,
          profile: modelProfile,
          isLoading: false,
          hasResolvedAccess: true,
        });
      }
    } catch {
      if (requestCounterRef.current === requestId) {
        setState({
          accountApproved: false,
          hasProfile: false,
          hasCompletedOnboarding: false,
          profile: null,
          isLoading: false,
          hasResolvedAccess: true,
        });
      }
    }
  }, []);

  useEffect(() => {
    void refreshAccess();

    const syncFromAuth = () => {
      void refreshAccess();
    };

    const syncFromStorage = () => {
      void refreshAccess();
    };

    const syncFromFocus = () => {
      void refreshAccess();
    };

    window.addEventListener("auth-changed", syncFromAuth);
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromFocus);

    return () => {
      window.removeEventListener("auth-changed", syncFromAuth);
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromFocus);
    };
  }, [refreshAccess]);

  const value = useMemo(
    () => ({
      accountApproved,
      hasProfile,
      hasCompletedOnboarding,
      profile,
      isLoading,
      hasResolvedAccess,
      refreshAccess,
    }),
    [accountApproved, hasProfile, hasCompletedOnboarding, profile, isLoading, hasResolvedAccess, refreshAccess]
  );

  return <ModelAccessContext.Provider value={value}>{children}</ModelAccessContext.Provider>;
};

export const useModelAccessContext = () => {
  const context = useContext(ModelAccessContext);

  if (!context) {
    throw new Error("useModelAccessContext must be used within ModelAccessProvider.");
  }

  return context;
};