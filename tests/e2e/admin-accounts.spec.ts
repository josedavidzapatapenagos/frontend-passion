import { expect, test, type Page } from "@playwright/test";

const id = "5a6b3b7f-defe-475e-a35b-ff0fa221c92e";
const email = "admin@example.com";
const identity = [
  "MODEL_REGISTRATION_LIST_VIEW", "MODEL_REGISTRATION_VIEW",
  "MODEL_REGISTRATION_APPROVE", "MODEL_REGISTRATION_REJECT",
];
const review = ["POST_REVIEW_LIST_VIEW", "POST_REVIEW_VIEW", "POST_REVIEW_APPROVE", "POST_REVIEW_REJECT"];
const account = { id, email, status: "ACTIVE", created_at: "2026-11-24T14:44:31.700027Z" };

const prepare = async (page: Page, role = "SUPER_ADMIN") => {
  await page.addInitScript((accountType) => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
    localStorage.setItem("token", "test-session");
    localStorage.setItem("auth_session", "true");
    localStorage.setItem("accountType", accountType);
    localStorage.setItem("accountName", "Test Admin");
    localStorage.setItem("accountPermissions", "[]");
  }, role);
  await page.route("**/api/**", (route) =>
    route.fulfill({ json: { data: { content: [], totalElements: 0, totalPages: 0 } } })
  );
  await page.route("**/api/v1/superadmin/accounts/permissions", (route) =>
    route.fulfill({ json: { data: [...identity, ...review] } })
  );
};

const toggle = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.focus();
  await checkbox.press("Space");
};

test("navega desde la navbar y filtra administradores por estado", async ({ page }) => {
  await prepare(page);
  const filters: (string | null)[] = [];
  await page.route("**/api/v1/superadmin/accounts/admins?*", async (route) => {
    const status = new URL(route.request().url()).searchParams.get("status");
    filters.push(status);
    await route.fulfill({ json: { data: status === "SUSPENDED" ? [] : [account] } });
  });
  await page.route("**/api/v1/superadmin/accounts/admins", async (route) => {
    filters.push(null);
    await route.fulfill({ json: { data: [account] } });
  });
  await page.goto("/feed");
  await page.getByRole("button", { name: "Abrir menú Administradores" }).click();
  await page.getByRole("menuitem", { name: /Ver administradores/ }).click();
  await expect(page).toHaveURL(/\/superadmin\/admins$/);
  await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
  await page.getByLabel("Estado", { exact: true }).selectOption("SUSPENDED");
  await expect(page.getByText("No hay administradores para el estado seleccionado.")).toBeVisible();
  await page.getByLabel("Estado", { exact: true }).selectOption("ACTIVE");
  await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
  expect(filters).toEqual([null, "SUSPENDED", "ACTIVE"]);
});

test("asigna solo permisos faltantes de la tarea y confirma su revocacion", async ({ page }) => {
  await prepare(page);
  let assigned = [identity[0]];
  const requests: { action: string; permissions: string[] }[] = [];
  await page.route("**/api/v1/superadmin/accounts/admins", (route) => route.fulfill({ json: { data: [account] } }));
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}`, (route) =>
    route.fulfill({ json: { data: { ...account, type: "ADMIN", name: "Ana", lastname: "Test", admin_permissions: assigned } } })
  );
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}/permissions/*`, async (route) => {
    expect(route.request().method()).toBe("PATCH");
    const action = route.request().url().split("/").pop()!;
    const { permissions } = route.request().postDataJSON() as { permissions: string[] };
    requests.push({ action, permissions });
    assigned = action === "assign"
      ? [...assigned, ...permissions]
      : assigned.filter((permission) => !permissions.includes(permission));
    await route.fulfill({ json: { message: "Cambio aplicado" } });
  });
  await page.goto("/superadmin/admins");
  await page.getByRole("button", { name: `Gestionar permisos de ${email}` }).click();
  await expect(page.getByText("1 permisos asignados", { exact: false })).toBeVisible();
  await toggle(page, "Verificación de identidad");
  await page.getByRole("button", { name: "Asignar tareas seleccionadas", exact: true }).click();
  await expect(page.getByText("4 permisos asignados", { exact: false })).toBeVisible();
  expect(requests).toEqual([{ action: "assign", permissions: identity.slice(1) }]);
  await page.getByLabel("Operación", { exact: true }).selectOption("revoke");
  await toggle(page, "Verificación de identidad");
  await page.getByRole("button", { name: "Revocar tareas seleccionadas", exact: true }).click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Revocar tareas seleccionadas", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar revocación", exact: true }).click();
  await expect(page.getByText("Sin tareas asignadas.", { exact: true })).toBeVisible();
  expect(requests[1]).toEqual({ action: "revoke", permissions: identity });
});

