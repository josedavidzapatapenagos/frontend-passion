import axios from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsLayout, type SettingsTab } from "@/components/common/SettingsLayout";
import { ProfileImagesGallery } from "@/features/model-profile/components/ProfileImagesGallery";
import { UploadImagesCard } from "@/features/model-profile/components/UploadImagesCard";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNotification } from "@/hooks/useNotification";
import { useModelProfileAccess } from "@/features/account/hooks/useModelAccess";
import {
  addModelContactMethodApi,
  deleteModelContactMethodApi,
  extractContactMethodFieldErrors,
  extractSetUpFieldErrors,
  setUpModelProfileApi,
  updateModelContactMethodApi,
  type ContactMethodApp,
  type ContactMethodFieldErrors,
  type ModelProfileContactMethod,
  type SetUpFieldErrors,
} from "@/features/model-profile/services/modelProfileService";

const CONTACT_APPS: { label: string; value: ContactMethodApp }[] = [
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Telegram", value: "TELEGRAM" },
];

const resolveContactAppMeta = (app: ContactMethodApp) => {
  if (app === "WHATSAPP") {
    return {
      label: "WhatsApp",
      placeholder: "3001234567",
      bgClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
      ringClass: "ring-emerald-300/70 dark:ring-emerald-400/30",
    };
  }

  return {
    label: "Telegram",
    placeholder: "@modelo_oficial",
    bgClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    ringClass: "ring-sky-300/70 dark:ring-sky-400/30",
  };
};

type ContactAppIconProps = {
  app: ContactMethodApp;
  className?: string;
};

const ContactAppIcon = ({ app, className = "h-5 w-5" }: ContactAppIconProps) => {
  if (app === "WHATSAPP") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3.5A8.5 8.5 0 0 0 4.6 16l-.9 3.2 3.3-.8A8.5 8.5 0 1 0 12 3.5Z" />
        <path d="M9.9 8.9c.2-.3.4-.4.6-.4h.4c.2 0 .3 0 .5.4l.7 1.8c.1.2 0 .4-.1.5l-.4.5c-.1.1-.2.2-.1.4.2.4.6 1 1.3 1.5.8.6 1.5.8 1.9.9.2.1.3 0 .4-.1l.6-.7c.1-.2.3-.2.5-.1l1.6.7c.2.1.4.2.4.4 0 .2-.2.9-.5 1.2-.4.3-.9.6-1.5.6-.7.1-1.7 0-3.6-1-2.3-1.1-3.8-3.5-3.9-3.7-.1-.2-.9-1.2-.9-2.3s.6-1.7.8-1.9Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 4 3 11.3l6.6 2.6L12 20l9-16Z" />
      <path d="m9.6 14 2.6-2.6" />
    </svg>
  );
};

type ContactEditorState = {
  mode: "add" | "edit";
  app: ContactMethodApp;
  contactMethodId: string | null;
  value: string;
};

const getContactErrorPayload = (status?: number) => {
  if (status === 400) {
    return {
      title: "No pudimos guardar la informacion.",
      description: "Revisa que el numero o usuario sean validos.",
    };
  }

  if (status === 403) {
    return {
      title: "No tienes permiso para modificar este metodo de contacto.",
      description: undefined,
    };
  }

  if (status === 404) {
    return {
      title: "El metodo de contacto ya no existe.",
      description: undefined,
    };
  }

  if (status === 429) {
    return {
      title: "Has realizado demasiadas solicitudes.",
      description: "Espera unos minutos antes de volver a intentarlo.",
    };
  }

  return {
    title: "No pudimos completar la operacion.",
    description: "Intenta nuevamente en unos minutos.",
  };
};

