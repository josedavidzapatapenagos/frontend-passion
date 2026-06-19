import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyEmail } from "../services/authService";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await verifyEmail(token);

      setSuccess(
        response.data?.message ||
          "Correo verificado correctamente."
      );

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.messages?.[0];

      setError(
        backendMessage ||
          "No fue posible verificar el correo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#013440] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#012a33] border border-white/10 rounded-[2rem] p-8 shadow-2xl">

          <h1 className="text-[#FD0083] text-4xl font-black italic text-center mb-3">
            Verificar correo
          </h1>

          <p className="text-center text-white/40 text-sm mb-8">
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
                bg-[#013440]
                border
                border-white/10
                rounded-2xl
                px-5
                py-4
                text-white
                focus:outline-none
                focus:border-[#00BCD4]
              "
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-xl p-3 text-sm">
                {success}
              </div>
            )}

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