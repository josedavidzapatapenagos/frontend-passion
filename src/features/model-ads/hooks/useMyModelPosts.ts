import { useCallback, useEffect, useState } from "react";
import { useNotification } from "../../../hooks/useNotification";
import { getUserFacingErrorMessage } from "../../../services/errorMapper";
import {
  activateMyModelPost,
  deactivateMyModelPost,
  getMyModelPosts,
} from "../services/modelMyPostsService";
import type {
  ModelPostStatusAction,
  MyModelPost,
  MyModelPostStatus,
} from "../types/modelMyPosts";

type FeedbackKind = "error";

type MutationFeedback = {
  kind: FeedbackKind;
  message: string;
};

type ConfirmActionState = {
  postId: string;
  action: ModelPostStatusAction;
} | null;

const getLoadPostsErrorMessage = (error: unknown): string => {
  return getUserFacingErrorMessage(error, {
    defaultMessage: "No se pudieron cargar tus publicaciones.",
    forbiddenMessage: "Tu cuenta no tiene permisos para consultar tus publicaciones.",
  });
};

const getMutationErrorMessage = (action: ModelPostStatusAction, error: unknown): string => {
  return getUserFacingErrorMessage(error, {
    defaultMessage: "No fue posible actualizar el estado de la publicación.",
    badRequestMessage: "No fue posible completar esta acción con la información actual.",
    forbiddenMessage: "No puedes modificar esta publicación porque no te pertenece.",
    notFoundMessage: "La publicación ya no existe.",
    conflictMessage:
      action === "activate"
        ? "No es posible volver a activar esta publicación todavía."
        : "No fue posible ocultar la publicación en este momento.",
  });
};

const getNextStatus = (action: ModelPostStatusAction): MyModelPostStatus => {
  return action === "activate" ? "ACTIVE" : "INACTIVE";
};

export const useMyModelPosts = (enabled: boolean) => {
  const { success } = useNotification();
  const [posts, setPosts] = useState<MyModelPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [mutationFeedback, setMutationFeedback] = useState<MutationFeedback | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);

  const loadMyPosts = useCallback(async () => {
    setLoadingPosts(true);
    setPostsError("");

    try {
      const data = await getMyModelPosts();
      setPosts(data);
    } catch (err: unknown) {
      setPostsError(getLoadPostsErrorMessage(err));
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const requestStatusChange = useCallback((postId: string, action: ModelPostStatusAction) => {
    setMutationFeedback(null);
    setConfirmAction({ postId, action });
  }, []);

  const cancelStatusChange = useCallback(() => {
    setConfirmAction(null);
  }, []);

  const confirmStatusChange = useCallback(async () => {
    if (!confirmAction) {
      return;
    }

    const { postId, action } = confirmAction;

    setPendingPostId(postId);
    setMutationFeedback(null);

    try {
      if (action === "activate") {
        await activateMyModelPost(postId);
      } else {
        await deactivateMyModelPost(postId);
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: getNextStatus(action),
              }
            : post
        )
      );

      success({
        title: action === "activate" ? "Publicación activada" : "Publicación oculta",
        description:
          action === "activate"
            ? "La publicación volvió a estar visible para los usuarios."
            : "La publicación quedó oculta y puedes volver a activarla más adelante.",
      });
      setConfirmAction(null);
    } catch (error: unknown) {
      setMutationFeedback({
        kind: "error",
        message: getMutationErrorMessage(action, error),
      });
    } finally {
      setPendingPostId(null);
    }
  }, [confirmAction, success]);

  const updatePost = useCallback((postId: string, updates: Partial<MyModelPost>) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              ...updates,
              price: updates.price
                ? {
                    ...post.price,
                    ...updates.price,
                  }
                : post.price,
            }
          : post
      )
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadMyPosts();
  }, [enabled, loadMyPosts]);

  return {
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
  };
};