export const ModelProfilePage = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const { success, error: notifyError } = useNotification();
  const { accountApproved, hasProfile, hasCompletedOnboarding, profile, isLoading, refreshAccess } = useModelProfileAccess();

  const [alias, setAlias] = useState("");
  const [description, setDescription] = useState("");
  const [setUpFieldErrors, setSetUpFieldErrors] = useState<SetUpFieldErrors>({});
  const [contactFieldErrors, setContactFieldErrors] = useState<ContactMethodFieldErrors>({});
  const [isSubmittingSetUp, setIsSubmittingSetUp] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [deletingApp, setDeletingApp] = useState<ContactMethodApp | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [editorState, setEditorState] = useState<ContactEditorState | null>(null);
  const [galleryRefreshToken, setGalleryRefreshToken] = useState(0);

  useEffect(() => {
    void refreshAccess();
  }, [refreshAccess]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setAlias(profile.alias);
    setDescription(profile.description);
  }, [profile]);

  const contactMethodsByApp = useMemo(() => {
    const map: Partial<Record<ContactMethodApp, ModelProfileContactMethod>> = {};

    (profile?.contactMethods || []).forEach((method) => {
      const app = method.app.toUpperCase();

      if (app === "WHATSAPP" || app === "TELEGRAM") {
        map[app] = method;
      }
    });

    return map;
  }, [profile?.contactMethods]);
  const openAddEditor = (app: ContactMethodApp) => {
    setContactFieldErrors({});
    setEditorState({
      mode: "add",
      app,
      contactMethodId: null,
      value: "",
    });
  };

  const openEditEditor = (method: ModelProfileContactMethod, app: ContactMethodApp) => {
    setContactFieldErrors({});
    setEditorState({
      mode: "edit",
      app,
      contactMethodId: method.id || null,
      value: method.value,
    });
  };

  const closeEditor = () => {
    setContactFieldErrors({});
    setEditorState(null);
  };

  const handleSetUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSetUpFieldErrors({});

    const trimmedAlias = alias.trim();
    const trimmedDescription = description.trim();

    if (!trimmedAlias || !trimmedDescription) {
      const nextFieldErrors: SetUpFieldErrors = {};

      if (!trimmedAlias) {
        nextFieldErrors.alias = "Ingresa un alias para continuar.";
      }

      if (!trimmedDescription) {
        nextFieldErrors.description = "Ingresa una descripcion para continuar.";
      }

      setSetUpFieldErrors(nextFieldErrors);
      notifyError({
        title: "Revisa la informacion ingresada.",
        description: "Completa los campos requeridos antes de continuar.",
      });
      return;
    }

    try {
      setIsSubmittingSetUp(true);
      setIsBlocked(false);

      await setUpModelProfileApi({
        alias: trimmedAlias,
        description: trimmedDescription,
      });

      await refreshAccess();
      success({
        title: "Perfil actualizado",
        description: "La informacion basica del perfil fue guardada correctamente.",
      });
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      if (status === 400) {
        setSetUpFieldErrors(extractSetUpFieldErrors(error));
        notifyError({
          title: "Revisa la informacion ingresada.",
          description: "Corrige los datos del formulario e intentalo nuevamente.",
        });
        return;
      }

      if (status === 403) {
        setIsBlocked(true);
        notifyError({
          title: "No puedes configurar tu perfil todavia.",
          description: "Tu cuenta aun no ha sido aprobada por un administrador.",
        });
        return;
      }

      if (status === 429) {
        notifyError({
          title: "Demasiados intentos.",
          description: "Espera unos minutos antes de volver a intentarlo.",
        });
        return;
      }

      notifyError({
        title: "No pudimos guardar tu perfil.",
        description: "Intenta nuevamente en unos minutos.",
      });
    } finally {
      setIsSubmittingSetUp(false);
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editorState) {
      return;
    }

    setContactFieldErrors({});

    const trimmedValue = editorState.value.trim();
    if (!trimmedValue) {
      setContactFieldErrors({
        value: "Ingresa un usuario o numero para continuar.",
      });

      notifyError({
        title: "No pudimos guardar la informacion.",
        description: "Revisa que el numero o usuario sean validos.",
      });
      return;
    }

    try {
      setIsSubmittingContact(true);

      if (editorState.mode === "add") {
        await addModelContactMethodApi({
          app: editorState.app,
          value: trimmedValue,
        });
      } else {
        if (!editorState.contactMethodId) {
          notifyError({
            title: "El metodo de contacto ya no existe.",
          });
          await refreshAccess();
          return;
        }

        await updateModelContactMethodApi(editorState.contactMethodId, {
          app: editorState.app,
          value: trimmedValue,
        });
      }

      await refreshAccess();

      if (editorState.mode === "edit") {
        success({
          title: "Metodo actualizado",
          description: "Los cambios fueron guardados correctamente.",
        });
      } else {
        success({
          title: "Metodo agregado",
          description: "El metodo de contacto fue guardado correctamente.",
        });
      }

      closeEditor();

      if (!hasCompletedOnboarding && editorState.mode === "add") {
        navigate("/feed", { replace: true });
      }
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const payload = getContactErrorPayload(status);

      if (status === 400) {
        setContactFieldErrors(extractContactMethodFieldErrors(error));
      }

      if (status === 404) {
        await refreshAccess();
      }

      notifyError(payload);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleDeleteContact = async (app: ContactMethodApp) => {
    const method = contactMethodsByApp[app];

    if (!method?.id) {
      notifyError({
        title: "El metodo de contacto ya no existe.",
      });
      await refreshAccess();
      return;
    }

    const confirmed = await confirm({
      title: "Eliminar metodo de contacto",
      description:
        "Estas seguro de eliminar este metodo de contacto? Podras volver a agregarlo cuando quieras.",
      tone: "warning",
      cancelLabel: "Cancelar",
      confirmLabel: "Eliminar",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingApp(app);

      await deleteModelContactMethodApi(method.id);
      await refreshAccess();

      success({
        title: "Metodo eliminado",
        description: "El metodo de contacto fue eliminado correctamente.",
      });

      if (editorState?.app === app) {
        closeEditor();
      }
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const payload = getContactErrorPayload(status);

      if (status === 404) {
        await refreshAccess();
      }

      notifyError(payload);
    } finally {
      setDeletingApp(null);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#012a33] p-6 md:p-8 shadow-xl shadow-slate-200/70 dark:shadow-black/20">
          <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">Perfil</h2>
          <p className="mt-4 text-slate-600 dark:text-white/70">Cargando configuracion del perfil...</p>
        </div>
      </div>
    );
  }

  if (!accountApproved || isBlocked) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-3xl mx-auto rounded-3xl border border-amber-300 bg-amber-50 p-6 md:p-8 text-amber-900 shadow-lg shadow-amber-100/60 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <h2 className="text-2xl md:text-3xl font-black">No puedes configurar tu perfil todavia.</h2>
          <p className="mt-4">Tu cuenta aun no ha sido aprobada por un administrador.</p>

          <button
            type="button"
            onClick={() => navigate("/account")}
            className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-bold text-amber-950 transition hover:bg-amber-400"
          >
            Ir a mi cuenta
          </button>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#022f3a] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20">
          <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">Completa tu perfil</h2>
          <p className="mt-3 text-slate-600 dark:text-white/70">
            Antes de comenzar a publicar anuncios y acceder al Area VIP necesitamos que completes la
            informacion basica de tu perfil.
          </p>

          <form onSubmit={handleSetUpSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="alias" className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-white/60">
                Alias
              </label>
              <input
                id="alias"
                type="text"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                maxLength={60}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#00BCD4] focus:shadow-[0_0_0_3px_rgba(0,188,212,0.2)] dark:border-white/20 dark:bg-white/5 dark:text-white"
                placeholder="Tu alias publico"
              />
              {setUpFieldErrors.alias && (
                <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{setUpFieldErrors.alias}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-white/60"
              >
                Descripcion
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                maxLength={500}
                className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#00BCD4] focus:shadow-[0_0_0_3px_rgba(0,188,212,0.2)] dark:border-white/20 dark:bg-white/5 dark:text-white"
                placeholder="Cuentales a tus clientes quien eres y que ofreces"
              />
              {setUpFieldErrors.description && (
                <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{setUpFieldErrors.description}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingSetUp}
              className="w-full rounded-2xl bg-[#FD0083] px-5 py-3 font-black uppercase tracking-wide text-white transition hover:bg-[#e40076] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingSetUp ? "Guardando..." : "Guardar y continuar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const profileTabs: SettingsTab[] = [
    {
      id: "information",
      label: "Información",
      content: (
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">Informacion del perfil</p>

          <div className="mt-3 grid gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">Alias</p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{profile?.alias || "-"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">Descripcion</p>
              <p className="mt-1 whitespace-pre-wrap text-sm md:text-base text-slate-700 dark:text-white/85">
                {profile?.description || "-"}
              </p>
            </div>
          </div>
        </section>
      ),
    },
    {
      id: "contact-methods",
      label: "Métodos de contacto",
      content: (
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">Metodos de contacto</p>

          <div className="mt-3 space-y-3">
            {CONTACT_APPS.map((contactApp) => {
              const appMeta = resolveContactAppMeta(contactApp.value);
              const existingMethod = contactMethodsByApp[contactApp.value];
              const isEditing = editorState?.app === contactApp.value;
              const isDeletingThisApp = deletingApp === contactApp.value;

              return (
                <article
                  key={contactApp.value}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/10"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ${appMeta.bgClass} ${appMeta.ringClass}`}
                    >
                      <ContactAppIcon app={contactApp.value} className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/60">
                        {appMeta.label}
                      </p>

                      {isEditing ? (
                        <form onSubmit={handleContactSubmit} className="mt-3 space-y-3">
                          <div>
                            <label
                              htmlFor={`contact-app-${contactApp.value}`}
                              className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-white/60"
                            >
                              Aplicacion
                            </label>
                            <input
                              id={`contact-app-${contactApp.value}`}
                              value={appMeta.label}
                              disabled
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white/80"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`contact-value-${contactApp.value}`}
                              className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-white/60"
                            >
                              Numero o usuario
                            </label>
                            <input
                              id={`contact-value-${contactApp.value}`}
                              type="text"
                              value={editorState?.value || ""}
                              onChange={(event) => {
                                setEditorState((current) => {
                                  if (!current || current.app !== contactApp.value) {
                                    return current;
                                  }

                                  return {
                                    ...current,
                                    value: event.target.value,
                                  };
                                });

                                setContactFieldErrors((current) => ({
                                  ...current,
                                  value: undefined,
                                }));
                              }}
                              maxLength={80}
                              placeholder={appMeta.placeholder}
                              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#00BCD4] focus:shadow-[0_0_0_3px_rgba(0,188,212,0.2)] dark:border-white/20 dark:bg-white/5 dark:text-white"
                            />
                            {contactFieldErrors.value && (
                              <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{contactFieldErrors.value}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              disabled={isSubmittingContact}
                              className="rounded-xl bg-[#FD0083] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSubmittingContact ? "Guardando..." : "Guardar"}
                            </button>

                            <button
                              type="button"
                              onClick={closeEditor}
                              disabled={isSubmittingContact}
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="mt-2 text-sm font-medium text-slate-800 dark:text-white/90">
                            {existingMethod?.value || "No configurado"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {existingMethod ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditEditor(existingMethod, contactApp.value)}
                                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleDeleteContact(contactApp.value);
                                  }}
                                  disabled={isDeletingThisApp}
                                  className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                                >
                                  {isDeletingThisApp ? "Eliminando..." : "Eliminar"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openAddEditor(contactApp.value)}
                                className="rounded-xl bg-[#00BCD4] px-4 py-2 text-sm font-bold text-[#012a33] transition hover:opacity-90"
                              >
                                Agregar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ),
    },
    {
      id: "photos",
      label: "Fotos",
      content: (
        <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">Fotos del perfil</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-white/80">
            Tus fotos son la primera impresión de tu perfil.
          </p>

          {!hasCompletedOnboarding ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
              Agrega al menos un metodo de contacto para habilitar esta seccion.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <UploadImagesCard
                onUploadSuccess={() => {
                  setGalleryRefreshToken((currentToken) => currentToken + 1);
                }}
              />
              <ProfileImagesGallery refreshToken={galleryRefreshToken} />
            </div>
          )}
        </section>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <SettingsLayout
        title="Perfil"
        subtitle="Gestiona la informacion basica y tus metodos de contacto."
        tabsLabel="Opciones de perfil"
        tabs={profileTabs}
        initialTabId="information"
        panelClassName="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#022f3a] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20"
        contentClassName="mt-6"
      />
    </div>
  );
};