test("muestra errores del listado y detalle y permite reintentar", async ({ page }) => {
  await prepare(page);
  let listAttempts = 0;
  let detailAttempts = 0;
  await page.route("**/api/v1/superadmin/accounts/admins", (route) => {
    listAttempts += 1;
    return route.fulfill(listAttempts === 1
      ? { status: 500, json: { message: "Error" } }
      : { json: { data: [account] } });
  });
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}`, (route) => {
    detailAttempts += 1;
    return route.fulfill(detailAttempts === 1
      ? { status: 500, json: { message: "Error" } }
      : { json: { data: { ...account, admin_permissions: [] } } });
  });
  await page.goto("/superadmin/admins");
  await expect(page.getByRole("alert")).toContainText("Ocurrió un problema inesperado.");
  await page.getByRole("button", { name: "Reintentar listado" }).click();
  await page.getByRole("button", { name: `Gestionar permisos de ${email}` }).click();
  await expect(page.getByRole("alert")).toContainText("Ocurrió un problema inesperado.");
  await page.getByRole("button", { name: "Reintentar detalle" }).click();
  await expect(page.getByText("Sin tareas asignadas.", { exact: true })).toBeVisible();
});

test("un fallo del PATCH no modifica los permisos mostrados", async ({ page }) => {
  await prepare(page);
  await page.route("**/api/v1/superadmin/accounts/admins", (route) => route.fulfill({ json: { data: [account] } }));
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}`, (route) =>
    route.fulfill({ json: { data: { ...account, admin_permissions: identity } } })
  );
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}/permissions/revoke`, (route) =>
    route.fulfill({ status: 403, json: { message: "Forbidden" } })
  );
  await page.goto("/superadmin/admins");
  await page.getByRole("button", { name: `Gestionar permisos de ${email}` }).click();
  await page.getByLabel("Operación", { exact: true }).selectOption("revoke");
  await toggle(page, "Verificación de identidad");
  await page.getByRole("button", { name: "Revocar tareas seleccionadas" }).click();
  await page.getByRole("button", { name: "Confirmar revocación" }).click();
  await expect(page.getByText("No se pudieron actualizar los permisos", { exact: true })).toBeVisible();
  await expect(page.getByText("4 permisos asignados", { exact: false })).toBeVisible();
});

test("ADMIN no puede acceder al listado exclusivo del SUPER_ADMIN", async ({ page }) => {
  await prepare(page, "ADMIN");
  let requests = 0;
  await page.route("**/api/v1/superadmin/accounts/admins", (route) => {
    requests += 1;
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto("/superadmin/admins");
  await expect(page).toHaveURL(/\/feed$/);
  expect(requests).toBe(0);
});

test("bloquea nuevas operaciones si falla la consulta posterior a un cambio aplicado", async ({ page }) => {
  await prepare(page);
  let detailCalls = 0;
  await page.route("**/api/v1/superadmin/accounts/admins", (route) => route.fulfill({ json: { data: [account] } }));
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}`, (route) => {
    detailCalls += 1;
    return route.fulfill(detailCalls === 2
      ? { status: 500, json: { message: "Error" } }
      : { json: { data: { ...account, admin_permissions: detailCalls === 1 ? [] : identity } } });
  });
  await page.route(`**/api/v1/superadmin/accounts/admins/${id}/permissions/assign`, (route) =>
    route.fulfill({ json: { message: "Permisos actualizados" } })
  );
  await page.goto("/superadmin/admins");
  await page.getByRole("button", { name: `Gestionar permisos de ${email}` }).click();
  await toggle(page, "Verificación de identidad");
  await page.getByRole("button", { name: "Asignar tareas seleccionadas", exact: true }).click();
  await expect(page.getByText("Permisos actualizados", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar detalle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Asignar tareas seleccionadas", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reintentar detalle" }).click();
  await expect(page.getByText("4 permisos asignados", { exact: false })).toBeVisible();
});

