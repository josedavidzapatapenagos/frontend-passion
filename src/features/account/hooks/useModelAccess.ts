import { useModelAccessContext } from "../contexts/ModelAccessContext";

export const useModelAccess = () => {
  const { accountApproved, hasProfile, hasCompletedOnboarding, isLoading, hasResolvedAccess } = useModelAccessContext();

  return {
    accountApproved,
    hasProfile,
    hasCompletedOnboarding,
    isLoading,
    hasResolvedAccess,
  };
};

export const useModelProfileAccess = () => useModelAccessContext();