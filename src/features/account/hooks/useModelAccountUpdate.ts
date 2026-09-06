import { useEffect, useState } from "react";
import {
  getModelAccountMeApi,
  type ModelAccountMe,
} from "@/features/account/services/accountSettingsService";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

export const useModelAccountUpdate = (isModel: boolean) => {
  const [profile, setProfile] = useState<ModelAccountMe | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const loadProfile = async () => {
    setLoadingProfile(true);
    setProfileError("");

    try {
      const response = await getModelAccountMeApi();
      const modelData = response.data?.data;
      setProfile(modelData || null);
    } catch (err: unknown) {
      setProfileError(
        getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudo cargar la información de la cuenta.",
          forbiddenMessage: "Solo las cuentas MODEL activas pueden ver su información personal.",
        })
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isModel) {
      return;
    }

    void loadProfile();
  }, [isModel]);

  return {
    profile,
    loadingProfile,
    profileError,
    loadProfile,
  };
};