test("suspende y quita suspension con confirmacion, sin enviar cuerpo ni eliminar la cuenta", async ({ page }) => {
  await prepare(page);
  let status = "ACTIVE";
  const actions: string[] = [];
  await page.route("**/api/v1/superadmin/accounts/admins", (route) =>
    route.fulfill({ json: { data: [{ ...account, status }] } })
  );
  await page.route(`**/api/v1/admin/accounts/admins/${id}/*`, async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postData()).toBeNull();
    const action = route.request().url().split("/").pop()!;
    actions.push(action);
    status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
    await route.fulfill({ json: { message: "Estado actualizado" } });
  });
  await page.goto("/superadmin/admins");
  await page.getByRole("button", { name: `Suspender cuenta de ${email}`, exact: true }).click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(actions).toEqual([]);
  await page.getByRole("button", { name: `Suspender cuenta de ${email}`, exact: true }).click();
  await page.getByRole("button", { name: "Confirmar suspensión", exact: true }).click();
  await expect(page.getByRole("button", { name: `Quitar suspensión de ${email}`, exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Quitar suspensión de ${email}`, exact: true }).click();
  await page.getByRole("button", { name: "Confirmar reactivación", exact: true }).click();
  await expect(page.getByRole("button", { name: `Suspender cuenta de ${email}`, exact: true })).toBeVisible();
  expect(actions).toEqual(["suspend", "unsuspend"]);
});

test("mantiene el filtro activo al recargar despues de suspender", async ({ page }) => {
  await prepare(page);
  let status = "ACTIVE";
  const filters: (string | null)[] = [];
  await page.route(/\/api\/v1\/superadmin\/accounts\/admins(?:\?.*)?$/, async (route) => {
    const filter = new URL(route.request().url()).searchParams.get("status");
    filters.push(filter);
    await route.fulfill({ json: { data: !filter || filter === status ? [{ ...account, status }] : [] } });
  });
  await page.route(`**/api/v1/admin/accounts/admins/${id}/suspend`, async (route) => {
    status = "SUSPENDED";
    await route.fulfill({ json: { message: "Cuenta suspendida" } });
  });
  await page.goto("/superadmin/admins");
  await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
  await page.getByLabel("Estado", { exact: true }).selectOption("ACTIVE");
  await page.getByRole("button", { name: `Suspender cuenta de ${email}`, exact: true }).click();
  await page.getByRole("button", { name: "Confirmar suspensión", exact: true }).click();
  await expect(page.getByText("No hay administradores para el estado seleccionado.")).toBeVisible();
  await expect(page.getByLabel("Estado", { exact: true })).toHaveValue("ACTIVE");
  expect(filters).toEqual([null, "ACTIVE", "ACTIVE"]);
});

test("muestra el rechazo por correo no verificado sin cambiar una cuenta suspendida", async ({ page }) => {
  await prepare(page);
  await page.route("**/api/v1/superadmin/accounts/admins", (route) =>
    route.fulfill({ json: { data: [{ ...account, status: "SUSPENDED" }] } })
  );
  await page.route(`**/api/v1/admin/accounts/admins/${id}/unsuspend`, (route) =>
    route.fulfill({ status: 409, json: { message: "No se puede quitar suspension: correo no verificado" } })
  );
  await page.goto("/superadmin/admins");
  await page.getByRole("button", { name: `Quitar suspensión de ${email}`, exact: true }).click();
  await page.getByRole("button", { name: "Confirmar reactivación", exact: true }).click();
  await expect(page.getByText("No se puede quitar suspension: correo no verificado", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Quitar suspensión de ${email}`, exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: `Suspender cuenta de ${email}`, exact: true })).toHaveCount(0);
});

test("ofrece suspension para cuentas pendientes pero no para inactivas", async ({ page }) => {
  await prepare(page);
  await page.route("**/api/v1/superadmin/accounts/admins", (route) =>
    route.fulfill({ json: { data: [
      { ...account, status: "PENDING_VERIFICATION" },
      { ...account, id: "inactive-admin", email: "inactive@example.com", status: "INACTIVE" },
    ] } })
  );
  await page.goto("/superadmin/admins");
  await expect(page.getByRole("button", { name: `Suspender cuenta de ${email}`, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Suspender cuenta de inactive@example.com", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Quitar suspensión de inactive@example.com", exact: true })).toHaveCount(0);
});
