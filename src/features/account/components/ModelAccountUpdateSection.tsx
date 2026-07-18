import { useEffect } from "react";
import type { ModelAccountMe } from "../../../services/accountSettingsService";
import { InfoCard } from "../../../components/InfoCard";
import { SkeletonLoader } from "../../../components/SkeletonLoader";
import { StatusBadge } from "../../../components/StatusBadge";
import { useNotification } from "../../../hooks/useNotification";

type Props = {
  profile: ModelAccountMe | null;
  loadingProfile: boolean;
  profileError: string;
  onReload: () => void;
};

export const ModelAccountUpdateSection = ({
  profile,
  loadingProfile,
  profileError,
  onReload,
}: Props) => {
  const { error: notifyError } = useNotification();

  useEffect(() => {
    if (!profileError) {
      return;
    }

    notifyError({
      title: "No pudimos cargar tu información",
      description: profileError,
    });
  }, [notifyError, profileError]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#FD0083]">Informacion personal de la cuenta</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
            Informacion basica de tu cuenta autenticada.
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loadingProfile}
          className="px-4 py-2 rounded-xl bg-[#00BCD4] text-[#012a33] text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loadingProfile ? "Cargando..." : "Recargar"}
        </button>
      </div>

      <div className="mt-4">
        <InfoCard
          title="Tus datos de cuenta"
          description="Aquí puedes revisar la información principal asociada a tu cuenta actual."
        />
      </div>
      {!profileError && loadingProfile && (
        <div className="mt-6">
          <SkeletonLoader rows={3} />
        </div>
      )}

      {!loadingProfile && profile && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
            <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Nombre</p>
            <p className="mt-1 text-lg font-semibold">{profile.name || "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
            <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Apellido</p>
            <p className="mt-1 text-lg font-semibold">{profile.lastname || "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4 md:col-span-2">
            <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Correo</p>
            <p className="mt-1 text-lg font-semibold break-all">{profile.email || "-"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
            <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Estado</p>
            <div className="mt-2">
              <StatusBadge status={profile.status} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
            <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide">Creada</p>
            <p className="mt-1 text-lg font-semibold">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
