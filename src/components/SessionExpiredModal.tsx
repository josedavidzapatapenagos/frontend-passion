import { AppIcon } from "./AppIcon";

type Props = {
  open: boolean;
  onConfirm: () => void;
};

export const SessionExpiredModal = ({ open, onConfirm }: Props) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-[#012a33]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-300">
            <AppIcon name="shield" className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sesión expirada</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-white/75">
              Por motivos de seguridad tu sesión finalizó.
              <br />
              Debes iniciar sesión nuevamente para continuar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-8 w-full rounded-2xl bg-[#FD0083] px-5 py-4 text-sm font-black uppercase tracking-widest text-white hover:opacity-90"
        >
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
};