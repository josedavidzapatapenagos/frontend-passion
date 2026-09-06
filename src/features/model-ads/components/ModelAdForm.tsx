import { useEffect } from "react";
import type { ModelAdMode } from "@/features/model-ads/types/modelAds";
import { EmptyState } from "@/components/common/EmptyState";
import { InfoCard } from "@/components/common/InfoCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNotification } from "@/hooks/useNotification";
import { AppIcon } from "@/components/ui/AppIcon";
import { MODEL_AD_STATIC_SERVICES } from "@/features/model-ads/hooks/useModelAdForm";
import type { UseModelAdFormReturn } from "@/features/model-ads/hooks/useModelAdForm";

type Props = {
  form: UseModelAdFormReturn;
  mode: ModelAdMode;
  headerTitle: string;
  headerDescription: string;
  onCancel: () => void;
  cancelLabel: string;
  submitLabel: string;
  requireConfirmation?: boolean;
  confirmationText?: string;
  showDeactivateAction?: boolean;
  onDeactivate?: () => void;
  deactivating?: boolean;
};

export const ModelAdForm = ({
  form,
  mode,
  headerTitle,
  headerDescription,
  onCancel,
  cancelLabel,
  submitLabel,
  requireConfirmation = false,
  confirmationText,
  showDeactivateAction = false,
  onDeactivate,
  deactivating = false,
}: Props) => {
  const confirm = useConfirmDialog();
  const { success, error: notifyError } = useNotification();
  const hasReachedPostPhotosLimit = mode === "edit" && form.postPhotos.length >= 5;

  useEffect(() => {
    if (!form.loadError) {
      return;
    }

    notifyError({
      title: "No pudimos preparar el formulario",
      description: form.loadError,
    });
  }, [form.loadError, notifyError]);

  useEffect(() => {
    if (!form.submitMessage) {
      return;
    }

    success({
      title: "Acción completada",
      description: form.submitMessage,
    });
  }, [form.submitMessage, success]);

  useEffect(() => {
    if (!form.submitError) {
      return;
    }

    notifyError({
      title: "No pudimos guardar el anuncio",
      description: form.submitError,
    });
  }, [form.submitError, notifyError]);

  useEffect(() => {
    if (!form.photosError) {
      return;
    }

    notifyError({
      title: "No pudimos actualizar las fotografías",
      description: form.photosError,
    });
    form.clearPhotosError();
  }, [form, notifyError]);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (requireConfirmation && mode === "edit") {
      const confirmed = await confirm({
        title: "Guardar cambios importantes",
        description:
          confirmationText ||
          "Al guardar los cambios, la publicación volverá a revisión y dejará de mostrarse hasta ser aprobada nuevamente.",
        tone: "warning",
        confirmLabel: "Guardar cambios",
      });

      if (!confirmed) {
        return;
      }
    }

    await form.submitForm();
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">{headerTitle}</h2>
        <p className="mt-2 text-slate-600 dark:text-white/70">{headerDescription}</p>
      </div>

      {form.loadingData ? (
        <div className="mt-6 space-y-4">
          <InfoCard
            title="Estamos preparando el formulario"
            description="Cargando catálogos, contenido multimedia y datos de la publicación."
          />
          <SkeletonLoader rows={5} />
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
          <InfoCard
            title="Selecciona un catálogo"
            description="Elige el país donde deseas publicar tu anuncio."
          />

          <div>
            <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Titulo</label>
            <input
              value={form.title}
              onChange={(event) => form.setTitle(event.target.value)}
              disabled={form.submitting || form.loadingData}
              className="w-full bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
              placeholder="Ej: Servicio virtual premium"
            />
            {form.formErrors.title && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-300">{form.formErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Descripcion</label>
            <textarea
              value={form.description}
              onChange={(event) => form.setDescription(event.target.value)}
              disabled={form.submitting || form.loadingData}
              className="w-full min-h-32 bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
              placeholder="Describe tu publicacion"
            />
            {form.formErrors.description && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-300">{form.formErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-white/70 mb-2">Precio</label>
            <InfoCard
              title="Precio final"
              description="Ingresa el precio final que verán los usuarios."
              tone="info"
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.priceAmount}
              onChange={(event) => form.setPriceAmount(event.target.value)}
              disabled={form.submitting || form.loadingData}
              className="w-full md:w-56 bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
            />
            {form.formErrors.priceAmount && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-300">{form.formErrors.priceAmount}</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-white/70">Catalogo destino</p>
            <button
              type="button"
              onClick={() => form.setCatalogOpen((prev) => !prev)}
              disabled={form.submitting || form.loadingData || form.catalogs.length === 0}
              className="w-full md:w-[340px] flex items-center justify-between gap-2 border border-slate-300 dark:border-white/30 rounded-lg px-4 py-3 bg-white/70 dark:bg-white/10"
            >
              <span className="flex items-center gap-3">
                <span className="font-semibold text-slate-800 dark:text-white">
                  {form.selectedCatalog
                    ? `${form.selectedCatalog.name} - ${form.selectedCatalog.currency}`
                    : "Selecciona un pais"}
                </span>
              </span>
              <span className="text-slate-500 dark:text-white/70">▾</span>
            </button>
            {form.formErrors.catalogId && (
              <p className="text-xs text-red-700 dark:text-red-300">{form.formErrors.catalogId}</p>
            )}

            {form.catalogOpen && (
              <div className="w-full md:w-[340px] border border-slate-300 dark:border-white/30 rounded-lg bg-white dark:bg-[#0b3a44] overflow-hidden">
                {form.catalogs.map((catalog) => {
                  const selected = catalog.id === form.catalogId;

                  return (
                    <button
                      key={catalog.id}
                      type="button"
                      onClick={() => {
                        form.setCatalogId(catalog.id);
                        form.setCatalogOpen(false);
                      }}
                      disabled={form.submitting || form.loadingData}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {catalog.countryFlagUrl ? (
                        <img
                          src={catalog.countryFlagUrl}
                          alt={`Bandera de ${catalog.name}`}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : null}
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          selected
                            ? "border-[#FD0083] bg-[#FD0083]"
                            : "border-slate-400 dark:border-white/60"
                        }`}
                      />
                      <span className="text-slate-800 dark:text-white font-semibold">
                        {catalog.name} - {catalog.currency}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-white/70">Portada (contenido multimedia)</p>
            <InfoCard
              title="Seleccionar portada"
              description="Esta será la imagen principal que verán los usuarios."
              tone="info"
            />
            {mode === "edit" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                    Fotografías del anuncio ({form.postPhotos.length}/5)
                  </p>
                  <button
                    type="button"
                    onClick={() => form.setPhotoPickerOpen((prev) => !prev)}
                    disabled={form.photosBusy || form.submitting || form.loadingData || hasReachedPostPhotosLimit}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00BCD4] px-4 py-2 text-xs font-black text-[#012a33] hover:opacity-90 disabled:opacity-60"
                  >
                    <AppIcon name="check" className="h-4 w-4" />
                    {hasReachedPostPhotosLimit ? "Límite alcanzado" : "Agregar fotografía"}
                  </button>
                </div>

                {hasReachedPostPhotosLimit && (
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    Este anuncio ya tiene 5 fotografías, que es el máximo permitido.
                  </p>
                )}

                {form.postPhotos.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-white/65">
                    Este anuncio aún no tiene fotografías asociadas.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {form.postPhotos.map((content) => {
                      const isCover = form.coverPhotoContentId === content.id;

                      return (
                        <div
                          key={content.id}
                          className={`relative overflow-hidden rounded-xl border ${
                            isCover
                              ? "border-[#FD0083]"
                              : "border-slate-200 dark:border-white/10"
                          }`}
                        >
                          <img
                            src={content.contentUrl}
                            alt="Fotografía del anuncio"
                            className="h-28 w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/45 p-2">
                            <button
                              type="button"
                              onClick={() => form.setCoverPhotoContentId(content.id)}
                              disabled={form.photosBusy || form.submitting}
                              className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                                isCover
                                  ? "bg-[#FD0083] text-white"
                                  : "bg-white/90 text-slate-800"
                              }`}
                            >
                              {isCover ? "Portada" : "Marcar portada"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void form.removePhotoFromPost(content.id);
                              }}
                              disabled={form.photosBusy || form.submitting}
                              className="rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {form.photoPickerOpen && (
                  <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b3a44] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] font-bold text-slate-500 dark:text-white/60">
                      Selector multimedia
                    </p>

                    {form.contents.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                        No hay imágenes disponibles en tu biblioteca multimedia.
                      </p>
                    ) : (
                      <>
                        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                          {form.contents.map((content) => {
                            const selected = form.selectedPhotoIdsForAdd.includes(content.id);
                            const alreadyAdded = form.postPhotos.some((photo) => photo.id === content.id);

                            return (
                              <button
                                key={content.id}
                                type="button"
                                onClick={() => form.togglePhotoSelectionForAdd(content.id)}
                                disabled={alreadyAdded || form.photosBusy || form.submitting}
                                className={`relative overflow-hidden rounded-xl border-2 ${
                                  selected
                                    ? "border-[#FD0083]"
                                    : "border-slate-200 dark:border-white/10"
                                } disabled:opacity-50`}
                              >
                                <img src={content.contentUrl} alt="Contenido multimedia" className="h-24 w-full object-cover" />
                                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                                  {alreadyAdded ? "Agregada" : selected ? "Seleccionada" : "Disponible"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-4 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
                          <button
                            type="button"
                            onClick={() => form.setPhotoPickerOpen(false)}
                            disabled={form.photosBusy}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-white/20 dark:text-white"
                          >
                            Cerrar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void form.confirmAddPhotos();
                            }}
                            disabled={form.photosBusy || form.selectedPhotoIdsForAdd.length === 0}
                            className="rounded-lg bg-[#FD0083] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
                          >
                            {form.photosBusy ? "Agregando..." : "Agregar seleccionadas"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === "create" && form.contents.length === 0 ? (
              <EmptyState
                title="No tienes imágenes disponibles"
                description="Primero sube contenido a tu perfil para elegir una portada para el anuncio."
              />
            ) : mode === "create" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {form.contents.map((content) => {
                  const selected = form.coverPhotoContentId === content.id;

                  return (
                    <button
                      type="button"
                      key={content.id}
                      onClick={() => form.setCoverPhotoContentId(content.id)}
                      disabled={form.submitting || form.loadingData}
                      className={`relative rounded-xl overflow-hidden border-2 ${
                        selected ? "border-[#FD0083]" : "border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <img
                        src={content.contentUrl}
                        alt="Contenido de modelo"
                        className="w-full h-28 object-cover"
                      />
                      {selected && (
                        <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-[#FD0083] text-white font-bold">
                          PORTADA
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {form.formErrors.coverPhotoContentId && (
              <p className="text-xs text-red-700 dark:text-red-300">{form.formErrors.coverPhotoContentId}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-slate-600 dark:text-white/70 mb-2">Servicios</p>
            <InfoCard
              title="Servicios incluidos"
              description="Selecciona todos los servicios incluidos en la publicación."
              tone="info"
            />
            <div className="flex flex-col gap-3 md:max-w-2xl">
              <div className="flex flex-wrap gap-2">
                {MODEL_AD_STATIC_SERVICES.map((service) => {
                  const selected = form.services.includes(service);

                  return (
                  <button
                    type="button"
                    key={service}
                    onClick={() => form.toggleService(service)}
                    disabled={form.submitting || form.loadingData}
                    className={`px-3 py-2 rounded-full border text-xs font-bold transition ${
                      selected
                        ? "bg-[#FD0083] text-white border-[#FD0083]"
                        : "bg-white text-slate-700 border-slate-300 dark:bg-white/10 dark:text-white dark:border-white/20"
                    }`}
                  >
                    {service.replaceAll("_", " ")}
                  </button>
                );
                })}
              </div>

              <p className="text-xs text-slate-500 dark:text-white/60">
                Selecciona uno o varios servicios entre las opciones disponibles.
              </p>

              {form.formErrors.services && (
                <p className="text-xs text-red-700 dark:text-red-300">{form.formErrors.services}</p>
              )}
            </div>
          </div>

          {mode === "edit" && (
            <InfoCard
              title="Al guardar, volverá a revisión"
              description="No necesitas hacer nada más después de guardar. Nuestro equipo revisará nuevamente la publicación."
              tone="warning"
            />
          )}
          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
            {showDeactivateAction && mode === "edit" && onDeactivate && (
              <button
                type="button"
                onClick={onDeactivate}
                disabled={form.submitting || deactivating}
                className="w-full md:w-auto px-5 py-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-black hover:opacity-90 dark:border-red-400/50 dark:bg-red-500/15 dark:text-red-200"
              >
                {deactivating ? "Desactivando..." : "Desactivar anuncio"}
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              disabled={form.submitting}
              className="w-full md:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 text-slate-800 dark:text-white font-semibold hover:opacity-90"
            >
              {cancelLabel}
            </button>

            <button
              type="submit"
              disabled={!form.canSubmit}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-[#FD0083] text-white font-black disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {form.submitting ? `${submitLabel}...` : submitLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};