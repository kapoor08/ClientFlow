import { test, expect } from "@playwright/test";

test.describe("Clients", () => {
  test("clients page loads with table or empty state", async ({ page }) => {
    await page.goto("/clients");

    const hasTable = page.locator("table").first();
    const hasEmptyState = page.getByText(/no clients|create your first client/i);

    await expect(hasTable.or(hasEmptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("new-client button is reachable", async ({ page }) => {
    await page.goto("/clients");
    const newButton = page
      .getByRole("button", { name: /new client|add client|create client/i })
      .first()
      .or(page.getByRole("link", { name: /new client|add client|create client/i }).first());
    await expect(newButton).toBeVisible({ timeout: 10_000 });
  });

  test("client form page loads", async ({ page }) => {
    await page.goto("/clients/new");
    await expect(
      page.getByRole("heading", { name: /new client|add client|create client/i }),
    ).toBeVisible({
      timeout: 10_000,
    });
    // Either a Name field or an Email field should be present.
    const nameField = page.getByLabel(/name/i).first();
    const emailField = page.getByLabel(/email/i).first();
    await expect(nameField.or(emailField)).toBeVisible({ timeout: 10_000 });
  });
});
