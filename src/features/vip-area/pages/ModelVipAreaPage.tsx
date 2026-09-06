import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { InfoCard } from "@/components/common/InfoCard";
import { useModelProfileAccess } from "@/features/account/hooks/useModelAccess";
import { ClientVipAreaPanel } from "@/features/vip-area/components/ClientVipAreaPanel";

const normalizeVipAreaId = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized || null;
};

export const ModelVipAreaPage = () => {
  const { vipAreaId: routeVipAreaId } = useParams();
  const { profile } = useModelProfileAccess();

  const resolvedVipAreaId = useMemo(() => {
    return (
      normalizeVipAreaId(routeVipAreaId) ||
      normalizeVipAreaId(profile?.vipAreaId)
    );
  }, [profile?.vipAreaId, routeVipAreaId]);

  if (!resolvedVipAreaId) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6 md:p-10">
        <InfoCard
          title="Selecciona un Area VIP desde el catalogo"
          description="Abre una card de modelo con Area VIP y usa el boton VIP para ver su contenido o suscribirte."
          tone="info"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-10">
      <div className="flex items-center gap-3">
        <span className="h-[2px] flex-1 bg-[#9f3ed5]/70" />
        <h1 className="text-3xl font-black tracking-wide text-[#9f3ed5]">Area VIP</h1>
        <span className="h-[2px] flex-1 bg-[#9f3ed5]/70" />
      </div>

      <ClientVipAreaPanel vipAreaId={resolvedVipAreaId} />
    </div>
  );
};