import { useLocation, useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { NavbarDropdownMenu } from "@/components/common/NavbarDropdownMenu";
import { useEffect, useState } from "react";
import {
  ROLE_NAVBAR_MENUS,
  isNavbarGroupItem,
  type NavbarGroupItem,
  type NavbarLinkItem,
  type NavbarRole,
} from "@/constants/navbarMenus";
import { useModelProfileAccess } from "@/features/account/hooks/useModelAccess";
import { getIdentityVerificationStatus } from "@/features/identity-verification/services/identityVerificationService";
import { normalizeAccountType } from "@/features/auth/services/authService";
import { clearStoredAuthState, readStoredAuthState } from "@/features/auth/services/authStorage";
import { useAccountPermissions } from "@/features/auth/services/accountPermissions";

type AuthSnapshot = {
  accountName: string | null;
  accountType: string | null;
  isLogged: boolean;
};

type NavbarItemState = {
  label: string;
  path: string;
  disabled?: boolean;
};

type VisibleNavbarItem =
  | ({ kind: "link" } & NavbarItemState)
  | ({ kind: "group" } & NavbarGroupItem);

const isNavbarRole = (value: string | null): value is NavbarRole => {
  return value === "USER" || value === "CLIENT" || value === "MODEL" || value === "ADMIN" || value === "SUPER_ADMIN";
};

const readAuthSnapshot = (): AuthSnapshot => {
  const authState = readStoredAuthState();
  const normalizedAccountType = normalizeAccountType(authState.accountType);
  const isLoggedIn = authState.isLogged && Boolean(normalizedAccountType);

  // Prevent stale UI sessions when old account data remains after backend restart.
  if (!isLoggedIn) {
    clearStoredAuthState();
  }

  return {
    accountName: authState.accountName || authState.accountFullName,
    accountType: normalizedAccountType,
    isLogged: isLoggedIn,
  };
};

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authSnapshot, setAuthSnapshot] = useState<AuthSnapshot>(readAuthSnapshot());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === location.pathname;
  if (mobileMenuPath !== null && mobileMenuPath !== location.pathname) {
    setMobileMenuPath(null);
  }
  const [isLargeScreen, setIsLargeScreen] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches
  );

  const accountName = authSnapshot.accountName;
  const accountType = authSnapshot.accountType;

  const role = normalizeAccountType(accountType);
  const navbarRole = isNavbarRole(role) ? role : null;
  const isLogged = authSnapshot.isLogged;
  const { accountApproved, hasCompletedOnboarding, profile } = useModelProfileAccess();
  const { can, resolved: permissionsResolved } = useAccountPermissions();
  const hasVipAreaEnabled = Boolean(profile?.vipAreaId?.trim());

  const [modelVerificationStatus, setModelVerificationStatus] = useState<string | null>(
    readStoredAuthState().modelVerificationStatus
  );

  // Sincronización del estado de autenticación
  useEffect(() => {
    const syncAuth = () => {
      const nextSnapshot = readAuthSnapshot();
      setAuthSnapshot(nextSnapshot);
      // Si se deslogueó en otra pestaña, limpiar el estado de verificación local
      if (!nextSnapshot.isLogged) {
        setModelVerificationStatus(null);
      }
    };

    window.addEventListener("auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);

    return () => {
      window.removeEventListener("auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  // El menú colapsable se habilita sólo en pantallas grandes para mantener
  // una UX consistente en móvil/tablet.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleScreenChange = (event: MediaQueryListEvent) => {
      setIsLargeScreen(event.matches);
      setMobileMenuPath(null);
      if (!event.matches) {
        setIsCollapsed(false);
      }
    };

    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  // Control estricto de la petición de verificación
  useEffect(() => {
    if (!isLogged || role !== "MODEL") {
      return;
    }

    // Si ya está aprobada o pendiente, evitamos llamadas repetitivas en cada re-render
    if (modelVerificationStatus === "PENDING" || modelVerificationStatus === "APPROVED") {
      return;
    }

    getIdentityVerificationStatus()
      .then((status) => {
        const nextStatus = status?.status || null;
        setModelVerificationStatus(nextStatus);

        if (nextStatus) {
          localStorage.setItem("modelVerificationStatus", nextStatus);
        } else {
          localStorage.removeItem("modelVerificationStatus");
        }
      })
      .catch(() => {
        // Silenciar errores de red o 403 temporales sin romper la UI
      });
  }, [isLogged, role, modelVerificationStatus]); // Agregado status a las dependencias para evitar cierres obsoletos

  const menuItems = navbarRole ? ROLE_NAVBAR_MENUS[navbarRole] : [];
  const isAllowed = (item: NavbarLinkItem) => !item.requires || can(item.requires);

  const normalizedMenuItems: VisibleNavbarItem[] = menuItems
    .map((item): VisibleNavbarItem | null => {
      if (isNavbarGroupItem(item)) {
        const children = item.children.filter(isAllowed);
        return children.length > 0 ? { kind: "group", ...item, children } : null;
      }

      return isAllowed(item) ? { kind: "link", label: item.label, path: item.path } : null;
    })
    .filter((item): item is VisibleNavbarItem => Boolean(item));

  // Modelos sin aprobación quedan en Cuenta; modelos aprobadas sin perfil quedan en Perfil.
  const visibleMenuItems: VisibleNavbarItem[] =
    role !== "MODEL"
      ? normalizedMenuItems
      : normalizedMenuItems
          .map((item): VisibleNavbarItem | null => {
            if (item.kind !== "link" || item.path === "/account") {
              return item;
            }

            if (item.path === "/profile") {
              if (!accountApproved) {
                return null;
              }

              return item;
            }

            if (item.path === "/ads") {
              if (!accountApproved) {
                return null;
              }

              return {
                ...item,
                disabled: !hasCompletedOnboarding,
              };
            }

            if (item.path === "/vip/manage") {
              if (!accountApproved || !hasCompletedOnboarding || !hasVipAreaEnabled) {
                return null;
              }

              return item;
            }

            return item;
          })
          .filter((item): item is VisibleNavbarItem => Boolean(item));

  const handleLogout = () => {
    clearStoredAuthState();

    // Limpiamos los estados locales inmediatamente para evitar parpadeos visuales
    setAuthSnapshot({ accountName: null, accountType: null, isLogged: false });
    setModelVerificationStatus(null);

    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuPath(null);
    if (isLargeScreen) {
      setIsCollapsed(true);
    }
  };

  const showExpandedContent = isLargeScreen ? !isCollapsed : isMobileMenuOpen;

  return (
    <aside
      className={`w-full shrink-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white/90 text-slate-900 backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-[#012a33]/95 dark:text-white lg:min-h-screen ${
        isLargeScreen && isCollapsed ? "lg:w-20" : "lg:w-72"
      }`}
    >
      <div className={`flex h-full flex-col p-4 ${isLargeScreen && isCollapsed ? "lg:p-4" : "lg:p-6"}`}>
        <div className={`flex items-center justify-between gap-3 ${isLargeScreen && isCollapsed ? "lg:flex-col" : ""}`}>
          <h1
            className={`min-w-0 cursor-pointer font-black italic text-[#FD0083] transition-all duration-300 ${
              isLargeScreen && isCollapsed ? "text-xl" : "text-2xl sm:text-3xl lg:text-2xl"
            }`}
            onClick={() => navigate("/feed")}
          >
            {isLargeScreen && isCollapsed ? "VP" : "Virtual Passion"}
          </h1>

          <button
            type="button"
            onClick={() => setMobileMenuPath(isMobileMenuOpen ? null : location.pathname)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 lg:hidden"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-content"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              {isMobileMenuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-all hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10 lg:inline-flex"
            aria-label={isCollapsed ? "Desplegar menú" : "Recoger menú"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            )}
          </button>
        </div>

        {showExpandedContent && (
          <div id="navbar-content">
            <div className="mt-4 flex items-center justify-between gap-3">
              <ThemeSwitcher />
              {isLogged && (
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-slate-900 transition-all hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  Cerrar sesión
                </button>
              )}
            </div>

            {isLogged && (
              <div className="mb-6 mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-300 dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-white/50">
                  Cuenta activa
                </p>
                <p className="truncate font-semibold text-slate-900 dark:text-white/90">
                  {accountName || "Usuario"}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#00BCD4]">
                  {role || "SIN_ROL"}
                </p>
                {role === "MODEL" && (
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-amber-500 dark:text-amber-300">
                    {modelVerificationStatus || "NO_VERIFICADA"}
                  </p>
                )}
                {role === "ADMIN" && !permissionsResolved && (
                  <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    No se pudieron obtener tus permisos. Inicia sesión de nuevo; si el problema continúa, contacta al superadministrador.
                  </p>
                )}
              </div>
            )}

            {!isLogged ? (
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => handleNavigate("/login")}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-slate-900 transition-all hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => handleNavigate("/register")}
                  className="rounded-xl bg-[#FD0083] px-5 py-3 font-bold text-white transition-all hover:bg-[#ff1a8f]"
                >
                  Registrarse
                </button>
              </div>
            ) : (
              <nav className="mt-6 flex flex-col gap-2">
                {visibleMenuItems.map((item) =>
                  item.kind === "group" ? (
                    <NavbarDropdownMenu
                      key={item.basePath}
                      item={item}
                      isActive={location.pathname.startsWith(item.basePath)}
                      activePath={location.pathname}
                      isLargeScreen={isLargeScreen}
                      onNavigate={handleNavigate}
                    />
                  ) : (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (item.disabled) {
                        return;
                      }

                      handleNavigate(item.path);
                    }}
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                    className={`rounded-xl px-4 py-3 text-left transition-all ${
                      item.disabled
                        ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/30"
                        : ""
                    } ${
                      location.pathname === item.path
                        ? "bg-[#FD0083] text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                  )
                )}
              </nav>
            )}

          </div>
        )}
      </div>
    </aside>
  );
};