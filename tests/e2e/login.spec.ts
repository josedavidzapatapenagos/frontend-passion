import { expect, test } from "@playwright/test";

test("muestra el formulario de inicio de sesión y valida campos vacíos", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
  });

  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "Virtual Passion" })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Correo electrónico")).toBeVisible();
  await expect(page.getByPlaceholder("Contraseña")).toBeVisible();

  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("Ingresa tu correo electrónico")).toBeVisible();
});

test("redirige una ruta protegida al login si no hay sesión", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
  });

  await page.goto("/ads");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Virtual Passion" })
  ).toBeVisible();
});

test("muestra un error cuando el backend rechaza las credenciales", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
  });
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    })
  );

  await page.goto("/login");
  await page.getByPlaceholder("Correo electrónico").fill("demo@example.com");
  await page.getByPlaceholder("Contraseña").fill("wrong-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();
});

for (const responseBody of [
  { message: "El correo electrónico no ha sido verificado." },
  { messages: ["La cuenta no puede autenticarse.", "Debes verificar tu email."] },
  { message: "Email not verified." },
]) {
  test(`solicita el código de correo al iniciar sesión: ${JSON.stringify(responseBody)}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("catalogId", "1");
      localStorage.setItem("isAdult", "true");
    });
    let loginAttempts = 0;
    await page.route("**/api/v1/auth/login", (route) => {
      loginAttempts += 1;
      return route.fulfill({
        status: loginAttempts === 1 ? 409 : 200,
        contentType: "application/json",
        body: JSON.stringify(loginAttempts === 1 ? responseBody : {
          access_token: "test-admin-session",
          account_type: "ADMIN",
          account_full_name: "Administrador",
          permissions: [],
        }),
      });
    });
    const verificationRequests: string[] = [];
    await page.route("**/api/v1/models/accounts/email/verify?*", async (route) => {
      expect(route.request().method()).toBe("POST");
      verificationRequests.push(new URL(route.request().url()).searchParams.get("token") || "");
      await route.fulfill({
        status: verificationRequests.length === 1 ? 400 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          verificationRequests.length === 1
            ? { message: "El código es inválido o ha expirado." }
            : { message: "El correo fue verificado exitosamente.", status: "OK" }
        ),
      });
    });

    await page.goto("/login");
    await page.getByPlaceholder("Correo electrónico").fill("admin@example.com");
    await page.getByPlaceholder("Contraseña").fill("admin-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/verify-email$/);
    await expect(page.getByRole("heading", { name: "Verificar correo" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("accountType"))).toBeNull();

    await page.getByRole("button", { name: "Verificar correo" }).click();
    expect(verificationRequests).toHaveLength(0);

    await page.getByLabel("Código de verificación").fill("incorrecto");
    await page.getByRole("button", { name: "Verificar correo" }).click();
    await expect(page.getByText("El código es inválido o ha expirado.")).toBeVisible();
    await expect(page).toHaveURL(/\/verify-email$/);

    await page.getByLabel("Código de verificación").fill("  evv3tr85j7jivo1qk6428148f7  ");
    await page.getByRole("button", { name: "Verificar correo" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder("Correo electrónico")).toHaveValue("admin@example.com");
    await expect(page.getByPlaceholder("Contraseña")).toHaveValue("");
    expect(verificationRequests).toEqual(["incorrecto", "evv3tr85j7jivo1qk6428148f7"]);
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
    expect(loginAttempts).toBe(1);

    await page.getByPlaceholder("Contraseña").fill("admin-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/feed$/);
    expect(await page.evaluate(() => localStorage.getItem("accountType"))).toBe("ADMIN");
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBe("test-admin-session");
    expect(verificationRequests).toHaveLength(2);
  });
}

for (const message of [
  "La cuenta está desactivada (INACTIVE).",
  "La cuenta no puede autenticarse.",
]) {
  test(`no solicita verificar el correo por otro conflicto: ${message}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("catalogId", "1");
      localStorage.setItem("isAdult", "true");
    });
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message }),
      })
    );

    await page.goto("/login");
    await page.getByPlaceholder("Correo electrónico").fill("admin@example.com");
    await page.getByPlaceholder("Contraseña").fill("admin-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
}

for (const { status, body } of [
  { status: 409, body: { message: "La cuenta está suspendida (SUSPENDED)." } },
  { status: 403, body: { message: "Account is suspended." } },
  { status: 401, body: { message: "Cuenta suspendida." } },
  { status: 500, body: { messages: ["La cuenta no puede autenticarse.", "Cuenta suspendida."] } },
]) {
  test(`muestra la suspensión al rechazar el login con HTTP ${status}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("catalogId", "1");
      localStorage.setItem("isAdult", "true");
    });
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({ status, json: body })
    );

    await page.goto("/login");
    await page.getByPlaceholder("Correo electrónico").fill("admin@example.com");
    await page.getByPlaceholder("Contraseña").fill("admin-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("Tu cuenta ha sido suspendida.", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  });
}

test("mantiene el error genérico para fallos del servidor que no indican suspensión", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
  });
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({ status: 500, json: { message: "Internal server error" } })
  );

  await page.goto("/login");
  await page.getByPlaceholder("Correo electrónico").fill("admin@example.com");
  await page.getByPlaceholder("Contraseña").fill("admin-password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Ocurrió un problema inesperado.")).toBeVisible();
});