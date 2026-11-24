import apiClient from "@/services/apiClient";
import type { AdminPermission } from "@/features/auth/constants/adminPermissions";
import type {
  AdminAccountDetail,
  AdminAccountStatus,
  AdminAccountSummary,
  ApiEnvelope,
  CreateAdminAccountPayload,
  ModelAccountSummary,
} from "@/features/super-admin/types/adminAccounts";

const SUPER_ADMIN_ACCOUNTS_URL = "/v1/superadmin/accounts";

const defaultHeaders = { accept: "*/*" };

export const getAvailableAdminPermissions = async (signal?: AbortSignal): Promise<AdminPermission[]> => {
  const response = await apiClient.get<ApiEnvelope<unknown>>(`${SUPER_ADMIN_ACCOUNTS_URL}/permissions`, {
    headers: defaultHeaders,
    signal,
  });

  const payload = response.data?.data;
  return Array.isArray(payload)
    ? payload.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
};

export const createAdminAccount = async (payload: CreateAdminAccountPayload) => {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    SUPER_ADMIN_ACCOUNTS_URL,
    {
      name: payload.name.trim(),
      lastname: payload.lastname.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      permissions: payload.permissions,
    },
    { headers: defaultHeaders }
  );

  return response.data;
};

export const getAdminAccounts = async (status?: AdminAccountStatus, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiEnvelope<AdminAccountSummary[]>>(
    `${SUPER_ADMIN_ACCOUNTS_URL}/admins`,
    { params: { status }, headers: defaultHeaders, signal }
  );
  if (!Array.isArray(response.data.data)) {
    throw new Error("La respuesta del listado de administradores no es válida.");
  }
  return response.data.data;
};

export const getAdminAccountDetail = async (id: string, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiEnvelope<AdminAccountDetail>>(
    `${SUPER_ADMIN_ACCOUNTS_URL}/admins/${encodeURIComponent(id)}`,
    { headers: defaultHeaders, signal }
  );
  if (!response.data.data || !Array.isArray(response.data.data.admin_permissions)) {
    throw new Error("La respuesta de permisos del administrador no es válida.");
  }
  return response.data.data;
};

export const updateAdminPermissions = async (
  id: string,
  action: "assign" | "revoke",
  permissions: AdminPermission[]
) => {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    `${SUPER_ADMIN_ACCOUNTS_URL}/admins/${encodeURIComponent(id)}/permissions/${action}`,
    { permissions },
    { headers: defaultHeaders }
  );
  return response.data;
};

export const getModelAccounts = async (status?: AdminAccountStatus, signal?: AbortSignal) => {
  const response = await apiClient.get<ApiEnvelope<ModelAccountSummary[]>>(
    `${SUPER_ADMIN_ACCOUNTS_URL}/models`,
    { params: { status }, headers: defaultHeaders, signal }
  );
  if (!Array.isArray(response.data.data)) {
    throw new Error("La respuesta del listado de modelos no es válida.");
  }
  return response.data.data;
};

export const moderateAccount = async (
  kind: "admins" | "models",
  id: string,
  action: "suspend" | "unsuspend"
) => {
  const response = await apiClient.patch<ApiEnvelope<unknown>>(
    `/v1/admin/accounts/${kind}/${encodeURIComponent(id)}/${action}`,
    undefined,
    { headers: defaultHeaders }
  );
  return response.data;
};
