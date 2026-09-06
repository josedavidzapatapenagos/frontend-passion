import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

type ApproveDialogProps = {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ApproveDialog = ({ open, loading, onCancel, onConfirm }: ApproveDialogProps) => {
  return (
    <ConfirmationDialog
      open={open}
      title="¿Deseas aprobar esta publicación?"
      description="Una vez aprobada estará disponible para los usuarios. Revisa cuidadosamente la información antes de continuar."
      tone="warning"
      confirmLabel={loading ? "Aprobando..." : "Aprobar"}
      onCancel={onCancel}
      onConfirm={onConfirm}
      loading={loading}
    />
  );
};
