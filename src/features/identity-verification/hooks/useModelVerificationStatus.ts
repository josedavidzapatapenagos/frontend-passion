export const useModelVerificationStatus = () => {
  return {
    status: null as string | null,
    isApproved: false,
    isPending: false,
    isRejected: false,
    isLoading: false,
    error: null as string | null,
    refetch: async () => {},
  };
};
