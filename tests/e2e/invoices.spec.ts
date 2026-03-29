import { test, expect } from "@playwright/test";

// Session is pre-loaded via storageState in playwright.config.ts (authenticated project)

test.describe("Invoices", () => {
  test("invoices page loads with table or empty state", async ({ page }) => {
    await page.goto("/invoices");

    const hasTable = page.locator("table").first();
    const hasEmptyState = page.getByText(/no invoices|create your first invoice/i);

    await expect(hasTable.or(hasEmptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("can open create invoice dialog", async ({ page }) => {
    await page.goto("/invoices");

    const createButton = page.getByRole("button", { name: /new invoice|create invoice/i });
    await expect(createButton).toBeVisible({ timeout: 10_000 });
    await createButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("invoice dialog has required fields", async ({ page }) => {
    await page.goto("/invoices");

    const createButton = page.getByRole("button", { name: /new invoice|create invoice/i });
    await createButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByLabel(/title|invoice title/i).or(dialog.getByPlaceholder(/title/i))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("invoice dialog has line items section", async ({ page }) => {
    await page.goto("/invoices");

    const createButton = page.getByRole("button", { name: /new invoice|create invoice/i });
    await createButton.click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText(/line items|add item/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
