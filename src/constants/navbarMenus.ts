export const ROLE_NAVBAR_MENUS = {
  USER: [
    { label: "Mi Perfil", path: "/account" },
    { label: "Explorar", path: "/feed" },
  ],
  MODEL: [
    { label: "Cuenta", path: "/account" },
    { label: "Perfil", path: "/profile" },
    { label: "Anuncios", path: "/ads" },
    { label: "Área VIP", path: "/vip" },
  ],
  ADMIN: [
    { label: "Cuenta", path: "/account" },
    { label: "Administración anuncios", path: "/admin/ads" },
    { label: "Administración planes de posicionamiento", path: "/admin/plans" },
    { label: "Verificación de identidad", path: "/admin/identity-verifications/pending" },
    { label: "Modelos", path: "/admin/models" },
  ],
  SUPER_ADMIN: [
    { label: "Cuenta", path: "/account" },
    { label: "Administración anuncios", path: "/admin/ads" },
    { label: "Administración planes de posicionamiento", path: "/admin/plans" },
    { label: "Verificación de identidad", path: "/admin/identity-verifications/pending" },
    { label: "Modelos", path: "/admin/models" },
  ],
} as const;

export type NavbarRole = keyof typeof ROLE_NAVBAR_MENUS;

export const normalizeRole = (
  role: string | null
): NavbarRole => {
  const normalized = role
    ?.toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");

  if (normalized === "MODEL") return "MODEL";
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "SUPER_ADMIN") return "SUPER_ADMIN";

  // Default role for regular users.
  return "USER";
};
