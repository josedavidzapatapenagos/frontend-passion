export const ADMIN_PERMISSIONS = [
  "MODEL_REGISTRATION_LIST_VIEW",
  "MODEL_REGISTRATION_VIEW",
  "MODEL_REGISTRATION_APPROVE",
  "MODEL_REGISTRATION_REJECT",
  "POST_REVIEW_LIST_VIEW",
  "POST_REVIEW_VIEW",
  "POST_REVIEW_APPROVE",
  "POST_REVIEW_REJECT",
  "PAYMENT_VIEW_ALL",
  "ADMIN_ACCOUNT_SUSPEND",
  "ADMIN_ACCOUNT_UNSUSPEND",
  "MODEL_ACCOUNT_SUSPEND",
  "MODEL_ACCOUNT_UNSUSPEND",
] as const;

export type KnownAdminPermission = (typeof ADMIN_PERMISSIONS)[number];

// The backend is the source of truth; unknown permissions are kept as plain strings.
export type AdminPermission = KnownAdminPermission | (string & {});

export type AdminPermissionGroupId =
  | "MODEL_REGISTRATION"
  | "POST_REVIEW"
  | "PAYMENTS"
  | "ADMIN_ACCOUNTS"
  | "MODEL_ACCOUNTS"
  | "OTHER";

type PermissionMetadata = {
  label: string;
  description: string;
  group: AdminPermissionGroupId;
};

export const ADMIN_PERMISSION_METADATA: Record<KnownAdminPermission, PermissionMetadata> = {
  MODEL_REGISTRATION_LIST_VIEW: {
    label: "Ver listado de registros",
    description: "Consultar las solicitudes de registro y verificación de modelos.",
    group: "MODEL_REGISTRATION",
  },
  MODEL_REGISTRATION_VIEW: {
    label: "Ver detalle de registro",
    description: "Abrir el detalle de una solicitud de registro.",
    group: "MODEL_REGISTRATION",
  },
  MODEL_REGISTRATION_APPROVE: {
    label: "Aprobar registros",
    description: "Aprobar verificaciones de identidad de modelos.",
    group: "MODEL_REGISTRATION",
  },
  MODEL_REGISTRATION_REJECT: {
    label: "Rechazar registros",
    description: "Rechazar verificaciones de identidad indicando el motivo.",
    group: "MODEL_REGISTRATION",
  },
  POST_REVIEW_LIST_VIEW: {
    label: "Ver anuncios pendientes",
    description: "Consultar el listado de publicaciones por revisar.",
    group: "POST_REVIEW",
  },
  POST_REVIEW_VIEW: {
    label: "Ver detalle de anuncio",
    description: "Abrir el detalle de una publicación pendiente.",
    group: "POST_REVIEW",
  },
  POST_REVIEW_APPROVE: {
    label: "Aprobar anuncios",
    description: "Aprobar publicaciones pendientes.",
    group: "POST_REVIEW",
  },
  POST_REVIEW_REJECT: {
    label: "Rechazar anuncios",
    description: "Rechazar publicaciones pendientes con motivo.",
    group: "POST_REVIEW",
  },
  PAYMENT_VIEW_ALL: {
    label: "Ver todos los pagos",
    description: "Consultar el historial global de pagos.",
    group: "PAYMENTS",
  },
  ADMIN_ACCOUNT_SUSPEND: {
    label: "Suspender administradores",
    description: "Suspender cuentas de administrador.",
    group: "ADMIN_ACCOUNTS",
  },
  ADMIN_ACCOUNT_UNSUSPEND: {
    label: "Reactivar administradores",
    description: "Quitar la suspensión de cuentas de administrador.",
    group: "ADMIN_ACCOUNTS",
  },
  MODEL_ACCOUNT_SUSPEND: {
    label: "Suspender modelos",
    description: "Suspender cuentas de modelo.",
    group: "MODEL_ACCOUNTS",
  },
  MODEL_ACCOUNT_UNSUSPEND: {
    label: "Reactivar modelos",
    description: "Quitar la suspensión de cuentas de modelo.",
    group: "MODEL_ACCOUNTS",
  },
};

export const ADMIN_PERMISSION_GROUPS: Array<{ id: AdminPermissionGroupId; label: string }> = [
  { id: "MODEL_REGISTRATION", label: "Verificación de identidad" },
  { id: "POST_REVIEW", label: "Revisión de anuncios" },
  { id: "MODEL_ACCOUNTS", label: "Cuentas de modelo" },
  { id: "ADMIN_ACCOUNTS", label: "Cuentas de administrador" },
  { id: "PAYMENTS", label: "Pagos" },
  { id: "OTHER", label: "Otros permisos" },
];

const isKnownPermission = (permission: string): permission is KnownAdminPermission =>
  (ADMIN_PERMISSIONS as readonly string[]).includes(permission);

const humanizePermission = (permission: string) => {
  const text = permission.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getAdminPermissionMetadata = (permission: string): PermissionMetadata => {
  if (isKnownPermission(permission)) {
    return ADMIN_PERMISSION_METADATA[permission];
  }

  return {
    label: humanizePermission(permission),
    description: permission,
    group: "OTHER",
  };
};
