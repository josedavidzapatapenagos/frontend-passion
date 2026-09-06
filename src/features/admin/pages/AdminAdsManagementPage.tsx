import { useEffect } from "react";
import { ApproveDialog } from "@/features/admin-posts/components/ApproveDialog";
import { InfoCard } from "@/components/common/InfoCard";
import { PendingPostDetail } from "@/features/admin-posts/components/PendingPostDetail";
import { PendingPostsList } from "@/features/admin-posts/components/PendingPostsList";
import { RejectDialog } from "@/features/admin-posts/components/RejectDialog";
import { ReviewToolbar } from "@/features/admin-posts/components/ReviewToolbar";
import { useNotification } from "@/hooks/useNotification";
import { usePendingPostsReview } from "@/features/admin-posts/hooks/usePendingPostsReview";

const REJECTION_MAX_LENGTH = 1000;

export const AdminAdsManagementPage = () => {
  const { success, error: notifyError } = useNotification();
  const {
    items,
    selectedPostId,
    selectedPost,
    selectedPostDetail,
    page,
    totalElements,
    totalPages,
    loadingList,
    loadingDetailId,
    processingPostId,
    feedback,
    listError,
    approveDialog,
    rejectDialog,
    rejectionReason,
    rejectionError,
    selectPost,
    closeDetail,
    requestApprove,
    cancelApprove,
    confirmApprove,
    openReject,
    cancelReject,
    confirmReject,
    setRejectionReason,
    changePage,
    reload,
  } = usePendingPostsReview();

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const notify = feedback.kind === "success" ? success : notifyError;
    notify({
      title: "Resultado de la revisión",
      description: feedback.message,
    });
  }, [feedback, notifyError, success]);

  useEffect(() => {
    if (!listError) {
      return;
    }

    notifyError({
      title: "No pudimos cargar las publicaciones pendientes",
      description: listError,
    });
  }, [listError, notifyError]);

  const selectedPostIsProcessing = selectedPostId ? processingPostId === selectedPostId : false;
  const showingDetail = Boolean(selectedPostId);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">Administracion de anuncios</h2>
            <p className="mt-2 text-slate-700 dark:text-white/70">
              Revisa publicaciones pendientes, aprueba o rechaza con motivo.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <InfoCard
            title="Antes de aprobar o rechazar"
            description="Confirma que la información sea clara, coherente y apta para publicarse. Si rechazas, explica qué debe corregirse."
          />
        </div>
        {showingDetail ? (
          <div className="mt-6">
            <PendingPostDetail
              post={selectedPostDetail}
              loading={Boolean(selectedPostId && loadingDetailId === selectedPostId)}
              processing={selectedPostIsProcessing}
              onBack={closeDetail}
              onApprove={() => {
                if (selectedPost) {
                  requestApprove(selectedPost.id);
                }
              }}
              onReject={() => {
                if (selectedPost) {
                  openReject(selectedPost.id);
                }
              }}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <ReviewToolbar
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              loading={loadingList}
              onReload={reload}
              onPrevPage={() => changePage(page - 1)}
              onNextPage={() => changePage(page + 1)}
              canGoPrev={page > 0}
              canGoNext={page + 1 < totalPages}
            />

            <PendingPostsList
              items={items}
              selectedPostId={selectedPostId}
              loading={loadingList}
              processingPostId={processingPostId}
              reloading={loadingList}
              onReview={selectPost}
              onReload={reload}
            />
          </div>
        )}
      </div>

      <ApproveDialog
        open={Boolean(approveDialog)}
        loading={Boolean(approveDialog && processingPostId === approveDialog.postId)}
        onCancel={cancelApprove}
        onConfirm={() => {
          void confirmApprove();
        }}
      />

      <RejectDialog
        open={Boolean(rejectDialog)}
        loading={Boolean(rejectDialog && processingPostId === rejectDialog.postId)}
        reason={rejectionReason}
        reasonError={rejectionError}
        maxLength={REJECTION_MAX_LENGTH}
        onReasonChange={setRejectionReason}
        onCancel={cancelReject}
        onConfirm={() => {
          void confirmReject();
        }}
      />
    </div>
  );
};
