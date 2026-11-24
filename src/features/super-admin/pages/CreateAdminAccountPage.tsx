import { useState, type FormEvent } from "react";
import { Button, FieldError, Input, Label, Spinner, TextField } from "@heroui/react";
import { InfoCard } from "@/components/common/InfoCard";
import { useNotification } from "@/hooks/useNotification";
import type { AdminPermission } from "@/features/auth/constants/adminPermissions";
import { PermissionsSelector } from "@/features/super-admin/components/PermissionsSelector";
import { useAdminPermissionsCatalog } from "@/features/super-admin/hooks/useAdminPermissionsCatalog";
import { createAdminAccount } from "@/features/super-admin/services/superAdminAccountsService";
import { getUserFacingErrorMessage } from "@/utils/errors/errorMapper";

type FormValues = {
  name: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormValues | "permissions", string>>;

const INITIAL_VALUES: FormValues = {
  name: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 256;
const EMAIL_MAX_LENGTH = 254;
// Same limits enforced by login, so the new admin can actually sign in.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

const validate = (values: FormValues, permissions: AdminPermission[]): FormErrors => {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = "Ingresa el nombre.";
  else if (values.name.trim().length > NAME_MAX_LENGTH) errors.name = "El nombre es demasiado largo.";

  if (!values.lastname.trim()) errors.lastname = "Ingresa el apellido.";
  else if (values.lastname.trim().length > NAME_MAX_LENGTH) errors.lastname = "El apellido es demasiado largo.";

  if (!values.email.trim()) errors.email = "Ingresa el correo electrónico.";
  else if (!EMAIL_REGEX.test(values.email.trim()) || values.email.trim().length > EMAIL_MAX_LENGTH) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (!values.password) errors.password = "Ingresa una contraseña.";
  else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`;
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  if (permissions.length === 0) {
    errors.permissions = "Selecciona al menos un permiso para el administrador.";
  }

  return errors;
};

const inputClassName = "w-full rounded-xl border vp-input px-4 py-3";

export const CreateAdminAccountPage = () => {
  const { success, error: notifyError } = useNotification();
  const catalog = useAdminPermissionsCatalog();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof FormValues) => (nextValue: string) => {
    const nextValues = { ...values, [field]: nextValue };
    setValues(nextValues);
    if (submitted) setErrors(validate(nextValues, permissions));
  };

  const updatePermissions = (next: AdminPermission[]) => {
    setPermissions(next);
    if (submitted) setErrors(validate(values, next));
  };

  const resetForm = () => {
    setValues(INITIAL_VALUES);
    setPermissions([]);
    setErrors({});
    setSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const validationErrors = validate(values, permissions);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);

    try {
      const response = await createAdminAccount({
        name: values.name,
        lastname: values.lastname,
        email: values.email,
        password: values.password,
        permissions,
      });

      success({
        title: "Administrador creado",
        description: response?.message || "La cuenta de administrador se creó correctamente.",
      });
      resetForm();
    } catch (err: unknown) {
      notifyError({
        title: "No se pudo crear el administrador",
        description: getUserFacingErrorMessage(err, {
          defaultMessage: "No se pudo crear la cuenta de administrador.",
          conflictMessage: "Ya existe una cuenta registrada con este correo.",
          forbiddenMessage: "Solo un superadministrador puede crear cuentas de administrador.",
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    field: keyof FormValues,
    label: string,
    options: { type?: string; placeholder?: string; autoComplete?: string } = {}
  ) => (
    <TextField
      name={field}
      type={options.type ?? "text"}
      value={values[field]}
      onChange={updateField(field)}
      isInvalid={Boolean(errors[field])}
      isDisabled={saving}
      isRequired
      fullWidth
      className="flex flex-col gap-2"
    >
      <Label className="text-sm font-semibold vp-text-primary">{label}</Label>
      <Input className={inputClassName} placeholder={options.placeholder} autoComplete={options.autoComplete} />
      <FieldError className="text-xs font-medium text-rose-600 dark:text-rose-300">{errors[field]}</FieldError>
    </TextField>
  );

  return (
    <div className="min-h-screen p-6 md:p-10 vp-text-primary">
      <div className="mx-auto max-w-5xl rounded-3xl border vp-border vp-surface p-6 md:p-8">
        <div>
          <h2 className="text-2xl font-black text-[#FD0083] md:text-3xl">Crear administrador</h2>
          <p className="mt-2 vp-text-secondary">
            Registra una nueva cuenta administrativa y define qué acciones podrá realizar en la plataforma.
          </p>
        </div>

        <div className="mt-4">
          <InfoCard
            title="Principio de mínimo privilegio"
            description="Asigna solo los permisos necesarios. El administrador verá en su menú únicamente las secciones que sus permisos le habiliten."
          />
        </div>

        <form className="mt-6 space-y-8" onSubmit={handleSubmit} noValidate>
          <section>
            <h3 className="mb-4 text-lg font-bold">Datos de la cuenta</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderField("name", "Nombre", { placeholder: "Nombre", autoComplete: "given-name" })}
              {renderField("lastname", "Apellido", { placeholder: "Apellido", autoComplete: "family-name" })}
              <div className="md:col-span-2">
                {renderField("email", "Correo electrónico", {
                  type: "email",
                  placeholder: "admin@correo.com",
                  autoComplete: "off",
                })}
              </div>
              {renderField("password", "Contraseña", {
                type: "password",
                placeholder: `Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`,
                autoComplete: "new-password",
              })}
              {renderField("confirmPassword", "Confirmar contraseña", {
                type: "password",
                placeholder: "Repite la contraseña",
                autoComplete: "new-password",
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-lg font-bold">Permisos</h3>
            <p className="mb-4 text-sm vp-text-secondary">
              Selecciona las tareas que este administrador podrá gestionar. Cada tarea asigna todos sus permisos disponibles, sin seleccionar acciones por separado.
            </p>
            <PermissionsSelector
              available={catalog.permissions}
              value={permissions}
              onChange={updatePermissions}
              loading={catalog.loading}
              error={catalog.error}
              onRetry={() => void catalog.reload()}
              invalidMessage={errors.permissions}
              isDisabled={saving}
            />
          </section>

          <div className="flex flex-col-reverse gap-3 border-t vp-border pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onPress={resetForm}
              isDisabled={saving}
              className="rounded-xl px-5 py-3 vp-text-primary"
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              isDisabled={saving || catalog.loading || Boolean(catalog.error)}
              className="rounded-xl bg-[#FD0083] px-6 py-3 font-bold text-white hover:bg-[#ff1a8f]"
            >
              {saving && <Spinner size="sm" color="current" />}
              {saving ? "Creando..." : "Crear administrador"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
