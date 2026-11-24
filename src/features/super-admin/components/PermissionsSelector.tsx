import { useMemo } from "react";
import { Button, Checkbox, Chip, Description, Spinner } from "@heroui/react";
import {
  ADMIN_PERMISSION_GROUPS,
  getAdminPermissionMetadata,
  type AdminPermission,
  type AdminPermissionGroupId,
} from "@/features/auth/constants/adminPermissions";

type PermissionsSelectorProps = {
  available: AdminPermission[];
  value: AdminPermission[];
  onChange: (value: AdminPermission[]) => void;
  loading?: boolean;
  error?: string | null;
  invalidMessage?: string | null;
  isDisabled?: boolean;
  onRetry?: () => void;
};

type PermissionGroup = {
  id: AdminPermissionGroupId;
  label: string;
  permissions: AdminPermission[];
};

const CheckboxBox = () => (
  <Checkbox.Control>
    <Checkbox.Indicator />
  </Checkbox.Control>
);

export const PermissionsSelector = ({
  available,
  value,
  onChange,
  loading = false,
  error,
  invalidMessage,
  isDisabled = false,
  onRetry,
}: PermissionsSelectorProps) => {
  const groups = useMemo<PermissionGroup[]>(() => {
    const byGroup = new Map<AdminPermissionGroupId, AdminPermission[]>();

    available.forEach((permission) => {
      const { group } = getAdminPermissionMetadata(permission);
      byGroup.set(group, [...(byGroup.get(group) ?? []), permission]);
    });

    const knownGroups = ADMIN_PERMISSION_GROUPS.filter((group) => group.id !== "OTHER" && byGroup.has(group.id)).map((group) => ({
      ...group,
      permissions: byGroup.get(group.id) ?? [],
    }));
    const otherGroups = (byGroup.get("OTHER") ?? []).map((permission) => ({
      id: "OTHER" as const,
      label: getAdminPermissionMetadata(permission).label,
      permissions: [permission],
    }));
    return [...knownGroups, ...otherGroups];
  }, [available]);

  const selected = useMemo(() => new Set(value), [value]);
  const allSelected = available.length > 0 && available.every((permission) => selected.has(permission));

  const replaceGroupSelection = (group: PermissionGroup, groupValue: AdminPermission[]) => {
    const others = value.filter((permission) => !group.permissions.includes(permission));
    onChange([...others, ...groupValue]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border vp-border vp-surface-soft p-5 text-sm vp-text-secondary">
        <Spinner size="sm" color="current" className="text-[#FD0083]" />
        Cargando permisos disponibles...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
        <span>{error}</span>
        {onRetry && (
          <Button size="sm" variant="danger-soft" onPress={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="rounded-2xl border vp-border vp-surface-soft p-5 text-sm vp-text-secondary">
        No hay permisos disponibles para asignar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          isSelected={allSelected}
          isIndeterminate={!allSelected && value.length > 0}
          isDisabled={isDisabled}
          onChange={(checked) => onChange(checked ? [...available] : [])}
        >
          <CheckboxBox />
          <Checkbox.Content>
            <span className="font-semibold vp-text-primary">Seleccionar todas las tareas</span>
          </Checkbox.Content>
        </Checkbox>

        <Chip size="sm" variant="soft" className="bg-[#FD0083]/10 text-[#FD0083]">
          {groups.filter((group) => group.permissions.every((permission) => selected.has(permission))).length} de {groups.length} tareas seleccionadas
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const groupSelected = group.permissions.filter((permission) => selected.has(permission));
          const isGroupFull = groupSelected.length === group.permissions.length;

          return (
            <section key={`${group.id}:${group.label}`} className="rounded-2xl border vp-border vp-surface-soft p-4">
              <Checkbox
                isSelected={isGroupFull}
                isIndeterminate={!isGroupFull && groupSelected.length > 0}
                isDisabled={isDisabled}
                onChange={(checked) => replaceGroupSelection(group, checked ? group.permissions : [])}
                aria-label={group.label}
              >
                <CheckboxBox />
                <Checkbox.Content>
                  <span className="text-sm font-bold uppercase tracking-wide text-[#00BCD4]">
                    {group.label}
                  </span>
                  <Description className="text-xs vp-text-secondary">
                    Incluye todas las acciones disponibles de esta tarea.
                  </Description>
                </Checkbox.Content>
              </Checkbox>
            </section>
          );
        })}
      </div>

      {invalidMessage && <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{invalidMessage}</p>}
    </div>
  );
};
