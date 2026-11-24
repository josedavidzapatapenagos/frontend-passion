import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "@/hooks/useNotification";
import { verifyEmail } from "@/features/auth/services/authService";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const { success: notifySuccess, error: notifyError } = useNotification();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (loading) return;
    if (!token.trim()) {
      notifyError({
        title: "Ingresa el código de verificación",
        description: "Escribe el código que recibiste por correo electrónico.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyEmail(token.trim());

      notifySuccess({
        title: "Correo verificado",
        description:
          response.data?.message ||
          "Correo verificado correctamente.",
      });

      navigate("/login", {
        replace: true,
        state: { email },
      });
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
              aria-label="Código de verificación"
              autoComplete="one-time-code"
              required
              disabled={loading}
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