import { useState, type FormEvent } from "react";
import { updateModelPassword } from "@/features/account/services/accountSettingsService";
import { getBackendErrorMessage, getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

export const usePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("Completa todos los campos para cambiar tu contraseña.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword.length > 64) {
      setPasswordError("La nueva contraseña no puede superar los 64 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await updateModelPassword({
        currentPassword,
        newPassword,
      });

      setPasswordMessage(
        response.message || "Tu contraseña fue actualizada correctamente."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const statusCode = (err as { response?: { status?: number } }).response?.status;
      const backendMessage = getBackendErrorMessage(err) || "";
      const runtimeMessage = err instanceof Error ? err.message : "";
      const normalizedMessage = backendMessage.toLowerCase();

      if (
        statusCode === 409 ||
        statusCode === 429 ||
        normalizedMessage.includes("demasiadas solicitudes") ||
        normalizedMessage.includes("too_many_requests")
      ) {
        setPasswordError("Demasiados intentos. Vuelve a intentarlo en 10 minutos.");
      } else if (statusCode === 400) {
        setPasswordError(
          getUserFacingErrorMessage(err, {
            defaultMessage: "Revisa los datos ingresados y vuelve a intentarlo.",
            badRequestMessage: "Revisa los datos ingresados y vuelve a intentarlo.",
          })
        );
      } else if (statusCode === 403) {
        setPasswordError(
          backendMessage || "Solo cuentas MODEL activas pueden cambiar la contraseña."
        );
      } else {
        setPasswordError(
          getUserFacingErrorMessage(err, {
            defaultMessage: runtimeMessage || "No se pudo cambiar la contraseña en este momento.",
          })
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    changingPassword,
    passwordError,
    passwordMessage,
    handleChangePassword,
  };
};
