import { useNavigate } from "react-router-dom";
import { RegisterStepOne } from "../components/RegisterStepOne";

export const SelectCountryPage = () => {
  const navigate = useNavigate();

const handleSelection = (catalogId: string) => {
  localStorage.setItem("catalogId", catalogId);

  navigate("/age-verification");
};
  return (
    <div className="min-h-screen bg-[#013440]">
      <RegisterStepOne
        onSelectionComplete={handleSelection}
      />
    </div>
  );
};