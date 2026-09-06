import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPostById } from "@/features/feed/services/postService";
import { useNotification } from "@/hooks/useNotification";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";
import {
  addModelPostContents,
  createModelPost,
  getActiveCatalogs,
  getModelContent,
  removeModelPostContent,
  updateModelPost,
} from "@/features/model-ads/services/modelAdsService";
import type { Catalog } from "@/features/onboarding/services/flagService";
import type { MyModelPost } from "../types/modelMyPosts";
import type {
  ModelAdFormErrors,
  ModelAdFormValues,
  ModelAdMode,
  ModelContentItem,
  UpdateModelPostPayload,
} from "@/features/model-ads/types/modelAds";

type LoadedValues = {
  title: string;
  description: string;
  priceAmount: string;
  catalogId: string;
  coverPhotoContentId: string;
  services: string[];
};

type SubmitResult = {
  postId?: string;
  values: ModelAdFormValues;
  payload: UpdateModelPostPayload;
};

export type UseModelAdFormOptions = {
  enabled: boolean;
  mode: ModelAdMode;
  postId?: string | null;
  initialPost?: MyModelPost | null;
  onSuccess?: (result: SubmitResult) => void;
};

export type UseModelAdFormReturn = {
  catalogs: Catalog[];
  selectedCatalog: Catalog | null;
  contents: ModelContentItem[];
  postPhotos: ModelContentItem[];
  loadingData: boolean;
  loadError: string;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  priceAmount: string;
  setPriceAmount: React.Dispatch<React.SetStateAction<string>>;
  catalogId: string;
  setCatalogId: React.Dispatch<React.SetStateAction<string>>;
  coverPhotoContentId: string;
  setCoverPhotoContentId: React.Dispatch<React.SetStateAction<string>>;
  services: string[];
  toggleService: (value: string) => void;
  photoPickerOpen: boolean;
  setPhotoPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPhotoIdsForAdd: string[];
  togglePhotoSelectionForAdd: (contentId: string) => void;
  confirmAddPhotos: () => Promise<void>;
  removePhotoFromPost: (contentId: string) => Promise<void>;
  photosBusy: boolean;
  photosError: string;
  clearPhotosError: () => void;
  submitting: boolean;
  submitError: string;
  submitMessage: string;
  formErrors: ModelAdFormErrors;
  canSubmit: boolean;
  hasChanges: boolean;
  catalogOpen: boolean;
  setCatalogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  submitForm: () => Promise<boolean>;
};

const INITIAL_FORM_ERRORS: ModelAdFormErrors = {};

const CREATE_SUCCESS_MESSAGE =
  "La publicación fue creada correctamente y quedó en revisión.";

const UPDATE_SUCCESS_MESSAGE =
  "Los cambios se guardaron y la publicación volvió a revisión.";

const MAX_POST_PHOTOS = 5;

export const MODEL_AD_STATIC_SERVICES = [
  "VIDEO_LLAMADAS",
  "CHAT_EROTICO",
  "SEXTING",
  "WEBCAM",
  "VENTA_DE_CONTENIDO",
] as const;

const normalizeService = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "_");

const areArraysEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const buildInitialValues = (
  mode: ModelAdMode,
  initialPost: MyModelPost | null,
  detail: Awaited<ReturnType<typeof getPostById>> | null,
  contents: ModelContentItem[],
  postPhotos: ModelContentItem[]
): LoadedValues => {
  const pool = [...postPhotos, ...contents];
  const detailCoverPhotoId =
    detail?.coverPhotoUrl && pool.length > 0
      ? pool.find((content) => content.contentUrl === detail.coverPhotoUrl)?.id || ""
      : "";

  return {
    title: detail?.title || initialPost?.title || "",
    description: detail?.description || initialPost?.description || "",
    priceAmount:
      detail?.price?.amount && detail.price.amount > 0
        ? String(detail.price.amount)
        : typeof initialPost?.price?.amount === "number" && initialPost.price.amount > 0
          ? String(initialPost.price.amount)
          : "",
    catalogId: detail?.catalogId || initialPost?.catalogId || "",
    coverPhotoContentId: mode === "edit" ? detailCoverPhotoId : "",
    services: (detail?.services || [])
      .map((service) => normalizeService(service))
      .filter((service) => MODEL_AD_STATIC_SERVICES.includes(service as (typeof MODEL_AD_STATIC_SERVICES)[number])),
  };
};

