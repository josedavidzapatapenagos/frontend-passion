import { expect, test, type Page } from "@playwright/test";

const id = "550e8400-e29b-41d4-a716-446655440000";
const model = {
  id, name: "Ana", lastname: "Modelo", email: "model@example.com",
  status: "ACTIVE", created_at: "2026-11-24T12:00:00Z",
};

const prepare = async (page: Page, role = "SUPER_ADMIN") => {
  await page.addInitScript((accountType) => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
    localStorage.setItem("token", "test-session");
    localStorage.setItem("auth_session", "true");
    localStorage.setItem("accountType", accountType);
    localStorage.setItem("accountPermissions", JSON.stringify(["MODEL_ACCOUNT_SUSPEND", "MODEL_ACCOUNT_UNSUSPEND"]));
  }, role);
  await page.route("**/api/**", (route) =>
    route.fulfill({ json: { data: { content: [], totalPages: 0, totalElements: 0 } } })
  );
};

test("Modelos en la navbar abre el listado con nombre y filtro por estado", async ({ page }) => {
  await prepare(page);
  const filters: (string | null)[] = [];
  await page.route(/\/api\/v1\/superadmin\/accounts\/models(?:\?.*)?$/, async (route) => {
    const status = new URL(route.request().url()).searchParams.get("status");
    filters.push(status);
    await route.fulfill({ json: { data: status === "INACTIVE" ? [] : [model] } });
  });
  await page.goto("/feed");
  await page.getByRole("button", { name: "Modelos", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/models$/);
  await expect(page.getByRole("cell", { name: "Ana Modelo", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: model.email, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Crear administrador", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Gestionar permisos/ })).toHaveCount(0);
  await page.getByLabel("Estado", { exact: true }).selectOption("INACTIVE");
  await expect(page.getByText("No hay modelos para el estado seleccionado.")).toBeVisible();
  expect(filters).toEqual([null, "INACTIVE"]);
});

test("suspende y reactiva modelos con PATCH sin cuerpo y conserva el filtro", async ({ page }) => {
  await prepare(page);
  let status = "ACTIVE";
  const actions: string[] = [];
  await page.route(/\/api\/v1\/superadmin\/accounts\/models(?:\?.*)?$/, async (route) => {
    const filter = new URL(route.request().url()).searchParams.get("status");
    await route.fulfill({ json: { data: !filter || filter === status ? [{ ...model, status }] : [] } });
  });
  await page.route(`**/api/v1/admin/accounts/models/${id}/*`, async (route) => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postData()).toBeNull();
    const action = route.request().url().split("/").pop()!;
    actions.push(action);
    status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
    await route.fulfill({ json: { message: "Estado de modelo actualizado" } });
  });
  await page.goto("/admin/models");
  await page.getByRole("button", { name: `Suspender cuenta de ${model.email}`, exact: true }).click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(actions).toEqual([]);
  await page.getByLabel("Estado", { exact: true }).selectOption("ACTIVE");
  await page.getByRole("button", { name: `Suspender cuenta de ${model.email}`, exact: true }).click();
  await page.getByRole("button", { name: "Confirmar suspensión", exact: true }).click();
  await expect(page.getByText("No hay modelos para el estado seleccionado.")).toBeVisible();
  await expect(page.getByLabel("Estado", { exact: true })).toHaveValue("ACTIVE");
  await page.getByLabel("Estado", { exact: true }).selectOption("SUSPENDED");
  await page.getByRole("button", { name: `Quitar suspensión de ${model.email}`, exact: true }).click();
  await expect(page.getByText(/El backend requiere correo verificado e identidad aprobada/)).toBeVisible();
  await page.getByRole("button", { name: "Confirmar reactivación", exact: true }).click();
  await expect(page.getByText("No hay modelos para el estado seleccionado.")).toBeVisible();
  expect(actions).toEqual(["suspend", "unsuspend"]);
});

test("correo o identidad pendientes impiden reactivar y muestran el rechazo del backend", async ({ page }) => {
  await prepare(page);
  await page.route("**/api/v1/superadmin/accounts/models", (route) =>
    route.fulfill({ json: { data: [{ ...model, status: "SUSPENDED" }] } })
  );
  await page.route(`**/api/v1/admin/accounts/models/${id}/unsuspend`, (route) =>
    route.fulfill({ status: 409, json: { message: "No se puede quitar suspension: la verificacion de identidad no esta aprobada" } })
  );
  await page.goto("/admin/models");
  await page.getByRole("button", { name: `Quitar suspensión de ${model.email}`, exact: true }).click();
  await page.getByRole("button", { name: "Confirmar reactivación", exact: true }).click();
  await expect(page.getByText("No se puede quitar suspension: la verificacion de identidad no esta aprobada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Quitar suspensión de ${model.email}`, exact: true })).toBeEnabled();
});

test("cuentas MODEL pendientes o inactivas no muestran acciones de suspension", async ({ page }) => {
  await prepare(page);
  await page.route("**/api/v1/superadmin/accounts/models", (route) =>
    route.fulfill({ json: { data: [
      { ...model, status: "PENDING_VERIFICATION" },
      { ...model, id: "inactive-model", email: "inactive@example.com", status: "INACTIVE" },
    ] } })
  );
  await page.goto("/admin/models");
  await expect(page.getByRole("cell", { name: model.email, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Suspender cuenta de / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Quitar suspensión de / })).toHaveCount(0);
});

for (const role of ["ADMIN", "MODEL"]) {
  test(`el listado exclusivo de superadmin no es accesible para ${role}`, async ({ page }) => {
    await prepare(page, role);
    let calls = 0;
    await page.route("**/api/v1/superadmin/accounts/models", (route) => {
      calls += 1;
      return route.fulfill({ json: { data: [] } });
    });
    await page.goto("/admin/models");
    await expect(page).toHaveURL(/\/feed$/);
    expect(calls).toBe(0);
  });
}
