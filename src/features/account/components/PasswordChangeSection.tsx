import { useEffect } from "react";
import type { FormEvent } from "react";
import { InfoCard } from "@/components/common/InfoCard";
import { useNotification } from "@/hooks/useNotification";

type Props = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  changingPassword: boolean;
  passwordError: string;
  passwordMessage: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export const PasswordChangeSection = ({
  currentPassword,
  newPassword,
  confirmPassword,
  changingPassword,
  passwordError,
  passwordMessage,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: Props) => {
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    if (!passwordMessage) {
      return;
    }

    success({
      title: "Contraseña actualizada",
      description: passwordMessage,
    });
  }, [passwordMessage, success]);

  useEffect(() => {
    if (!passwordError) {
      return;
    }

    notifyError({
      title: "No pudimos cambiar la contraseña",
      description: passwordError,
    });
  }, [notifyError, passwordError]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
      <h3 className="text-lg font-black text-[#FD0083]">Cambiar contraseña</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
        Ingresa tu contraseña actual y define una nueva contraseña segura.
      </p>

      <div className="mt-4">
        <InfoCard
          title="Consejo de seguridad"
          description="Usa una contraseña nueva y evita reutilizar claves de otros servicios."
        />
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Contraseña actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
            className="w-full bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Tu contraseña actual"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            className="w-full bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="w-full bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
            placeholder="Repite la nueva contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="px-5 py-3 rounded-xl bg-[#FD0083] text-white font-black disabled:opacity-50 hover:opacity-90 transition-all w-full"
        >
          {changingPassword ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
};
