import { SettingsLayout, type SettingsTab } from "../components/SettingsLayout";
import { IdentityVerificationSection } from "../features/account/components/IdentityVerificationSection";
import { ModelAccountUpdateSection } from "../features/account/components/ModelAccountUpdateSection";
import { PasswordChangeSection } from "../features/account/components/PasswordChangeSection";
import { useIdentityVerification } from "../features/account/hooks/useIdentityVerification";
import { useModelAccountUpdate } from "../features/account/hooks/useModelAccountUpdate";
import { usePasswordChange } from "../features/account/hooks/usePasswordChange";

export const AccountPage = () => {
  const normalizedAccountType = localStorage
    .getItem("accountType")
    ?.toUpperCase()
    .replace("ROLE_", "")
    .replace("SUPERADMIN", "SUPER_ADMIN");

  const isModel = normalizedAccountType === "MODEL";
  const isAdmin =
    normalizedAccountType === "ADMIN" || normalizedAccountType === "SUPER_ADMIN";

  const {
    documentType,
    setDocumentType,
    documentNumber,
    setDocumentNumber,
    status,
    loadingStatus,
    sendingVerification,
    message,
    error,
    isVerificationLocked,
    verificationLockReason,
    handleCheckStatus,
    handleSubmitVerification,
    handleDocumentImageChange,
    handleSelfieImageChange,
  } = useIdentityVerification(isModel);

  const { profile, loadingProfile, profileError, loadProfile } = useModelAccountUpdate(isModel);

  const {
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
  } = usePasswordChange();

  const accountTabs: SettingsTab[] = [
    {
      id: "verification",
      label: "Verificación de identidad",
      content: (
        <IdentityVerificationSection
          status={status}
          loadingStatus={loadingStatus}
          sendingVerification={sendingVerification}
          isVerificationLocked={isVerificationLocked}
          verificationLockReason={verificationLockReason}
          documentType={documentType}
          documentNumber={documentNumber}
          message={message}
          error={error}
          onDocumentTypeChange={setDocumentType}
          onDocumentNumberChange={setDocumentNumber}
          onDocumentImageChange={handleDocumentImageChange}
          onSelfieImageChange={handleSelfieImageChange}
          onSyncStatus={() => {
            void handleCheckStatus();
          }}
          onSubmitVerification={(event) => {
            void handleSubmitVerification(event);
          }}
        />
      ),
    },
    {
      id: "profile",
      label: "Información personal",
      content: (
        <ModelAccountUpdateSection
          profile={profile}
          loadingProfile={loadingProfile}
          profileError={profileError}
          onReload={() => {
            void loadProfile();
          }}
        />
      ),
    },
    {
      id: "password",
      label: "Cambiar contraseña",
      content: (
        <PasswordChangeSection
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          changingPassword={changingPassword}
          passwordError={passwordError}
          passwordMessage={passwordMessage}
          onCurrentPasswordChange={setCurrentPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={(event) => {
            void handleChangePassword(event);
          }}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] p-6 md:p-8 text-slate-900 dark:text-white shadow-xl shadow-slate-200/70 dark:shadow-black/20">
        <h2 className="text-2xl md:text-3xl font-black text-[#FD0083]">Cuenta</h2>
        <p className="mt-2 text-slate-600 dark:text-white/70">Gestiona tus opciones de cuenta.</p>

        {!isModel && !isAdmin && (
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4 text-slate-700 dark:text-white/80">
            Esta sección solo está disponible para perfiles de tipo MODEL.
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-4">
              <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wide mb-2">
                Cuenta administrador
              </p>
              <p className="text-sm text-slate-700 dark:text-white/80">
                Opciones estaticas temporales del panel de cuenta administrativa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                <p className="text-sm font-bold text-[#00BCD4]">Perfil administrativo</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Configuración general del perfil de admin.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                <p className="text-sm font-bold text-[#00BCD4]">Seguridad</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Gestión de credenciales y políticas de acceso.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                <p className="text-sm font-bold text-[#00BCD4]">Preferencias del panel</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Ajustes visuales y de notificaciones del administrador.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                <p className="text-sm font-bold text-[#00BCD4]">Auditoría</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Historial y trazabilidad de acciones administrativas.
                </p>
              </div>
            </div>
          </div>
        )}

        {isModel && (
          <SettingsLayout
            title="Cuenta"
            subtitle="Gestiona tus opciones de cuenta."
            tabsLabel="Opciones de cuenta"
            tabs={accountTabs}
            initialTabId="verification"
            panelClassName="rounded-none border-0 bg-transparent p-0 text-inherit shadow-none"
            contentClassName="mt-6"
          />
        )}
      </div>
    </div>
  );
};