import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotification } from "@/hooks/useNotification";
import {
  approvePendingPost,
  getPendingPostById,
  getPendingPosts,
  getPendingPostsErrorMessage,
  rejectPendingPost,
} from "@/features/admin-posts/services/adminPostsService";
import {
  DEFAULT_PENDING_POSTS_PAGE,
  DEFAULT_PENDING_POSTS_PAGE_SIZE,
  type AdminPendingPostDetail,
  type AdminPendingPostListItem,
} from "../types/adminPosts";

type Feedback = {
  kind: "success" | "error";
  message: string;
};

type ConfirmDialogState = {
  postId: string;
} | null;

const REJECTION_MIN_LENGTH = 10;
const REJECTION_MAX_LENGTH = 1000;

const pickNextSelectedPostId = (
  currentItems: AdminPendingPostListItem[],
  selectedPostId: string | null,
  removedPostId: string
): string | null => {
  if (!currentItems.length) {
    return null;
  }

  if (selectedPostId !== removedPostId) {
    return currentItems.some((item) => item.id === selectedPostId) ? selectedPostId : currentItems[0].id;
  }

  const removedIndex = currentItems.findIndex((item) => item.id === removedPostId);

  if (removedIndex === -1) {
    return currentItems[0].id;
  }

  const nextIndex = removedIndex >= currentItems.length - 1 ? currentItems.length - 2 : removedIndex + 1;
  if (nextIndex < 0) {
    return null;
  }

  return currentItems[nextIndex]?.id || null;
};

const validateRejectionReason = (value: string): string => {
  const normalized = value.trim();

  if (!normalized) {
    return "Debes indicar el motivo del rechazo.";
  }

  if (normalized.length < REJECTION_MIN_LENGTH) {
    return `El motivo debe tener al menos ${REJECTION_MIN_LENGTH} caracteres.`;
  }

  if (normalized.length > REJECTION_MAX_LENGTH) {
    return `El motivo no puede superar ${REJECTION_MAX_LENGTH} caracteres.`;
  }

  return "";
};

