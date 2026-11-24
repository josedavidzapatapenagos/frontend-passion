import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import type { AdminPermission } from "@/features/auth/constants/adminPermissions";
import { getAvailableAdminPermissions } from "@/features/super-admin/services/superAdminAccountsService";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

export const useAdminPermissionsCatalog = () => {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await getAvailableAdminPermissions(controller.signal);
      setPermissions(result);
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      setError(
        getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudieron cargar los permisos disponibles.",
          forbiddenMessage: "No tienes permisos para consultar los permisos administrativos.",
        })
      );
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { permissions, loading, error, reload: load };
};
