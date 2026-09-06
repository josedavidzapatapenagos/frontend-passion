import { useNavigate } from "react-router-dom";
import { RegisterStepOne } from "@/features/onboarding/components/RegisterStepOne";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { persistSelectedCountry } from "@/features/onboarding/services/navigationFlow";

export const SelectCountryPage = () => {
  const navigate = useNavigate();

  const handleSelection = (catalogId: string) => {
    persistSelectedCountry(catalogId);

    navigate("/age-verification");
  };

  return (
    <div className="min-h-screen vp-page-bg">
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-4">
        <ThemeSwitcher />
      </div>

      <RegisterStepOne
        onSelectionComplete={handleSelection}
      />
    </div>
  );
};