import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { InfoCard } from "@/components/common/InfoCard";
import { useModelProfileAccess } from "@/features/account/hooks/useModelAccess";

const normalizeVipAreaId = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized || null;
};

export const VipChatPage = () => {
  const { vipAreaId: routeVipAreaId } = useParams();
  const { profile, isLoading, hasResolvedAccess } = useModelProfileAccess();

  const resolvedVipAreaId = useMemo(() => {
    return (
      normalizeVipAreaId(routeVipAreaId) ||
      normalizeVipAreaId(profile?.vipAreaId)
    );
  }, [profile?.vipAreaId, routeVipAreaId]);

  if (isLoading && !hasResolvedAccess && !resolvedVipAreaId) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
        <InfoCard
          title="Cargando contexto VIP"
          description="Estamos identificando automaticamente tu Area VIP."
          tone="info"
        />
      </div>
    );
  }

  if (resolvedVipAreaId) {
    return <Navigate to={`/vip/${resolvedVipAreaId}`} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
      <InfoCard
        title="Chat VIP pendiente"
        description="No encontramos un Area VIP asociada a la sesion actual y tampoco hay endpoints de ChatVIP disponibles para integrarlo todavia."
        tone="info"
      />
    </div>
  );
};
