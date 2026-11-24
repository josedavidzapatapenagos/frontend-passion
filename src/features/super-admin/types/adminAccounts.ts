import type { AdminPermission } from "@/features/auth/constants/adminPermissions";

export type ApiEnvelope<T> = {
  data: T;
  message: string;
  at: string;
  status: string;
};

export type CreateAdminAccountPayload = {
  name: string;
  lastname: string;
  email: string;
  password: string;
  permissions: AdminPermission[];
};

export type AdminAccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AdminAccountSummary = {
  id: string;
  email: string;
  status: AdminAccountStatus;
  created_at: string;
};

export type AdminAccountDetail = AdminAccountSummary & {
  type: "ADMIN";
  name: string;
  lastname: string;
  admin_permissions: AdminPermission[];
};

export type ModelAccountSummary = AdminAccountSummary & {
  name: string;
  lastname: string;
};
