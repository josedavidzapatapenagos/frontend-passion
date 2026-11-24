import { expect, test } from "@playwright/test";

test("completa selección de región y verificación de edad", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    if (route.request().url().includes("/v1/catalogs")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "1",
              name: "Colombia",
              countryIsoCode: "CO",
              countryFlagUrl: "https://example.com/colombia.png",
              currency: "COP",
            },
          ],
          message: "OK",
          status: "success",
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: [], items: [], content: [] }),
    });
  });

  await page.goto("/");
  await expect(page).toHaveURL(/\/select-country$/);
  await page.getByRole("button", { name: /Colombia/ }).click();
  await page.getByRole("button", { name: "Confirmar Selección" }).click();

  await expect(page).toHaveURL(/\/age-verification$/);
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(
    page.getByText("Debes ser mayor de edad para acceder a Virtual Passion.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Sí, soy mayor de edad" }).click();

  await expect(page).toHaveURL(/\/feed$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("catalogId"))).toBe("1");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("isAdult"))).toBe("true");
});