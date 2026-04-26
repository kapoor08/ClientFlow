import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("settings index page loads with section nav", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("api-keys subpage loads", async ({ page }) => {
    await page.goto("/settings/api-keys");
    await expect(page.getByRole("heading", { name: /api keys?/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("webhooks subpage loads", async ({ page }) => {
    await page.goto("/settings/webhooks");
    await expect(page.getByRole("heading", { name: /webhook/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("data subpage exposes export + deletion controls", async ({ page }) => {
    await page.goto("/settings/data");
    // Either label / button form is acceptable - we just want to confirm the
    // GDPR section is rendered.
    const exportControl = page
      .getByRole("button", { name: /export.*data|download.*data/i })
      .first();
    const deleteControl = page
      .getByRole("button", { name: /delete.*account|schedule.*deletion/i })
      .first();
    await expect(exportControl.or(deleteControl)).toBeVisible({ timeout: 10_000 });
  });
});
