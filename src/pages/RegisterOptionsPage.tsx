import { useNavigate } from "react-router-dom";

export const RegisterOptionsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#013440] px-6 py-16">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="text-center mb-14">

          <h1 className="text-5xl md:text-6xl font-black text-white">
            Bienvenido a
          </h1>

          <h2 className="text-6xl md:text-7xl font-black italic text-[#FD0083] mt-2">
            Virtual Passion
          </h2>

          <p className="mt-6 text-white/60 max-w-2xl mx-auto text-lg">
            Una plataforma exclusiva donde creadores de contenido y seguidores
            pueden conectar de forma segura, privada y profesional.
          </p>

        </div>

        {/* Cards */}

        <div className="grid md:grid-cols-2 gap-8">

          {/* MODELO */}

          <div
            className="
              bg-[#012a33]
              border border-[#FD0083]/20
              rounded-[2rem]
              p-8
              shadow-2xl
              hover:scale-105
              hover:border-[#FD0083]
              transition-all
              duration-300
            "
          >
            <div className="mb-6">

              <span
                className="
                  bg-[#FD0083]/20
                  text-[#FD0083]
                  px-4
                  py-2
                  rounded-full
                  text-xs
                  font-bold
                  uppercase
                "
              >
                Para Creadores
              </span>

            </div>

            <h2 className="text-4xl font-black text-white mb-3">
              Modelo
            </h2>

            <p className="text-[#FD0083] font-bold text-lg mb-5">
              Convierte tu contenido en ingresos.
            </p>

            <p className="text-white/70 leading-relaxed mb-8">
              Crea tu perfil profesional, publica contenido exclusivo,
              construye tu comunidad y monetiza tu audiencia desde una
              plataforma diseñada para impulsar tu crecimiento.
            </p>

            <div className="space-y-3 mb-8 text-white/70">

              <div>✓ Perfil profesional</div>

              <div>✓ Publicación de contenido exclusivo</div>

              <div>✓ Gestión de seguidores</div>

              <div>✓ Monetización segura</div>

              <div>✓ Herramientas para crecimiento</div>

            </div>

            <button
              onClick={() => navigate("/register-model")}
              className="
                w-full
                bg-[#FD0083]
                hover:bg-[#ff1a8f]
                rounded-2xl
                py-4
                text-white
                font-black
                uppercase
                tracking-wider
                transition-all
              "
            >
              Crear cuenta de modelo
            </button>
          </div>

          {/* CLIENTE VIP */}

          <div
            className="
              bg-[#012a33]
              border border-[#00BCD4]/20
              rounded-[2rem]
              p-8
              shadow-2xl
              hover:scale-105
              hover:border-[#00BCD4]
              transition-all
              duration-300
            "
          >
            <div className="mb-6">

              <span
                className="
                  bg-[#00BCD4]/20
                  text-[#00BCD4]
                  px-4
                  py-2
                  rounded-full
                  text-xs
                  font-bold
                  uppercase
                "
              >
                Para Usuarios
              </span>

            </div>

            <h2 className="text-4xl font-black text-white mb-3">
              Cliente VIP
            </h2>

            <p className="text-[#00BCD4] font-bold text-lg mb-5">
              Accede al mejor contenido exclusivo.
            </p>

            <p className="text-white/70 leading-relaxed mb-8">
              Sigue a tus modelos favoritas, accede a contenido premium
              y disfruta de una experiencia privada diseñada para usuarios VIP.
            </p>

            <div className="space-y-3 mb-8 text-white/70">

              <div>✓ Acceso a contenido exclusivo</div>

              <div>✓ Seguimiento de modelos</div>

              <div>✓ Experiencia premium</div>

              <div>✓ Beneficios VIP</div>

              <div>✓ Plataforma privada y segura</div>

            </div>

            <button
              onClick={() => navigate("/register-vip")}
              className="
                w-full
                bg-[#00BCD4]
                hover:bg-[#18d6ef]
                rounded-2xl
                py-4
                text-white
                font-black
                uppercase
                tracking-wider
                transition-all
              "
            >
              Crear cuenta VIP
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};