import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "@/hooks/useNotification";
import {
  ModelAdForm,
  ModelMyPostsSection,
  PositioningPlansSection,
  PremiumPostSummaryCard,
  PremiumStatesSection,
  PremiumVideosSection,
} from "@/features/model-ads/components";
import { useModelAdForm } from "@/features/model-ads/hooks/useModelAdForm";
import { useMyModelPosts } from "@/features/model-ads/hooks/useMyModelPosts";
import { SettingsLayout, type SettingsTab } from "@/components/common/SettingsLayout";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  getPostPremiumSummary,
  type PremiumPostSummary,
} from "@/features/model-ads/services/modelPremiumService";

export const ModelAdsPage = () => {
  const { success, warning } = useNotification();
  const confirm = useConfirmDialog();
  const navigate = useNavigate();
  const accountType = localStorage.getItem("accountType");
  const normalizedAccountType = accountType
    ?.toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");
  const isModel = normalizedAccountType === "MODEL";
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [premiumSummary, setPremiumSummary] = useState<PremiumPostSummary | null>(null);
  const [premiumSummaryLoading, setPremiumSummaryLoading] = useState(false);

  const {
    posts,
    loadingPosts,
    postsError,
    pendingPostId,
    mutationFeedback,
    confirmAction,
    loadMyPosts,
    requestStatusChange,
    cancelStatusChange,
    confirmStatusChange,
    changeStatusDirect,
    updatePost,
  } = useMyModelPosts(isModel);

  const editingPost = posts.find((post) => post.id === editingPostId) || null;
  const isEditingPostOnline = Boolean(editingPost?.isOnline);

  const refreshPremiumSummary = useCallback(async (): Promise<PremiumPostSummary | null> => {
    if (!editingPostId) {
      setPremiumSummary(null);
      return null;
    }

    setPremiumSummaryLoading(true);

    try {
      const { summary } = await getPostPremiumSummary(editingPostId);
      setPremiumSummary(summary);
      return summary;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403) {
          warning({
            title: "No tienes permisos para ver el resumen premium",
            description: "Solo la cuenta dueña de la publicación puede consultarlo.",
          });
        }

        if (status === 404) {
          warning({
            title: "Resumen premium no disponible",
            description: "No encontramos el resumen premium de esta publicación.",
          });
        }
      }

      setPremiumSummary(null);
      return null;
    } finally {
      setPremiumSummaryLoading(false);
    }
  }, [editingPostId, warning]);

  useEffect(() => {
    if (!editingPostId) {
      setPremiumSummary(null);
      setPremiumSummaryLoading(false);
      return;
    }

    void refreshPremiumSummary();
  }, [editingPostId, refreshPremiumSummary]);

  useEffect(() => {
    if (!editingPostId || !premiumSummary) {
      return;
    }

    updatePost(editingPostId, { isOnline: premiumSummary.postIsOnline });
  }, [editingPostId, premiumSummary, updatePost]);

  const editForm = useModelAdForm({
    enabled: isModel && Boolean(editingPostId),
    mode: "edit",
    postId: editingPostId,
    initialPost: editingPost,
    onSuccess: ({ postId, values }) => {
      if (!postId) {
        return;
      }

      updatePost(postId, {
        title: values.title,
        description: values.description,
        catalogId: values.catalogId,
        status: "PENDING_REVIEW",
        price: {
          amount: Number(values.priceAmount),
          currency: editingPost?.price?.currency || "",
        },
      });

      success({
        title: "Cambios guardados",
        description: "La publicación volvió a revisión y te avisaremos cuando esté lista.",
      });
      setEditingPostId(null);
    },
  });

  const isDeactivatingCurrentPost = Boolean(editingPostId && pendingPostId === editingPostId);

  const handleDeactivateFromEditor = async () => {
    if (!editingPostId) {
      return;
    }

    const accepted = await confirm({
      title: "Desactivar anuncio",
      description: "Este anuncio dejará de ser visible para los usuarios hasta que lo vuelvas a activar.",
      tone: "warning",
      confirmLabel: "Desactivar",
    });

    if (!accepted) {
      return;
    }

    const ok = await changeStatusDirect(editingPostId, "deactivate");
    if (ok) {
      setEditingPostId(null);
    }
  };

  const editorTabs: SettingsTab[] = [
    {
      id: "settings",
      label: "Ajustes",
      content: (
        <ModelAdForm
          form={editForm}
          mode="edit"
          headerTitle="Ajustes del anuncio"
          headerDescription="Edita título, descripción, precio, categoría, servicios y fotografías."
          onCancel={() => {
            setEditingPostId(null);
          }}
          cancelLabel="Cerrar"
          submitLabel="Guardar cambios"
          requireConfirmation
          showDeactivateAction
          deactivating={isDeactivatingCurrentPost}
          onDeactivate={() => {
            void handleDeactivateFromEditor();
          }}
          confirmationText="Al actualizar esta publicación será enviada nuevamente a revisión y dejará de estar visible hasta ser aprobada."
        />
      ),
    },
    {
      id: "positioning-plan",
      label: "Plan de posicionamiento",
      content: <PositioningPlansSection postId={editingPostId} postTitle={editingPost?.title || null} />,
    },
    {
      id: "premium",
      label: "Premium",
      content: (
        <div className="space-y-5 rounded-2xl border-2 border-dashed border-[color-mix(in_srgb,var(--vp-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--vp-accent)_7%,var(--vp-card-bg))] p-4 md:p-5">
          <div>
            <h3 className="text-lg font-black text-[var(--vp-text-primary)]">Premium</h3>
            <p className="mt-2 text-sm text-[var(--vp-text-secondary)]">
              Administra el contenido Premium del anuncio que estás gestionando.
            </p>
          </div>
          <PremiumPostSummaryCard summary={premiumSummary} isLoading={premiumSummaryLoading} />
          <PremiumVideosSection
            postId={editingPostId}
            isPostOnline={isEditingPostOnline}
            summary={premiumSummary}
            isSummaryLoading={premiumSummaryLoading}
            onRefreshSummary={refreshPremiumSummary}
            onOnlineStateChange={(isOnline) => {
              if (!editingPostId) {
                return;
              }

              updatePost(editingPostId, { isOnline });
            }}
          />
          <PremiumStatesSection
            postId={editingPostId}
            summary={premiumSummary}
            isSummaryLoading={premiumSummaryLoading}
            onRefreshSummary={refreshPremiumSummary}
          />
        </div>
      ),
    },
  ];

  if (!isModel) {
    return (
      <div className="vp-page-bg min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-5xl rounded-[34px] border border-[var(--vp-border)] bg-[linear-gradient(180deg,var(--vp-card-bg),var(--vp-card-secondary))] p-6 text-[var(--vp-text-primary)] shadow-[0_18px_45px_rgba(2,6,23,0.08)] md:p-8">
          <h2 className="text-3xl font-black text-[var(--vp-accent)]">Mis anuncios</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--vp-text-secondary)]">
            Esta sección solo está disponible para cuentas MODEL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vp-page-bg min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[38px] border border-[var(--vp-border)] bg-[linear-gradient(180deg,var(--vp-card-bg),var(--vp-card-secondary))] p-4 text-[var(--vp-text-primary)] shadow-[0_18px_45px_rgba(2,6,23,0.08)] md:p-6">
          <ModelMyPostsSection
            posts={posts}
            loadingPosts={loadingPosts}
            postsError={postsError}
            pendingPostId={pendingPostId}
            mutationFeedback={mutationFeedback}
            confirmAction={confirmAction}
            onReload={() => {
              void loadMyPosts();
            }}
            onEditPost={(postId) => {
              setEditingPostId(postId);
            }}
            onRequestStatusChange={requestStatusChange}
            onCancelStatusChange={cancelStatusChange}
            onConfirmStatusChange={() => {
              void confirmStatusChange();
            }}
            onCreatePost={() => navigate("/ads/create")}
          />
        </div>

        {editingPostId && (
          <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--vp-page-bg)_55%,black)] p-4 md:p-8">
            <div className="w-full max-w-5xl">
              <SettingsLayout
                title="Gestionar anuncio"
                subtitle="Administra tu publicación sin salir de Mis anuncios."
                tabs={editorTabs}
                initialTabId="settings"
                tabsLabel="Navegación interna"
                panelClassName="rounded-3xl border border-[var(--vp-border)] bg-[linear-gradient(180deg,var(--vp-card-bg),var(--vp-card-secondary))] p-6 md:p-8 text-[var(--vp-text-primary)] shadow-[0_18px_45px_rgba(2,6,23,0.08)]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
