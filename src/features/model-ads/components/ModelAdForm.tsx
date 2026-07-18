import { useEffect } from "react";
import type { ModelAdMode } from "../../../types/modelAds";
import { EmptyState } from "../../../components/EmptyState";
import { InfoCard } from "../../../components/InfoCard";
import { SkeletonLoader } from "../../../components/SkeletonLoader";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useNotification } from "../../../hooks/useNotification";
import type { UseModelAdFormReturn } from "../hooks/useModelAdForm";

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
}: Props) => {
  const confirm = useConfirmDialog();
  const { success, error: notifyError } = useNotification();

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
            {form.contents.length === 0 ? (
              <EmptyState
                title="No tienes imágenes disponibles"
                description="Primero sube contenido a tu perfil para elegir una portada para el anuncio."
              />
            ) : (
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
            )}

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
            <div className="flex flex-col gap-3 md:max-w-lg">
              <div className="flex gap-2">
                <input
                  value={form.serviceInput}
                  onChange={(event) => form.setServiceInput(event.target.value)}
                  disabled={form.submitting || form.loadingData}
                  placeholder="Ej: SERVICE_UNO"
                  className="flex-1 bg-white dark:bg-[#013440] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={form.handleAddService}
                  disabled={form.submitting || form.loadingData}
                  className="px-4 py-3 rounded-xl bg-[#00BCD4] text-[#012a33] font-bold hover:opacity-90"
                >
                  Agregar
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.services.map((service) => (
                  <button
                    type="button"
                    key={service}
                    onClick={() => form.toggleService(service)}
                    disabled={form.submitting || form.loadingData}
                    className="px-3 py-2 rounded-full border text-xs font-bold bg-[#FD0083] text-white border-[#FD0083]"
                    title="Quitar servicio"
                  >
                    {service} ✕
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-500 dark:text-white/60">
                Agrega los servicios que quieras incluir en la publicacion.
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