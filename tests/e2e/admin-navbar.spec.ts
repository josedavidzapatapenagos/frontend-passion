import { expect, test, type Page } from "@playwright/test";

const reviewPermissions = [
  "POST_REVIEW_LIST_VIEW",
  "POST_REVIEW_VIEW",
  "POST_REVIEW_APPROVE",
  "POST_REVIEW_REJECT",
];

const identityPermissions = [
  "MODEL_REGISTRATION_LIST_VIEW",
  "MODEL_REGISTRATION_VIEW",
  "MODEL_REGISTRATION_APPROVE",
  "MODEL_REGISTRATION_REJECT",
];

const allPermissions = [
  ...identityPermissions,
  ...reviewPermissions,
  "PAYMENT_VIEW_ALL",
  "ADMIN_ACCOUNT_SUSPEND",
  "ADMIN_ACCOUNT_UNSUSPEND",
  "MODEL_ACCOUNT_SUSPEND",
  "MODEL_ACCOUNT_UNSUSPEND",
];

const preparePage = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
  });
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: { data: { content: [], totalElements: 0, totalPages: 0, number: 0 } },
    })
  );
};

const loginAdmin = async (page: Page, payload: Record<string, unknown>) => {
  await preparePage(page);
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      json: {
        access_token: "test-admin-session",
        account_type: "ADMIN",
        account_full_name: "Ana Revision",
        ...payload,
      },
    })
  );
  await page.goto("/login");
  await page.getByPlaceholder("Correo electrónico").fill("ana.revision@example.com");
  await page.getByPlaceholder("Contraseña").fill("Test-only-Password42!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/feed$/);
};

const expectMenu = async (page: Page, expected: string[]) => {
  await expect(page.locator("aside nav button")).toHaveText(expected);
};

for (const task of [
  {
    name: "Revisión de anuncios",
    permissions: reviewPermissions,
    menu: ["Cuenta", "Administración anuncios"],
    path: "/admin/ads",
    heading: "Administracion de anuncios",
  },
  {
    name: "Verificación de identidad",
    permissions: identityPermissions,
    menu: ["Cuenta", "Verificación de identidad"],
    path: "/admin/identity-verifications/pending",
    heading: "Verificacion de identidad",
  },
  {
    name: "Seleccionar todas las tareas",
    permissions: allPermissions,
    menu: ["Cuenta", "Administración anuncios", "Verificación de identidad"],
    path: "/admin/ads",
    heading: "Administracion de anuncios",
  },
]) {
test(`crea un admin con la tarea ${task.name} y filtra su navbar`, async ({ page }) => {
  await preparePage(page);
  await page.addInitScript(() => {
    localStorage.setItem("token", "test-superadmin-session");
    localStorage.setItem("auth_session", "true");
    localStorage.setItem("accountType", "SUPER_ADMIN");
    localStorage.setItem("accountName", "Super Admin");
  });
  await page.route("**/api/v1/superadmin/accounts/permissions", (route) =>
    route.fulfill({ json: { data: allPermissions } })
  );
  const creationRequests: Record<string, unknown>[] = [];
  await page.route("**/api/v1/superadmin/accounts", async (route) => {
    expect(route.request().method()).toBe("POST");
    creationRequests.push(route.request().postDataJSON());
    await route.fulfill({ json: { message: "Cuenta de prueba creada" } });
  });
  await page.route("**/api/v1/auth/login", async (route) => {
    expect(creationRequests).toHaveLength(1);
    await route.fulfill({
      json: {
        access_token: "test-created-admin-session",
        account_type: "ADMIN",
        account_full_name: "Ana Revision",
        permissions: creationRequests[0].permissions,
      },
    });
  });

  await page.goto("/superadmin/admins/create");
  await expect(page.locator("aside nav")).toContainText("Posicionamientos");
  await expect(page.locator("aside nav")).toContainText("Modelos");
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  await expect(page.getByText("Aprobar registros", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Ver anuncios pendientes", { exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: /^Nombre/ }).fill("Ana");
  await page.getByRole("textbox", { name: /^Apellido/ }).fill("Revision");
  await page.getByRole("textbox", { name: /^Correo electrónico/ }).fill("ana.revision@example.com");
  await page.getByLabel(/^Contraseña/).fill("Test-only-Password42!");
  await page.getByLabel(/^Confirmar contraseña/).fill("Test-only-Password42!");
  const reviewGroup = page.getByRole("checkbox", { name: task.name, exact: true });
  await reviewGroup.focus();
  await reviewGroup.press("Space");
  await expect(reviewGroup).toBeChecked();
  await page.getByRole("button", { name: "Crear administrador", exact: true }).click();
  await expect(page.getByText("Cuenta de prueba creada", { exact: true })).toBeVisible();
  expect(creationRequests).toEqual([{
    name: "Ana",
    lastname: "Revision",
    email: "ana.revision@example.com",
    password: "Test-only-Password42!",
    permissions: task.permissions,
  }]);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.getByPlaceholder("Correo electrónico").fill("ana.revision@example.com");
  await page.getByPlaceholder("Contraseña").fill("Test-only-Password42!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expectMenu(page, task.menu);
  await page.goto(task.path);
  await expect(page).toHaveURL(task.path);
  await expect(page.getByRole("heading", { name: task.heading, exact: true })).toBeVisible();
});
}

for (const scenario of [
  { name: "solo identidad", payload: { permissions: ["MODEL_REGISTRATION_LIST_VIEW"] }, menu: ["Cuenta", "Verificación de identidad"] },
  { name: "ambos modulos", payload: { permissions: ["POST_REVIEW_LIST_VIEW", "MODEL_REGISTRATION_LIST_VIEW"] }, menu: ["Cuenta", "Administración anuncios", "Verificación de identidad"] },
  { name: "sin permisos asignados", payload: { permissions: [] }, menu: ["Cuenta"] },
  { name: "permisos no recibidos", payload: {}, menu: ["Cuenta"] },
  { name: "permisos sin pantalla", payload: { permissions: ["PAYMENT_VIEW_ALL", "MODEL_ACCOUNT_SUSPEND", "ADMIN_ACCOUNT_SUSPEND"] }, menu: ["Cuenta"] },
  { name: "accion sin permiso de listado", payload: { permissions: ["POST_REVIEW_APPROVE"] }, menu: ["Cuenta"] },
  { name: "permisos en texto", payload: { permissions: "POST_REVIEW_LIST_VIEW, POST_REVIEW_VIEW" }, menu: ["Cuenta", "Administración anuncios"] },
  { name: "permisos en JWT", payload: { access_token: `e30.${Buffer.from(JSON.stringify({ permissions: ["POST_REVIEW_LIST_VIEW"] })).toString("base64url")}.test` }, menu: ["Cuenta", "Administración anuncios"] },
]) {
  test(`navbar de admin: ${scenario.name}`, async ({ page }) => {
    await loginAdmin(page, scenario.payload);
    await expectMenu(page, scenario.menu);
    if (scenario.name === "permisos no recibidos") {
      await expect(page.getByRole("status")).toContainText("No se pudieron obtener tus permisos");
    }
    await page.reload();
    await expectMenu(page, scenario.menu);
  });
}

for (const path of [
  "/admin/ads",
  "/admin/identity-verifications/pending",
  "/admin/plans",
  "/admin/models",
  "/superadmin/admins/create",
]) {
  test(`no permite acceso directo sin autorizacion: ${path}`, async ({ page }) => {
    await loginAdmin(page, {});
    await page.goto(path);
    await expect(page).toHaveURL(/\/(account|feed)$/);
    await expectMenu(page, ["Cuenta"]);
  });
}
