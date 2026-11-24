import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner } from "@heroui/react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { AdminPermissionsPanel } from "@/features/super-admin/components/AdminPermissionsPanel";
import { getAdminAccounts, getModelAccounts, moderateAccount } from "@/features/super-admin/services/superAdminAccountsService";
import type { AdminAccountStatus, AdminAccountSummary, ModelAccountSummary } from "@/features/super-admin/types/adminAccounts";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import { useNotification } from "@/hooks/useNotification";

const STATUS_OPTIONS: { value: AdminAccountStatus; label: string }[] = [
  { value: "PENDING_VERIFICATION", label: "Pendiente de verificación" },
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "SUSPENDED", label: "Suspendido" },
];

const AccountManagementPage = ({ kind }: { kind: "admins" | "models" }) => {
  const isModels = kind === "models";
  const { success, error: notifyError } = useNotification();
  const [accounts, setAccounts] = useState<(AdminAccountSummary | ModelAccountSummary)[]>([]);
  const [status, setStatus] = useState<AdminAccountStatus | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<AdminAccountSummary | null>(null);
  const [moderation, setModeration] = useState<{
    account: AdminAccountSummary;
    action: "suspend" | "unsuspend";
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAccounts = kind === "models" ? getModelAccounts : getAdminAccounts;
    fetchAccounts(status, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setAccounts(result);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        setError(getUserFacingErrorMessage(err, {
          defaultMessage: kind === "models" ? "No se pudo cargar el listado de modelos." : "No se pudo cargar el listado de administradores.",
          forbiddenMessage: "Solo un superadministrador puede consultar este listado.",
        }));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, revision, kind]);

  const reload = () => {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  };

  const confirmModeration = async () => {
    if (!moderation || saving) return;
    setSaving(true);
    try {
      const response = await moderateAccount(kind, moderation.account.id, moderation.action);
      success({
        title: moderation.action === "suspend" ? "Cuenta suspendida" : "Suspensión removida",
        description: response.message || "El estado de la cuenta se actualizó correctamente.",
      });
      setModeration(null);
      reload();
    } catch (err: unknown) {
      notifyError({
        title: "No se pudo actualizar el estado",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudo completar la operación.",
          conflictMessage: "El estado de la cuenta cambió. Actualiza el listado antes de reintentar.",
          notFoundMessage: "La cuenta ya no está disponible.",
          forbiddenMessage: "No tienes autorización para modificar el estado de esta cuenta.",
        }),
      });
      setModeration(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh p-4 sm:p-6 lg:p-10 vp-text-primary">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="min-w-0 rounded-3xl border vp-border vp-surface p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#FD0083] md:text-3xl">{isModels ? "Modelos" : "Administradores"}</h2>
              <p className="mt-2 vp-text-secondary">
                {isModels ? "Consulta las cuentas de modelos y gestiona su suspensión." : "Consulta las cuentas administrativas y gestiona sus tareas autorizadas."}
              </p>
            </div>
            {!isModels && (
            <Link to="/superadmin/admins/create" className="rounded-xl bg-[#FD0083] px-5 py-3 font-bold text-white">
              Crear administrador
            </Link>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label htmlFor="admin-status" className="text-sm font-semibold">Estado</label>
            <select
              id="admin-status"
              value={status ?? ""}
              disabled={Boolean(selected) || Boolean(moderation)}
              className="rounded-xl border vp-input px-4 py-3"
              onChange={(event) => {
                const next = STATUS_OPTIONS.find((option) => option.value === event.target.value);
                setStatus(next?.value);
                setError(null);
                setLoading(true);
              }}
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <Button variant="ghost" onPress={reload} isDisabled={loading || Boolean(moderation)}>Actualizar listado</Button>
          </div>
          {loading ? (
            <div role="status" className="mt-6 flex items-center gap-3"><Spinner size="sm" /> {isModels ? "Cargando modelos..." : "Cargando administradores..."}</div>
          ) : error ? (
            <div role="alert" className="mt-6 space-y-3">
              <p className="text-rose-600 dark:text-rose-300">{error}</p>
              <Button onPress={reload}>Reintentar listado</Button>
            </div>
          ) : accounts.length === 0 ? (
            <p className="mt-6 rounded-2xl border vp-border vp-surface-soft p-6 vp-text-secondary">
              {isModels ? "No hay modelos para el estado seleccionado." : "No hay administradores para el estado seleccionado."}
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border vp-border">
              <table className="vp-account-table w-full text-left text-sm">
                <caption className="sr-only">{isModels ? "Cuentas de modelos disponibles" : "Cuentas de administrador disponibles"}</caption>
                <thead className="vp-surface-soft">
                  <tr>
                    {isModels && <th scope="col" className="p-4">Nombre</th>}
                    <th scope="col" className="p-4">Correo electrónico</th>
                    <th scope="col" className="p-4">Estado</th>
                    <th scope="col" className="p-4">Fecha de creación</th>
                    <th scope="col" className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-t vp-border">
                      {isModels && (
                        <td data-label="Nombre" className="p-4 font-semibold">
                          {"name" in account ? `${account.name} ${account.lastname}`.trim() : ""}
                        </td>
                      )}
                      <td data-label="Correo electrónico" className="p-4 font-semibold">{account.email}</td>
                      <td data-label="Estado" className="p-4"><StatusBadge status={account.status} /></td>
                      <td data-label="Fecha de creación" className="whitespace-nowrap p-4">
                        {new Date(account.created_at).toLocaleString("es-CO")}
                      </td>
                      <td data-label="Acciones" className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {!isModels && <Button
                            variant="ghost"
                            className="font-bold text-[#FD0083]"
                            isDisabled={Boolean(selected) || Boolean(moderation)}
                            onPress={() => setSelected(account)}
                            aria-label={`Gestionar permisos de ${account.email}`}
                          >
                            Gestionar permisos
                          </Button>}
                          {(account.status === "ACTIVE" || (!isModels && account.status === "PENDING_VERIFICATION")) && (
                            <Button
                              variant="danger-soft"
                              className="rounded-xl font-bold"
                              isDisabled={Boolean(selected) || Boolean(moderation)}
                              onPress={() => setModeration({ account, action: "suspend" })}
                              aria-label={`Suspender cuenta de ${account.email}`}
                            >
                              Suspender
                            </Button>
                          )}
                          {account.status === "SUSPENDED" && (
                            <Button
                              variant="ghost"
                              className="rounded-xl font-bold text-cyan-700 dark:text-cyan-200"
                              isDisabled={Boolean(selected) || Boolean(moderation)}
                              onPress={() => setModeration({ account, action: "unsuspend" })}
                              aria-label={`Quitar suspensión de ${account.email}`}
                            >
                              Quitar suspensión
                            </Button>
                          )}
                          {isModels && account.status !== "ACTIVE" && account.status !== "SUSPENDED" && (
                            <span className="text-sm vp-text-secondary">Sin acciones disponibles</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {selected && (
          <AdminPermissionsPanel
            key={selected.id}
            id={selected.id}
            email={selected.email}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
      <ConfirmationDialog
        open={Boolean(moderation)}
        title={moderation?.action === "suspend" ? (isModels ? "Suspender modelo" : "Suspender administrador") : "Quitar suspensión"}
        description={moderation?.action === "suspend"
          ? `Se bloqueará el acceso de ${moderation.account.email} mientras la cuenta esté suspendida. No se eliminará la cuenta ni sus permisos.`
          : `Se habilitará nuevamente el acceso de ${moderation?.account.email}. ${isModels
            ? "El backend requiere correo verificado e identidad aprobada."
            : "El backend requiere que su correo esté verificado."}`}
        confirmLabel={moderation?.action === "suspend" ? "Confirmar suspensión" : "Confirmar reactivación"}
        loading={saving}
        onCancel={() => setModeration(null)}
        onConfirm={() => void confirmModeration()}
      />
    </div>
  );
};

export const AdminAccountsPage = () => <AccountManagementPage kind="admins" />;
export const ModelAccountsPage = () => <AccountManagementPage kind="models" />;
