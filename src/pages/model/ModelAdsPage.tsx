import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../hooks/useNotification";
import { ModelAdForm, ModelMyPostsSection } from "../../features/model-ads/components";
import { useModelAdForm } from "../../features/model-ads/hooks/useModelAdForm";
import { useMyModelPosts } from "../../features/model-ads/hooks/useMyModelPosts";

export const ModelAdsPage = () => {
  const { success } = useNotification();
  const navigate = useNavigate();
  const accountType = localStorage.getItem("accountType");
  const normalizedAccountType = accountType
    ?.toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");
  const isModel = normalizedAccountType === "MODEL";
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

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
    updatePost,
  } = useMyModelPosts(isModel);

  const editingPost = posts.find((post) => post.id === editingPostId) || null;

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
              <ModelAdForm
                form={editForm}
                mode="edit"
                headerTitle="Editar publicacion"
                headerDescription="Al guardar, tu publicación volverá a revisión antes de publicarse otra vez."
                onCancel={() => {
                  setEditingPostId(null);
                }}
                cancelLabel="Cancelar"
                submitLabel="Guardar cambios"
                requireConfirmation
                confirmationText="Al actualizar esta publicación será enviada nuevamente a revisión y dejará de estar visible hasta ser aprobada."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
