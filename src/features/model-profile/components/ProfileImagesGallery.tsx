import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { useModelProfileAccess } from "@/features/account/hooks/useModelAccess";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNotification } from "@/hooks/useNotification";
import {
  deleteModelProfileMultimediaContentApi,
  getModelProfileMultimediaContentApi,
  type ModelProfileMultimediaContent,
} from "@/features/model-profile/services/modelProfileService";

type ProfileImagesGalleryProps = {
  refreshToken: number;
};

export const ProfileImagesGallery = ({ refreshToken }: ProfileImagesGalleryProps) => {
  const confirm = useConfirmDialog();
  const { success, error: notifyError } = useNotification();
  const { accountApproved, hasProfile, hasCompletedOnboarding } = useModelProfileAccess();

  const [images, setImages] = useState<ModelProfileMultimediaContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);

  const loadProfileImages = useCallback(async () => {
    if (!accountApproved || !hasProfile || !hasCompletedOnboarding) {
      setImages([]);
      setHasLoaded(true);
      return;
    }

    try {
      setIsLoading(true);
      const multimediaContent = await getModelProfileMultimediaContentApi("IMAGE");
      setImages(multimediaContent);
      setHasLoaded(true);
    } catch {
      setImages([]);
      setHasLoaded(true);
      notifyError({
        title: "No pudimos cargar tus fotos por ahora.",
        description: "Intenta nuevamente en unos momentos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountApproved, hasCompletedOnboarding, hasProfile, notifyError]);

  useEffect(() => {
    void loadProfileImages();
  }, [loadProfileImages, refreshToken]);

  const handleDeleteProfileImage = async (contentId: string) => {
    const confirmed = await confirm({
      title: "Eliminar foto",
      description: "Esta foto dejará de mostrarse en tu perfil.",
      tone: "warning",
      cancelLabel: "Conservar",
      confirmLabel: "Eliminar",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingContentId(contentId);
      await deleteModelProfileMultimediaContentApi(contentId);
      setImages((currentImages) => currentImages.filter((image) => image.id !== contentId));
      success({
        title: "Foto eliminada",
        description: "Tu foto se eliminó correctamente.",
      });
    } catch {
      notifyError({
        title: "No pudimos eliminar la foto.",
        description: "Intenta nuevamente en unos momentos.",
      });
    } finally {
      setDeletingContentId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">Tus fotos del perfil</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-white/80">
            Tus fotos son la primera impresión de tu perfil.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadProfileImages();
          }}
          disabled={isLoading}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center dark:border-white/20 dark:bg-white/5">
          <p className="text-sm text-slate-600 dark:text-white/75">Cargando tus fotos...</p>
        </div>
      ) : !hasLoaded ? null : !accountApproved || !hasProfile || !hasCompletedOnboarding ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center dark:border-white/20 dark:bg-white/5">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-500 dark:border-white/20 dark:bg-white/10 dark:text-white/70">
            <AppIcon name="info" className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Aún no tienes fotografías.</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/75">
            Sube tus primeras imágenes para que aparezcan aquí.
          </p>
        </div>
      ) : images.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center dark:border-white/20 dark:bg-white/5">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-500 dark:border-white/20 dark:bg-white/10 dark:text-white/70">
            <AppIcon name="info" className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Aún no tienes fotografías.</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/75">
            Sube tus primeras imágenes para que aparezcan aquí.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => {
            const isDeletingImage = deletingContentId === image.id;

            return (
              <article
                key={image.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-white/10 dark:shadow-black/10"
              >
                <img src={image.contentUrl} alt="Foto del perfil" className="h-36 w-full object-cover" />

                <div className="border-t border-slate-200 p-3 dark:border-white/10">
                  <p className="text-[11px] text-slate-500 dark:text-white/65">
                    Subida: {new Date(image.createdAt).toLocaleDateString("es-CO")}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteProfileImage(image.id);
                    }}
                    disabled={isDeletingImage}
                    className="mt-2 w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-400/35 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                  >
                    {isDeletingImage ? "Eliminando..." : "Eliminar foto"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};