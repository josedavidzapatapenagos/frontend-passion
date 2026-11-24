import type { AdminPermission } from "@/features/auth/constants/adminPermissions";
import type { PermissionRequirement } from "@/features/auth/services/accountPermissions";

export type NavbarLinkItem = {
  label: string;
  path: string;
  /** Only evaluated for ADMIN accounts; SUPER_ADMIN always has access. */
  requires?: PermissionRequirement;
};

export type NavbarGroupItem = {
  label: string;
  /** Path prefix used to highlight the group when one of its children is active. */
  basePath: string;
  children: Array<NavbarLinkItem & { description?: string }>;
};

export type NavbarMenuItem = NavbarLinkItem | NavbarGroupItem;

export const isNavbarGroupItem = (item: NavbarMenuItem): item is NavbarGroupItem =>
  "children" in item;

const anyOf = (...permissions: AdminPermission[]): PermissionRequirement => ({ anyOf: permissions });

export const ADMIN_ROUTE_PERMISSIONS = {
  ads: anyOf("POST_REVIEW_LIST_VIEW"),
  identityVerifications: anyOf("MODEL_REGISTRATION_LIST_VIEW"),
  models: anyOf("MODEL_ACCOUNT_SUSPEND", "MODEL_ACCOUNT_UNSUSPEND"),
} as const satisfies Record<string, PermissionRequirement>;

const ADMIN_PANEL_ITEMS: NavbarLinkItem[] = [
  { label: "Cuenta", path: "/account" },
  { label: "Administración anuncios", path: "/admin/ads", requires: ADMIN_ROUTE_PERMISSIONS.ads },
  {
    label: "Verificación de identidad",
    path: "/admin/identity-verifications/pending",
    requires: ADMIN_ROUTE_PERMISSIONS.identityVerifications,
  },
];

export const ROLE_NAVBAR_MENUS: Record<
  "USER" | "CLIENT" | "MODEL" | "ADMIN" | "SUPER_ADMIN",
  NavbarMenuItem[]
> = {
  USER: [
    { label: "Mi Perfil", path: "/account" },
    { label: "Explorar", path: "/feed" },
  ],
  CLIENT: [
    { label: "Mi Perfil", path: "/account" },
    { label: "Explorar", path: "/feed" },
    { label: "Premium", path: "/premium" },
    { label: "Favoritos", path: "/favorites" },
  ],
  MODEL: [
    { label: "Cuenta", path: "/account" },
    { label: "Perfil", path: "/profile" },
    { label: "Anuncios", path: "/ads" },
    { label: "VIP", path: "/vip/manage" },
  ],
  ADMIN: ADMIN_PANEL_ITEMS,
  SUPER_ADMIN: [
    ...ADMIN_PANEL_ITEMS.slice(0, 2),
    { label: "Posicionamientos", path: "/admin/plans" },
    ...ADMIN_PANEL_ITEMS.slice(2),
    { label: "Modelos", path: "/admin/models", requires: ADMIN_ROUTE_PERMISSIONS.models },
    {
      label: "Administradores",
      basePath: "/superadmin/admins",
      children: [
        {
          label: "Ver administradores",
          path: "/superadmin/admins",
          description: "Consulta cuentas y gestiona sus permisos",
        },
        {
          label: "Crear administrador",
          path: "/superadmin/admins/create",
          description: "Registra una cuenta y asigna permisos",
        },
      ],
    },
  ],
};

export type NavbarRole = keyof typeof ROLE_NAVBAR_MENUS;

export const normalizeRole = (
  role: string | null
): NavbarRole => {
  const normalized = role
    ?.toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");

  if (normalized === "MODEL") return "MODEL";
  if (normalized === "CLIENT") return "CLIENT";
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "SUPER_ADMIN") return "SUPER_ADMIN";

  // Default role for regular users.
  return "USER";
};