export const useModelAdForm = ({
  enabled,
  mode,
  postId,
  initialPost,
  onSuccess,
}: UseModelAdFormOptions): UseModelAdFormReturn => {
  const { success } = useNotification();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [contents, setContents] = useState<ModelContentItem[]>([]);
  const [postPhotos, setPostPhotos] = useState<ModelContentItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [coverPhotoContentId, setCoverPhotoContentId] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [selectedPhotoIdsForAdd, setSelectedPhotoIdsForAdd] = useState<string[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [loadingProfileContents, setLoadingProfileContents] = useState(false);
  const [profileContentsLoaded, setProfileContentsLoaded] = useState(false);
  const [photosError, setPhotosError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [formErrors, setFormErrors] = useState<ModelAdFormErrors>(INITIAL_FORM_ERRORS);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const requestIdRef = useRef(0);
  const initialSnapshotRef = useRef<LoadedValues | null>(null);

  const selectedCatalog = useMemo(
    () => catalogs.find((catalog) => catalog.id === catalogId) || null,
    [catalogId, catalogs]
  );

  const sortedCatalogs = useMemo(
    () => [...catalogs].sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" })),
    [catalogs]
  );

  const applyInitialValues = useCallback((nextValues: LoadedValues) => {
    initialSnapshotRef.current = nextValues;
    setTitle(nextValues.title);
    setDescription(nextValues.description);
    setPriceAmount(nextValues.priceAmount);
    setCatalogId(nextValues.catalogId);
    setCoverPhotoContentId(nextValues.coverPhotoContentId);
    setServices(nextValues.services);
    setSelectedPhotoIdsForAdd([]);
    setPhotoPickerOpen(false);
    setProfileContentsLoaded(false);
    setLoadingProfileContents(false);
    setPhotosError("");
    setFormErrors(INITIAL_FORM_ERRORS);
  }, []);

  const loadInitialData = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoadingData(true);
    setLoadError("");

    const [catalogsResult, contentsResult, detailResult] = await Promise.allSettled([
      getActiveCatalogs(),
      mode === "create" ? getModelContent() : Promise.resolve([]),
      mode === "edit" && postId ? getPostById(postId, { isPublicRequest: false }) : Promise.resolve(null),
    ]);

    if (currentRequestId !== requestIdRef.current) {
      return;
    }

    let loadedContents: ModelContentItem[] = [];

    if (catalogsResult.status === "fulfilled") {
      setCatalogs(catalogsResult.value);
    } else {
      setCatalogs([]);
      setCatalogId("");
      setLoadError("No fue posible cargar los catálogos disponibles. Intenta nuevamente.");
    }

    if (contentsResult.status === "fulfilled") {
      loadedContents = contentsResult.value;
      setContents(contentsResult.value);
      setProfileContentsLoaded(mode === "create");
    } else {
      setContents([]);
      setCoverPhotoContentId("");
      setLoadError("No pudimos cargar tu contenido multimedia. Intenta nuevamente.");
      setProfileContentsLoaded(false);
    }

    if (mode === "edit") {
      const detail = detailResult.status === "fulfilled" ? detailResult.value : null;
      const loadedPostPhotos = (detail?.modelContents || []).filter(
        (content): content is ModelContentItem => content.contentType === "IMAGE"
      );
      setPostPhotos(loadedPostPhotos);

      const nextValues = buildInitialValues(mode, initialPost || null, detail, loadedContents, loadedPostPhotos);
      applyInitialValues(nextValues);

      if (!detail) {
        setLoadError("No fue posible cargar la publicación para editarla.");
      }
    } else {
      setPostPhotos([]);
      applyInitialValues({
        title: "",
        description: "",
        priceAmount: "",
        catalogId: "",
        coverPhotoContentId: "",
        services: [],
      });
    }

    setLoadingData(false);
  }, [applyInitialValues, initialPost, mode, postId]);

  const loadProfileContents = useCallback(async () => {
    if (mode !== "edit") {
      return;
    }

    setLoadingProfileContents(true);
    setPhotosError("");

    try {
      const multimediaContents = await getModelContent();
      setContents(multimediaContents);
      setProfileContentsLoaded(true);
    } catch (error: unknown) {
      setPhotosError(
        getUserFacingErrorMessage(error, {
          defaultMessage: "No pudimos cargar tus imágenes de perfil.",
          forbiddenMessage: "No tienes permisos para consultar tu biblioteca de imágenes.",
        })
      );
    } finally {
      setLoadingProfileContents(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!enabled) {
      setLoadingData(false);
      return;
    }

    void loadInitialData();
  }, [enabled, loadInitialData]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!enabled || mode !== "edit" || !photoPickerOpen || profileContentsLoaded || loadingProfileContents) {
      return;
    }

    void loadProfileContents();
  }, [enabled, loadProfileContents, loadingProfileContents, mode, photoPickerOpen, profileContentsLoaded]);

  const toggleService = useCallback((value: string) => {
    const normalizedValue = normalizeService(value);

    if (!normalizedValue || !MODEL_AD_STATIC_SERVICES.includes(normalizedValue as (typeof MODEL_AD_STATIC_SERVICES)[number])) {
      return;
    }

    setServices((currentServices) => {
      if (currentServices.includes(normalizedValue)) {
        return currentServices.filter((service) => service !== normalizedValue);
      }

      return [...currentServices, normalizedValue];
    });
  }, []);

  const togglePhotoSelectionForAdd = useCallback((contentId: string) => {
    if (mode !== "edit") {
      return;
    }

    setSelectedPhotoIdsForAdd((current) => {
      if (current.includes(contentId)) {
        return current.filter((id) => id !== contentId);
      }

      if (postPhotos.length + current.length >= MAX_POST_PHOTOS) {
        setPhotosError(`Cada anuncio permite máximo ${MAX_POST_PHOTOS} fotografías.`);
        return current;
      }

      return [...current, contentId];
    });
  }, [mode, postPhotos.length]);

  const confirmAddPhotos = useCallback(async () => {
    if (mode !== "edit" || !postId || selectedPhotoIdsForAdd.length === 0) {
      return;
    }

    if (postPhotos.length >= MAX_POST_PHOTOS) {
      setPhotosError(`Este anuncio ya alcanzó el máximo de ${MAX_POST_PHOTOS} fotografías.`);
      return;
    }

    const availableSlots = MAX_POST_PHOTOS - postPhotos.length;
    const contentIdsToAdd = selectedPhotoIdsForAdd.slice(0, availableSlots);

    if (contentIdsToAdd.length === 0) {
      setPhotosError(`Solo puedes agregar hasta ${MAX_POST_PHOTOS} fotografías por anuncio.`);
      return;
    }

    setPhotosBusy(true);
    setPhotosError("");

    try {
      const addResult = await addModelPostContents(postId, contentIdsToAdd);
      const successfulIds = addResult.results
        .filter((item) => item.status === "SUCCESS" && item.contentId)
        .map((item) => item.contentId);

      if (successfulIds.length === 0) {
        const firstError = addResult.results.find((item) => item.status !== "SUCCESS")?.message;
        setPhotosError(firstError || "No fue posible asociar las imágenes al anuncio.");
        return;
      }

      const selectedItems = contents.filter((content) => successfulIds.includes(content.id));
      setPostPhotos((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        const next = [...current];

        selectedItems.forEach((item) => {
          if (!knownIds.has(item.id)) {
            next.push(item);
          }
        });

        return next;
      });

      if (!coverPhotoContentId && selectedItems.length > 0) {
        setCoverPhotoContentId(selectedItems[0].id);
      }

      setSelectedPhotoIdsForAdd([]);
      setPhotoPickerOpen(false);

      const failedCount = addResult.summary.failureCount;
      if (failedCount > 0) {
        const firstFailure = addResult.results.find((item) => item.status !== "SUCCESS")?.message;
        setPhotosError(
          firstFailure ||
            `Se agregaron ${addResult.summary.successCount} imágenes y ${failedCount} no pudieron asociarse.`
        );
      } else if (selectedPhotoIdsForAdd.length > contentIdsToAdd.length) {
        setPhotosError(`Solo se agregaron ${contentIdsToAdd.length} imágenes por el límite de ${MAX_POST_PHOTOS} por anuncio.`);
      }
    } catch (error: unknown) {
      setPhotosError(
        getUserFacingErrorMessage(error, {
          defaultMessage: "No pudimos agregar las fotografías al anuncio.",
          badRequestMessage: "La selección de imágenes no es válida para este anuncio.",
          forbiddenMessage: "No tienes permisos para modificar este anuncio.",
          notFoundMessage: "No encontramos el anuncio o alguna imagen seleccionada.",
        })
      );
    } finally {
      setPhotosBusy(false);
    }
  }, [contents, coverPhotoContentId, mode, postId, postPhotos.length, selectedPhotoIdsForAdd]);

  const removePhotoFromPost = useCallback(
    async (contentId: string) => {
      if (mode !== "edit" || !postId) {
        return;
      }

      setPhotosBusy(true);
      setPhotosError("");

      try {
        await removeModelPostContent(postId, contentId);
        setPostPhotos((current) => {
          const next = current.filter((content) => content.id !== contentId);
          if (coverPhotoContentId === contentId) {
            setCoverPhotoContentId(next[0]?.id || "");
          }
          return next;
        });
      } catch (error: unknown) {
        setPhotosError(
          getUserFacingErrorMessage(error, {
            defaultMessage: "No pudimos eliminar la fotografía del anuncio.",
            forbiddenMessage: "No tienes permisos para modificar este anuncio.",
            notFoundMessage: "La fotografía ya no está asociada al anuncio.",
          })
        );
      } finally {
        setPhotosBusy(false);
      }
    },
    [coverPhotoContentId, mode, postId]
  );

  const clearPhotosError = useCallback(() => {
    setPhotosError("");
  }, []);

  const validateForm = useCallback((): boolean => {
    const nextErrors: ModelAdFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "El titulo es obligatorio.";
    }

    if (!description.trim()) {
      nextErrors.description = "La descripcion es obligatoria.";
    }

    if (!catalogId) {
      nextErrors.catalogId = "Selecciona un pais.";
    }

    if (!coverPhotoContentId) {
      nextErrors.coverPhotoContentId = "Selecciona una imagen de portada.";
    }

    const numericPrice = Number(priceAmount);
    if (!priceAmount || Number.isNaN(numericPrice) || numericPrice <= 0) {
      nextErrors.priceAmount = "El precio debe ser mayor que 0.";
    }

    if (services.length === 0) {
      nextErrors.services = "Debes agregar al menos un servicio.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [catalogId, coverPhotoContentId, description, priceAmount, services.length, title]);

  const currentSnapshot = useMemo<LoadedValues>(
    () => ({
      title: title.trim(),
      description: description.trim(),
      priceAmount: priceAmount.trim(),
      catalogId,
      coverPhotoContentId,
      services,
    }),
    [catalogId, coverPhotoContentId, description, priceAmount, services, title]
  );

  const hasChanges = useMemo(() => {
    if (mode === "create") {
      return true;
    }

    const initialSnapshot = initialSnapshotRef.current;
    if (!initialSnapshot) {
      return false;
    }

    return (
      currentSnapshot.title !== initialSnapshot.title ||
      currentSnapshot.description !== initialSnapshot.description ||
      currentSnapshot.priceAmount !== initialSnapshot.priceAmount ||
      currentSnapshot.catalogId !== initialSnapshot.catalogId ||
      currentSnapshot.coverPhotoContentId !== initialSnapshot.coverPhotoContentId ||
      !areArraysEqual(currentSnapshot.services, initialSnapshot.services)
    );
  }, [currentSnapshot, mode]);

  const canSubmit = useMemo(() => {
    const numericPrice = Number(priceAmount);

    return (
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      catalogId.length > 0 &&
      coverPhotoContentId.length > 0 &&
      !Number.isNaN(numericPrice) &&
      numericPrice > 0 &&
      services.length > 0 &&
      !loadingData &&
      !submitting &&
      (mode === "create" || hasChanges)
    );
  }, [catalogId, coverPhotoContentId, description, hasChanges, loadingData, mode, priceAmount, services.length, submitting, title]);

  const submitForm = useCallback(async (): Promise<boolean> => {
    setSubmitError("");
    setSubmitMessage("");

    if (!validateForm()) {
      return false;
    }

    if (mode === "edit" && !postId) {
      setSubmitError("No fue posible identificar la publicación que deseas editar.");
      return false;
    }

    if (mode === "edit" && !hasChanges) {
      setSubmitError("No detectamos cambios para guardar.");
      return false;
    }

    setSubmitting(true);

    try {
      const values: ModelAdFormValues = {
        title: title.trim(),
        description: description.trim(),
        priceAmount: priceAmount.trim(),
        catalogId,
        coverPhotoContentId,
        services,
      };

      if (mode === "create") {
        await createModelPost({
          title: values.title,
          description: values.description,
          coverPhotoContentId: values.coverPhotoContentId,
          contentIds: [values.coverPhotoContentId],
          catalogId: values.catalogId,
          priceAmount: Number(values.priceAmount),
          services: values.services,
        });

        success({
          title: "Publicación creada",
          description: CREATE_SUCCESS_MESSAGE,
        });
        applyInitialValues({
          title: "",
          description: "",
          priceAmount: "",
          catalogId: "",
          coverPhotoContentId: "",
          services: [],
        });
        return true;
      }

      const payload: UpdateModelPostPayload = {};
      const initialSnapshot = initialSnapshotRef.current;

      if (!initialSnapshot || values.title !== initialSnapshot.title) {
        payload.title = values.title;
      }

      if (!initialSnapshot || values.description !== initialSnapshot.description) {
        payload.description = values.description;
      }

      if (!initialSnapshot || values.catalogId !== initialSnapshot.catalogId) {
        payload.catalogId = values.catalogId;
      }

      if (!initialSnapshot || values.coverPhotoContentId !== initialSnapshot.coverPhotoContentId) {
        payload.coverPhotoContentId = values.coverPhotoContentId;
      }

      if (!initialSnapshot || values.priceAmount !== initialSnapshot.priceAmount) {
        payload.priceAmount = Number(values.priceAmount);
      }

      if (!initialSnapshot || !areArraysEqual(values.services, initialSnapshot.services)) {
        payload.services = values.services;
      }

      await updateModelPost(postId!, payload);

      success({
        title: "Cambios guardados",
        description: UPDATE_SUCCESS_MESSAGE,
      });
      onSuccess?.({
        postId: postId!,
        values,
        payload,
      });
      return true;
    } catch (error: unknown) {
      setSubmitError(
        getUserFacingErrorMessage(error, {
          defaultMessage:
            mode === "edit"
              ? "No fue posible guardar los cambios de la publicación."
              : "No fue posible crear la publicación en este momento.",
          badRequestMessage: "Revisa la información del anuncio e inténtalo nuevamente.",
          forbiddenMessage:
            mode === "edit"
              ? "No puedes editar esta publicación porque no te pertenece."
              : "No puedes crear esta publicación con la cuenta actual.",
          conflictMessage:
            mode === "edit"
              ? "No fue posible guardar los cambios porque el estado de la publicación cambió."
              : "No fue posible crear la publicación porque el estado cambió.",
        })
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    applyInitialValues,
    catalogId,
    coverPhotoContentId,
    description,
    hasChanges,
    mode,
    onSuccess,
    postId,
    priceAmount,
    services,
    success,
    title,
    validateForm,
  ]);

  return {
    catalogs: sortedCatalogs,
    selectedCatalog,
    contents,
    postPhotos,
    loadingData,
    loadError,
    title,
    setTitle,
    description,
    setDescription,
    priceAmount,
    setPriceAmount,
    catalogId,
    setCatalogId,
    coverPhotoContentId,
    setCoverPhotoContentId,
    services,
    toggleService,
    photoPickerOpen,
    setPhotoPickerOpen,
    selectedPhotoIdsForAdd,
    togglePhotoSelectionForAdd,
    confirmAddPhotos,
    removePhotoFromPost,
    photosBusy,
    photosError,
    clearPhotosError,
    submitting,
    submitError,
    submitMessage,
    formErrors,
    canSubmit,
    hasChanges,
    catalogOpen,
    setCatalogOpen,
    submitForm,
  };
};