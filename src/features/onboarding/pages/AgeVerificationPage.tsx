import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  isAdultConfirmed,
  persistAdultConfirmation,
} from "@/features/onboarding/services/navigationFlow";

export const AgeVerificationPage = () => {
  const navigate = useNavigate();

  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdultConfirmed()) {
      navigate("/feed", { replace: true });
    }
  }, [navigate]);

  const handleAdult = () => {
    persistAdultConfirmation();
    navigate("/feed", { replace: true });
  };

  const handleMinor = () => {
    setError(
      "Debes ser mayor de edad para acceder a Virtual Passion."
    );
  };

  return (
    <div className="min-h-screen vp-page-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="vp-surface border vp-border rounded-[2rem] p-10 shadow-2xl">
          <h1 className="text-[#FD0083] text-4xl font-black italic text-center mb-4">
            Verificación de Edad
          </h1>

          <p className="text-center vp-text-muted mb-8">
            Debes confirmar que eres mayor de edad para continuar.
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleAdult}
              className="
                flex-1
                bg-[#FD0083]
                hover:bg-[#ff1a8f]
                rounded-2xl
                py-4
                text-white
                font-bold
                transition-all
              "
            >
              Sí, soy mayor de edad
            </button>

            <button
              onClick={handleMinor}
              className="
                flex-1
                vp-surface-soft
                hover:opacity-90
                rounded-2xl
                py-4
                vp-text-primary
                font-bold
                transition-all
              "
            >
              No
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-center font-semibold">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};