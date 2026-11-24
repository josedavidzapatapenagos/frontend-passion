import { expect, test, type Page } from "@playwright/test";

const account = {
  id: "responsive-admin",
  email: "administrador.con.correo.muy.largo@example.com",
  status: "ACTIVE",
  created_at: "2026-11-01T10:00:00Z",
};

const prepare = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem("catalogId", "1");
    localStorage.setItem("isAdult", "true");
    localStorage.setItem("token", "test-responsive-session");
    localStorage.setItem("auth_session", "true");
    localStorage.setItem("accountType", "SUPER_ADMIN");
  });
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    let data: unknown = [];
    if (url.includes("/posts/catalogs/")) {
      data = [{
        id: "responsive-post",
        title: "Experiencia con Nombre de modelo muy largo",
        description: "Una descripcion suficientemente larga para probar el ajuste del contenido.",
        price: { amount: 100, currency: "USD" },
        services: ["CHAT", "VIDEO_CALL"],
        modelContactMethods: [{ app: "WHATSAPP", value: "573001234567" }],
      }];
    } else if (url.endsWith("/accounts/admins")) {
      data = [account];
    } else if (url.endsWith("/accounts/permissions")) {
      data = ["POST_REVIEW_LIST_VIEW", "POST_REVIEW_VIEW"];
    }
    return route.fulfill({ json: { data } });
  });
};

const expectFitsViewport = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return {
      page: document.documentElement.scrollWidth - width,
      controls: [...document.querySelectorAll("input, select, textarea, main button, h1, h2, h3")]
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && (rect.right > width + 1 || rect.left < -1);
        })
        .map((node) => node.textContent?.trim() || node.tagName),
    };
  });
  expect(overflow.page).toBeLessThanOrEqual(1);
  expect(overflow.controls).toEqual([]);
};

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`forms and navigation fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await prepare(page);
    for (const path of ["/login", "/register", "/register-model", "/account", "/superadmin/admins/create"]) {
      await page.goto(path);
      await expect(page.locator("h1, h2").first()).toBeVisible();
      await expectFitsViewport(page);
    }
    if (width < 1024) {
      await expect(page.locator("aside nav")).toHaveCount(0);
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await expect(page.locator("aside nav")).toBeVisible();
      await expectFitsViewport(page);
      await page.locator("aside nav").getByRole("button", { name: "Cuenta", exact: true }).click();
      await expect(page).toHaveURL(/\/account$/);
      await expect(page.locator("aside nav")).toHaveCount(0);
    } else {
      await page.getByRole("button", { name: "Recoger menú" }).click();
      await expect(page.getByRole("button", { name: "Desplegar menú" })).toBeVisible();
      await expectFitsViewport(page);
      await page.getByRole("button", { name: "Desplegar menú" }).click();
      await expect(page.locator("aside nav")).toBeVisible();
    }
  });

  test(`populated feed and account actions fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await prepare(page);
    await page.goto("/feed");
    await page.getByRole("heading", { name: "Nombre de modelo muy largo" }).click();
    await expect(page.getByRole("heading", { name: "Servicios Virtuales" })).toBeVisible();
    await expectFitsViewport(page);
    await page.goto("/superadmin/admins");
    await expect(page.locator('td[data-label="Correo electrónico"]')).toHaveText(account.email);
    await page.getByRole("button", { name: `Suspender cuenta de ${account.email}`, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectFitsViewport(page);
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}
