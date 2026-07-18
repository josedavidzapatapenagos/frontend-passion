import { useNavigate } from "react-router-dom";
import { InfoCard } from "../../components/InfoCard";
import { ModelAdForm } from "../../features/model-ads/components/ModelAdForm";
import { useModelAdForm } from "../../features/model-ads/hooks/useModelAdForm";

export const CreateModelAdPage = () => {
  const navigate = useNavigate();
  const accountType = localStorage.getItem("accountType");
  const normalizedAccountType = accountType
    ?.toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");
  const isModel = normalizedAccountType === "MODEL";

  const form = useModelAdForm({
    enabled: isModel,
    mode: "create",
  });

  if (!isModel) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20">
          <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">Crear anuncio</h2>
          <p className="mt-4 text-slate-700 dark:text-white/80">
            Esta seccion solo esta disponible para cuentas MODEL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <InfoCard
            title="Crear publicación"
            description="Completa la información con calma. Cuando envíes el anuncio, nuestro equipo lo revisará antes de publicarlo."
          />
        </div>
        <ModelAdForm
          form={form}
          mode="create"
          headerTitle="Crear anuncio"
          headerDescription="Tu anuncio será revisado antes de publicarse."
          onCancel={() => navigate("/ads")}
          cancelLabel="Volver a mis posts"
          submitLabel="Crear publicacion"
        />
      </div>
    </div>
  );
};