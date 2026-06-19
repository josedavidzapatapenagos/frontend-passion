import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();

  const accountName =
    localStorage.getItem("accountName");

  const isLogged =
    !!localStorage.getItem("accountName");

  const handleLogout = () => {
    localStorage.removeItem("accountName");
    localStorage.removeItem("accountType");

    navigate("/login");
  };

  return (
    <header
      className="
        sticky
        top-0
        z-50
        bg-[#012a33]/95
        backdrop-blur-md
        border-b
        border-white/10
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <h1
          className="
            text-3xl
            font-black
            italic
            text-[#FD0083]
            cursor-pointer
          "
          onClick={() => navigate("/feed")}
        >
          Virtual Passion
        </h1>

        {!isLogged ? (
          <div className="flex gap-3">

            <button
              onClick={() => navigate("/login")}
              className="
                px-5
                py-2
                rounded-xl
                border
                border-white/10
                text-white
                hover:bg-white/10
              "
            >
              Iniciar sesión
            </button>

            <button
              onClick={() => navigate("/register")}
              className="
                px-5
                py-2
                rounded-xl
                bg-[#FD0083]
                text-white
                font-bold
                hover:bg-[#ff1a8f]
              "
            >
              Registrarse
            </button>

          </div>
        ) : (
          <div className="flex items-center gap-4">

            <span className="text-white/80">
              Hola, {accountName}
            </span>

            <button
              onClick={handleLogout}
              className="
                px-4
                py-2
                rounded-xl
                bg-white/10
                text-white
              "
            >
              Cerrar sesión
            </button>

          </div>
        )}

      </div>
    </header>
  );
};