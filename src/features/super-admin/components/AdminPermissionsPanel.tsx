import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner } from "@heroui/react";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { ADMIN_PERMISSION_GROUPS, getAdminPermissionMetadata, type AdminPermission } from "@/features/auth/constants/adminPermissions";
import { PermissionsSelector } from "@/features/super-admin/components/PermissionsSelector";
import { useAdminPermissionsCatalog } from "@/features/super-admin/hooks/useAdminPermissionsCatalog";
import { getAdminAccountDetail, updateAdminPermissions } from "@/features/super-admin/services/superAdminAccountsService";
import type { AdminAccountDetail } from "@/features/super-admin/types/adminAccounts";
import { useNotification } from "@/hooks/useNotification";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

type Props = { id: string; email: string; onClose: () => void };

export const AdminPermissionsPanel = ({ id, email, onClose }: Props) => {
  const catalog = useAdminPermissionsCatalog();
  const { success, error: notifyError } = useNotification();
  const [detail, setDetail] = useState<AdminAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState<"assign" | "revoke">("assign");
  const [selected, setSelected] = useState<AdminPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getAdminAccountDetail(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDetail(result);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        setLoadError(getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudieron cargar los permisos actuales.",
        }));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, revision]);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    setRevision((value) => value + 1);
  };

  const current = detail?.admin_permissions ?? [];
  const available = action === "assign"
    ? Array.from(new Set([...catalog.permissions, ...current]))
    : current;
  const changes = selected.filter((permission) =>
    action === "assign" ? !current.includes(permission) : current.includes(permission)
  );
  const taskLabels = Array.from(new Set(current.map((permission) => {
    const metadata = getAdminPermissionMetadata(permission);
    return metadata.group === "OTHER"
      ? metadata.label
      : ADMIN_PERMISSION_GROUPS.find((group) => group.id === metadata.group)?.label ?? metadata.label;
  })));

  const submit = async () => {
    if (changes.length === 0 || saving) return;
    setSaving(true);
    try {
      const response = await updateAdminPermissions(id, action, changes);
      success({
        title: action === "assign" ? "Permisos asignados" : "Permisos revocados",
        description: response.message || "Los permisos se actualizaron correctamente.",
      });
      setSelected([]);
      setConfirming(false);
      reload();
    } catch (err: unknown) {
      notifyError({
        title: "No se pudieron actualizar los permisos",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "Intenta nuevamente.",
          conflictMessage: "Los permisos cambiaron o la operación ya estaba aplicada. Recarga los permisos actuales.",
        }),
      });
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label={`Permisos de ${email}`} className="rounded-3xl border vp-border vp-surface p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-[#FD0083]">Gestionar permisos</h3>
          <p className="mt-1 break-all font-semibold">{email}</p>
        </div>
        <Button variant="ghost" onPress={onClose} isDisabled={saving}>Cerrar detalle</Button>
      </div>
      {loading ? (
        <div role="status" className="mt-6 flex items-center gap-3"><Spinner size="sm" /> Cargando permisos actuales...</div>
      ) : loadError ? (
        <div role="alert" className="mt-6 space-y-3">
          <p className="text-rose-600 dark:text-rose-300">{loadError}</p>
          <Button onPress={reload}>Reintentar detalle</Button>
        </div>
      ) : detail && (
        <div className="mt-6 space-y-5">
          <p className="text-sm vp-text-secondary">
            {current.length} permisos asignados en {taskLabels.length} tareas. Selecciona una tarea para incluir sus acciones disponibles.
          </p>
          <div aria-label="Tareas actuales" className="flex flex-wrap gap-2">
            {taskLabels.map((label) => (
              <span key={label} className="rounded-full bg-[#00BCD4]/10 px-3 py-1 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                {label}
              </span>
            ))}
            {current.length === 0 && <span className="text-sm vp-text-secondary">Sin tareas asignadas.</span>}
          </div>
          <p className="rounded-xl border vp-border vp-surface-soft p-3 text-sm vp-text-secondary">
            Los cambios cerrarán las sesiones del administrador. Deberá iniciar sesión nuevamente para actualizar su menú.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="permission-action" className="font-semibold">Operación</label>
            <select
              id="permission-action"
              value={action}
              disabled={saving}
              onChange={(event) => {
                setAction(event.target.value === "revoke" ? "revoke" : "assign");
                setSelected([]);
              }}
              className="rounded-xl border vp-input px-4 py-3"
            >
              <option value="assign">Asignar tareas</option>
              <option value="revoke">Revocar tareas</option>
            </select>
            <Button variant="ghost" onPress={() => { setSelected([]); reload(); }} isDisabled={saving}>
              Recargar permisos
            </Button>
          </div>
          <PermissionsSelector
            available={available}
            value={selected}
            onChange={setSelected}
            loading={action === "assign" && catalog.loading}
            error={action === "assign" ? catalog.error : null}
            onRetry={() => void catalog.reload()}
            isDisabled={saving}
          />
          {action === "revoke" && current.length === 0 && (
            <p className="text-sm vp-text-secondary">Este administrador no tiene permisos para revocar.</p>
          )}
          <div className="flex justify-end border-t vp-border pt-5">
            <Button
              className="rounded-xl bg-[#FD0083] px-6 py-3 font-bold text-white"
              isDisabled={saving || changes.length === 0 || (action === "assign" && (catalog.loading || Boolean(catalog.error)))}
              onPress={() => action === "revoke" ? setConfirming(true) : void submit()}
            >
              {saving && <Spinner size="sm" color="current" />}
              {action === "assign" ? "Asignar tareas seleccionadas" : "Revocar tareas seleccionadas"}
            </Button>
          </div>
        </div>
      )}
      <ConfirmationDialog
        open={confirming}
        title="Revocar permisos"
        description={`Se revocarán ${changes.length} permisos de ${email}. Sus sesiones se cerrarán. Esta acción no elimina la cuenta.`}
        confirmLabel="Confirmar revocación"
        loading={saving}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void submit()}
      />
    </section>
  );
};
