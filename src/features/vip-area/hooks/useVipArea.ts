import axios from "axios";
import { useCallback, useState } from "react";
import { getBackendErrorMessage, getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import { getVipAreaContents, getVipAreaInfo } from "@/features/vip-area/services/vipAreaService";
import type { VipAreaContent, VipAreaError, VipAreaInfo } from "@/features/vip-area/types/vipArea";

type UseVipAreaState = {
  info: VipAreaInfo | null;
  contents: VipAreaContent[];
  loading: boolean;
  error: VipAreaError | null;
};

const FORBIDDEN_MESSAGE = "No tienes una suscripcion activa para acceder a esta Area VIP.";
const UNAUTHORIZED_MESSAGE = "Inicia sesion para suscribirte o acceder al contenido de esta Area VIP.";
const NOT_FOUND_MESSAGE = "Esta Area VIP no esta disponible actualmente.";

const mapVipAreaError = (error: unknown): VipAreaError => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const backendMessage = getBackendErrorMessage(error);

  if (status === 401) {
    return {
      code: "FORBIDDEN",
      status,
      message: UNAUTHORIZED_MESSAGE,
      backendMessage,
    };
  }

  if (status === 403) {
    return {
      code: "FORBIDDEN",
      status,
      message: FORBIDDEN_MESSAGE,
      backendMessage,
    };
  }

  if (status === 404) {
    return {
      code: "NOT_FOUND",
      status,
      message: NOT_FOUND_MESSAGE,
      backendMessage,
    };
  }

  if (axios.isAxiosError(error) && !error.response) {
    return {
      code: "NETWORK",
      message: "No pudimos comunicarnos con el servidor para cargar el Area VIP.",
      backendMessage,
    };
  }

  return {
    code: "UNKNOWN",
    status,
    message: getUserFacingErrorMessage(error, {
      defaultMessage: "No fue posible cargar el Area VIP en este momento.",
      forbiddenMessage: FORBIDDEN_MESSAGE,
      notFoundMessage: NOT_FOUND_MESSAGE,
      badRequestMessage: "La solicitud no es valida. Revisa la informacion e intentalo nuevamente.",
      allowBackendMessageForBadRequest: false,
      allowBackendMessageForForbidden: false,
    }),
    backendMessage,
  };
};

export const useVipArea = () => {
  const [state, setState] = useState<UseVipAreaState>({
    info: null,
    contents: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async (vipAreaId: string) => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const info = await getVipAreaInfo(vipAreaId);

      try {
        const contents = await getVipAreaContents(vipAreaId);
        setState({ info, contents, loading: false, error: null });
      } catch (contentError) {
        const mappedError = mapVipAreaError(contentError);
        setState({ info, contents: [], loading: false, error: mappedError });
      }
    } catch (infoError) {
      const mappedError = mapVipAreaError(infoError);
      setState({ info: null, contents: [], loading: false, error: mappedError });
    }
  }, []);

  const reload = useCallback(async (vipAreaId: string) => {
    await load(vipAreaId);
  }, [load]);

  return {
    info: state.info,
    contents: state.contents,
    loading: state.loading,
    error: state.error,
    load,
    reload,
  };
};