export const usePendingPostsReview = () => {
  const { success } = useNotification();
  const [items, setItems] = useState<AdminPendingPostListItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, AdminPendingPostDetail>>({});

  const [page, setPage] = useState(DEFAULT_PENDING_POSTS_PAGE);
  const [size, setSize] = useState(DEFAULT_PENDING_POSTS_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [processingPostId, setProcessingPostId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [listError, setListError] = useState("");

  const [approveDialog, setApproveDialog] = useState<ConfirmDialogState>(null);
  const [rejectDialog, setRejectDialog] = useState<ConfirmDialogState>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const rejectionError = useMemo(() => validateRejectionReason(rejectionReason), [rejectionReason]);
  const canSubmitRejection = !rejectionError;

  const selectedPost = useMemo(
    () => items.find((item) => item.id === selectedPostId) || null,
    [items, selectedPostId]
  );

  const selectedPostDetail = selectedPostId ? detailsById[selectedPostId] || null : null;

  const loadPage = useCallback(
    async (targetPage: number, targetSize: number) => {
      setLoadingList(true);
      setListError("");

      try {
        const result = await getPendingPosts({ page: targetPage, size: targetSize });

        setItems(result.content);
        setPage(result.page);
        setSize(result.size);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);

        setSelectedPostId((currentSelected) => {
          if (!result.content.length) {
            return null;
          }

          if (currentSelected && result.content.some((item) => item.id === currentSelected)) {
            return currentSelected;
          }

          return null;
        });
      } catch (error: unknown) {
        setListError(getPendingPostsErrorMessage(error));
      } finally {
        setLoadingList(false);
      }
    },
    []
  );

  const loadDetail = useCallback(
    async (postId: string) => {
      if (detailsById[postId]) {
        return;
      }

      setLoadingDetailId(postId);

      try {
        const detail = await getPendingPostById(postId);
        setDetailsById((current) => ({
          ...current,
          [postId]: detail,
        }));
      } catch (error: unknown) {
        setFeedback({
          kind: "error",
          message: getPendingPostsErrorMessage(error),
        });
      } finally {
        setLoadingDetailId(null);
      }
    },
    [detailsById]
  );

  const selectPost = useCallback(
    (postId: string) => {
      setSelectedPostId(postId);
      setFeedback(null);
      void loadDetail(postId);
    },
    [loadDetail]
  );

  const closeDetail = useCallback(() => {
    setSelectedPostId(null);
  }, []);

  const removeReviewedPostLocally = useCallback(
    (postId: string) => {
      setItems((currentItems) => {
        const nextItems = currentItems.filter((item) => item.id !== postId);

        setSelectedPostId((currentSelected) =>
          pickNextSelectedPostId(currentItems, currentSelected, postId)
        );

        return nextItems;
      });

      setDetailsById((currentDetails) => {
        const nextDetails = { ...currentDetails };
        delete nextDetails[postId];
        return nextDetails;
      });

      setTotalElements((currentTotal) => Math.max(currentTotal - 1, 0));
    },
    []
  );

  const requestApprove = useCallback((postId: string) => {
    setApproveDialog({ postId });
  }, []);

  const cancelApprove = useCallback(() => {
    setApproveDialog(null);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!approveDialog) {
      return;
    }

    setProcessingPostId(approveDialog.postId);
    setFeedback(null);

    try {
      await approvePendingPost(approveDialog.postId);
      removeReviewedPostLocally(approveDialog.postId);
      setApproveDialog(null);
      setRejectDialog(null);
      setRejectionReason("");
      success({
        title: "Publicación aprobada",
        description: "La publicación ya puede mostrarse a los usuarios.",
      });
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        message: getPendingPostsErrorMessage(error),
      });
    } finally {
      setProcessingPostId(null);
    }
  }, [approveDialog, removeReviewedPostLocally, success]);

  const openReject = useCallback((postId: string) => {
    setRejectDialog({ postId });
    setRejectionReason("");
  }, []);

  const cancelReject = useCallback(() => {
    setRejectDialog(null);
    setRejectionReason("");
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectDialog) {
      return;
    }

    if (!canSubmitRejection) {
      return;
    }

    setProcessingPostId(rejectDialog.postId);
    setFeedback(null);

    try {
      await rejectPendingPost(rejectDialog.postId, {
        rejectionReason: rejectionReason.trim(),
      });

      removeReviewedPostLocally(rejectDialog.postId);
      setApproveDialog(null);
      setRejectDialog(null);
      setRejectionReason("");
      success({
        title: "Publicación rechazada",
        description: "La publicación quedó marcada para correcciones antes de volver a enviarse.",
      });
    } catch (error: unknown) {
      setFeedback({
        kind: "error",
        message: getPendingPostsErrorMessage(error),
      });
    } finally {
      setProcessingPostId(null);
    }
  }, [canSubmitRejection, rejectDialog, rejectionReason, removeReviewedPostLocally, success]);

  const changePage = useCallback(
    (nextPage: number) => {
      if (nextPage < 0) {
        return;
      }

      void loadPage(nextPage, size);
    },
    [loadPage, size]
  );

  const reload = useCallback(() => {
    void loadPage(page, size);
  }, [loadPage, page, size]);

  useEffect(() => {
    void loadPage(DEFAULT_PENDING_POSTS_PAGE, DEFAULT_PENDING_POSTS_PAGE_SIZE);
  }, [loadPage]);

  useEffect(() => {
    if (selectedPostId) {
      void loadDetail(selectedPostId);
    }
  }, [selectedPostId, loadDetail]);

  return {
    items,
    selectedPostId,
    selectedPost,
    selectedPostDetail,
    page,
    size,
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
    canSubmitRejection,
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
  };
};
