import { useModelAdForm } from "./useModelAdForm";

export const useCreateModelAdForm = (enabled: boolean) => {
  return useModelAdForm({
    enabled,
    mode: "create",
  });
};