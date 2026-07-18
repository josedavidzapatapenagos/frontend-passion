// src/pages/LoginPage.tsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import { AUTH_SESSION_KEY, login } from "../services/authService";
import { getBackendErrorMessage, getUserFacingErrorMessage } from "../services/errorMapper";

type LoginPayload = {
  accountType?: string;
  role?: string;
  roles?: Array<string | { authority?: string; name?: string }>;
  authorities?: Array<string | { authority?: string; name?: string }>;
  token?: string;
  accessToken?: string;
  accountName?: string;
  accountFullName?: string;
  fullName?: string;
};

type LoginEnvelope = {
  data?: LoginPayload;
};

const extractAuthPayload = (
  raw: unknown
): LoginPayload => {
  let current: unknown = raw;

  for (let i = 0; i < 4; i += 1) {
    if (!current || typeof current !== "object") {
      return {};
    }

    const candidate = current as LoginPayload;
    const hasAuthFields =
      Boolean(candidate.accountType) ||
      Boolean(candidate.role) ||
      Boolean(candidate.roles?.length) ||
      Boolean(candidate.authorities?.length) ||
      Boolean(candidate.accessToken) ||
      Boolean(candidate.token);

    if (hasAuthFields) {
      return candidate;
    }

    const envelope = current as LoginEnvelope;
    if (!envelope.data || typeof envelope.data !== "object") {
      return candidate;
    }

    current = envelope.data;
  }

  return {};
};

const getAccountTypeFromAuthPayload = (
  payload: LoginPayload
): string | null => {
  const getRoleValue = (
    roleCandidate: string | { authority?: string; name?: string } | undefined
  ) => {
    if (!roleCandidate) {
      return null;
    }

    if (typeof roleCandidate === "string") {
      return roleCandidate;
    }

    return roleCandidate.authority || roleCandidate.name || null;
  };

  const sourceValue =
    payload.accountType ||
    payload.role ||
    getRoleValue(payload.roles?.[0]) ||
    getRoleValue(payload.authorities?.[0]) ||
    null;

  if (!sourceValue) {
    return null;
  }

  const normalized = sourceValue
    .toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");

  if (
    normalized === "USER" ||
    normalized === "MODEL" ||
    normalized === "ADMIN" ||
    normalized === "SUPER_ADMIN"
  ) {
    return normalized;
  }

  return null;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: notifyError } = useNotification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location.state]);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setEmailError(
        "Ingresa tu correo electrónico"
      );
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError(
        "Ingresa un correo electrónico válido"
      );
      return;
    }

    if (!password.trim()) {
      setPasswordError(
        "Ingresa tu contraseña"
      );
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
      const response = await login(
        email,
        password
      );

      console.log(
        "LOGIN RESPONSE:",
        response.data
      );

      const authPayload = extractAuthPayload(
        response.data
      );

      const accountType = getAccountTypeFromAuthPayload(
        authPayload
      );

      if (!accountType) {
        notifyError({
          title: "No pudimos iniciar sesión",
          description:
            "No se pudo identificar un rol válido para esta cuenta",
        });
        return;
      }

      const accountName =
        authPayload.accountName ||
        authPayload.accountFullName ||
        authPayload.fullName ||
        email;

      localStorage.setItem(
        "accountType",
        accountType
      );

      localStorage.setItem(
        AUTH_SESSION_KEY,
        "true"
      );

      const authToken =
        authPayload.accessToken ||
        authPayload.token;

      if (authToken) {
        localStorage.setItem(
          "token",
          authToken
        );
      } else {
        // Avoid sending stale Authorization headers from a previous session.
        localStorage.removeItem("token");
      }

      localStorage.setItem(
        "accountName",
        accountName
      );

      localStorage.setItem(
        "accountFullName",
        authPayload.accountFullName ||
          authPayload.fullName ||
          accountName
      );

      window.dispatchEvent(new Event("auth-changed"));

      navigate("/feed");
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status;

      const messages =
        (err as { response?: { data?: { messages?: string[] } } })?.response?.data?.messages;
      const backendMessage = getBackendErrorMessage(err) || "";

      const accountNeedsEmailVerification =
        status === 409 ||
        messages?.some((message) =>
          message.toLowerCase().includes("verificar") && message.toLowerCase().includes("email")
        ) ||
        (backendMessage.toLowerCase().includes("verificar") && backendMessage.toLowerCase().includes("email")) ||
        backendMessage.toLowerCase().includes("email no verificado");

      if (accountNeedsEmailVerification) {
        navigate("/verify-email", {
          state: { email },
        });
      } else if (status === 400) {
        if (
          backendMessage
            .toLowerCase()
            .includes("password")
        ) {
          setPasswordError(
            backendMessage
          );
        } else if (
          backendMessage
            .toLowerCase()
            .includes("email")
        ) {
          setEmailError(
            backendMessage
          );
        } else {
          notifyError({
            title: "No pudimos iniciar sesión",
            description: backendMessage,
          });
        }
      } else if (status === 401) {
        setPasswordError(
          "Correo o contraseña incorrectos"
        );
      } else if (status === 403) {
        notifyError({
          title: "No pudimos iniciar sesión",
          description:
            "Tu cuenta no tiene permisos para iniciar sesión en esta sección.",
        });
      } else if (status === 409) {
        notifyError({
          title: "No pudimos iniciar sesión",
          description:
            backendMessage ||
            "Tu cuenta no puede iniciar sesión todavía. Verifica tu correo o estado de cuenta.",
        });
      } else {
        notifyError({
          title: "No pudimos iniciar sesión",
          description: getUserFacingErrorMessage(err, {
            defaultMessage: "No fue posible iniciar sesión en este momento.",
          }),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen vp-page-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="vp-surface border vp-border rounded-[2rem] p-8 shadow-2xl">

          <h1 className="text-[#FD0083] text-5xl font-black italic text-center mb-2">
            Virtual Passion
          </h1>

          <p className="text-center vp-text-muted mb-8 uppercase text-xs tracking-widest font-bold">
            Iniciar sesion
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
                  setEmail(
                    e.target.value
                  );
                  setEmailError("");
                }}
                className={`
                  w-full
                  vp-input
                  border
                  rounded-2xl
                  px-5
                  py-4
                  vp-text-primary
                  focus:outline-none
                  transition-all
                  ${
                    emailError
                      ? "border-red-500"
                      : "vp-border focus:border-[#00BCD4]"
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
                  setPassword(
                    e.target.value
                  );
                  setPasswordError("");
                }}
                className={`
                  w-full
                  vp-input
                  border
                  rounded-2xl
                  px-5
                  py-4
                  vp-text-primary
                  focus:outline-none
                  transition-all
                  ${
                    passwordError
                      ? "border-red-500"
                      : "vp-border focus:border-[#00BCD4]"
                  }
                `}
              />

              {passwordError && (
                <p className="text-red-400 text-xs mt-2 font-semibold">
                  {passwordError}
                </p>
              )}
            </div>
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

            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="
                w-full
                border
                vp-border
                rounded-2xl
                py-4
                vp-text-muted
                font-black
                uppercase
                tracking-widest
                transition-all
                hover:text-[#00BCD4]
                hover:border-[#00BCD4]/50
              "
            >
              Volver al feed
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};