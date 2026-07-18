import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import { verifyEmail } from "../services/authService";
import { getUserFacingErrorMessage } from "../services/errorMapper";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await verifyEmail(token);

      notifySuccess({
        title: "Correo verificado",
        description:
          response.data?.message ||
          "Correo verificado correctamente.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      notifyError({
        title: "No pudimos verificar el correo",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "No fue posible verificar el correo.",
          badRequestMessage: "Revisa el código ingresado e inténtalo nuevamente.",
          conflictMessage: "Este código ya fue utilizado o dejó de estar disponible.",
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen vp-page-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="vp-surface border vp-border rounded-[2rem] p-8 shadow-2xl">

          <h1 className="text-[#FD0083] text-4xl font-black italic text-center mb-3">
            Verificar correo
          </h1>

          <p className="text-center vp-text-muted text-sm mb-8">
            Ingresa el código que recibiste por email
          </p>

          <form
            onSubmit={handleVerify}
            className="space-y-5"
          >
            <input
              type="text"
              placeholder="Código de verificación"
              value={token}
              onChange={(e) =>
                setToken(e.target.value)
              }
              className="
                w-full
                vp-input
                border
                vp-border
                rounded-2xl
                px-5
                py-4
                vp-text-primary
                focus:outline-none
                focus:border-[#00BCD4]
              "
            />
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                bg-[#FD0083]
                hover:bg-[#ff1a8f]
                rounded-2xl
                py-4
                text-white
                font-black
                uppercase
                tracking-widest
                transition-all
              "
            >
              {loading
                ? "Verificando..."
                : "Verificar correo"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};