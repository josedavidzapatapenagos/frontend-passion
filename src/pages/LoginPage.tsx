import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setEmailError("Ingresa tu correo electrónico");
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError("Ingresa un correo electrónico válido");
      return;
    }

    if (!password.trim()) {
      setPasswordError("Ingresa tu contraseña");
      return;
    }

    if (password.length < 8) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres"
      );
      return;
    }

    if (password.length > 64) {
      setPasswordError(
        "La contraseña no puede superar los 64 caracteres"
      );
      return;
    }

    setLoading(true);

    try {
      await login(email, password);

      // Login exitoso
      navigate("/select-country");
    } catch (err: any) {
      const status = err?.response?.status;
      const messages = err?.response?.data?.messages;

      if (
        status === 409 &&
        messages?.[0]?.includes("verificar tu email")
      ) {
        navigate("/verify-email", {
          state: { email },
        });
      } 
      else if (status === 400) {
        const backendMessage = messages?.[0] || "";

        if (
          backendMessage
            .toLowerCase()
            .includes("password")
        ) {
          setPasswordError(backendMessage);
        } 
        else if (
          backendMessage
            .toLowerCase()
            .includes("email")
        ) {
          setEmailError(backendMessage);
        } 
        else {
          setGeneralError(backendMessage);
        }
      } 
      else if (status === 401) {
        setPasswordError(
          messages?.[0] ||
          "Correo o contraseña incorrectos"
        );
      } 
      else {
        setGeneralError(
          "No fue posible conectar con el servidor"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#013440] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#012a33] border border-white/10 rounded-[2rem] p-8 shadow-2xl">

          <h1 className="text-[#FD0083] text-5xl font-black italic text-center mb-2">
            Virtual Passion
          </h1>

          <p className="text-center text-white/40 mb-8 uppercase text-xs tracking-widest font-bold">
            Acceso Premium
          </p>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                className={`
                  w-full
                  bg-[#013440]
                  border
                  rounded-2xl
                  px-5
                  py-4
                  text-white
                  focus:outline-none
                  transition-all
                  ${
                    emailError
                      ? "border-red-500"
                      : "border-white/10 focus:border-[#00BCD4]"
                  }
                `}
              />

              {emailError && (
                <p className="text-red-400 text-xs mt-2 font-semibold">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className={`
                  w-full
                  bg-[#013440]
                  border
                  rounded-2xl
                  px-5
                  py-4
                  text-white
                  focus:outline-none
                  transition-all
                  ${
                    passwordError
                      ? "border-red-500"
                      : "border-white/10 focus:border-[#00BCD4]"
                  }
                `}
              />

              {passwordError && (
                <p className="text-red-400 text-xs mt-2 font-semibold">
                  {passwordError}
                </p>
              )}
            </div>

            {generalError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm font-semibold">
                  {generalError}
                </p>
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
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {loading
                ? "Validando..."
                : "Iniciar sesión"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};