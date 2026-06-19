import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerModel } from "../services/registerService";

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await registerModel({
        name,
        lastname,
        email,
        password,
      });

      setMessage(response.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
        "Error al registrar cuenta"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#013440] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Glow fondo */}
      <div className="absolute w-96 h-96 bg-[#FD0083]/20 blur-[120px] rounded-full -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-[#00BCD4]/20 blur-[120px] rounded-full bottom-0 right-0" />

      <div
        className="
          relative
          w-full
          max-w-lg
          bg-[#012a33]/90
          backdrop-blur-xl
          border border-white/10
          rounded-[2.5rem]
          p-10
          shadow-[0_30px_80px_rgba(0,0,0,0.35)]
        "
      >
        <div className="text-center mb-10">

          <h1 className="text-5xl font-black italic text-[#FD0083] tracking-tight">
            Virtual Passion
          </h1>

          <p className="text-white/50 uppercase tracking-[0.3em] text-xs mt-3 font-bold">
            Crear cuenta
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>
            <label className="block text-white/60 text-xs font-bold uppercase mb-2 tracking-wider">
              Nombre
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="José"
              className="
                w-full
                bg-[#013440]
                border border-white/10
                rounded-2xl
                px-5 py-4
                text-white
                transition-all
                focus:outline-none
                focus:border-[#00BCD4]
                focus:shadow-[0_0_20px_rgba(0,188,212,0.25)]
              "
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-bold uppercase mb-2 tracking-wider">
              Apellido
            </label>

            <input
              type="text"
              value={lastname}
              onChange={(e) =>
                setLastname(e.target.value)
              }
              placeholder="Zapata"
              className="
                w-full
                bg-[#013440]
                border border-white/10
                rounded-2xl
                px-5 py-4
                text-white
                transition-all
                focus:outline-none
                focus:border-[#00BCD4]
                focus:shadow-[0_0_20px_rgba(0,188,212,0.25)]
              "
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-bold uppercase mb-2 tracking-wider">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="correo@ejemplo.com"
              className="
                w-full
                bg-[#013440]
                border border-white/10
                rounded-2xl
                px-5 py-4
                text-white
                transition-all
                focus:outline-none
                focus:border-[#00BCD4]
                focus:shadow-[0_0_20px_rgba(0,188,212,0.25)]
              "
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-bold uppercase mb-2 tracking-wider">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="********"
              className="
                w-full
                bg-[#013440]
                border border-white/10
                rounded-2xl
                px-5 py-4
                text-white
                transition-all
                focus:outline-none
                focus:border-[#00BCD4]
                focus:shadow-[0_0_20px_rgba(0,188,212,0.25)]
              "
            />
          </div>

          {message && (
            <div
              className="
                bg-white/5
                border border-white/10
                rounded-xl
                p-4
                text-center
                text-white/80
                text-sm
              "
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              py-4
              rounded-2xl
              font-black
              uppercase
              tracking-widest
              text-white
              bg-gradient-to-r
              from-[#FD0083]
              to-[#ff4ca8]
              hover:scale-[1.02]
              active:scale-95
              transition-all
              shadow-[0_15px_40px_rgba(253,0,131,0.4)]
            "
          >
            {loading
              ? "Registrando..."
              : "Crear Cuenta"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="
              w-full
              py-3
              text-[#00BCD4]
              font-bold
              hover:text-white
              transition-colors
            "
          >
            Ya tengo una cuenta
          </button>

        </form>
      </div>
    </div>
  );
};