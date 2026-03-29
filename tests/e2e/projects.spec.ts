import { test, expect } from "@playwright/test";

// Session is pre-loaded via storageState in playwright.config.ts (authenticated project)

test.describe("Projects", () => {
  test("projects page loads with table or empty state", async ({ page }) => {
    await page.goto("/projects");

    const hasTable = page.locator("table").first();
    const hasEmptyState = page.getByText(/no projects|create your first project/i);

    await expect(hasTable.or(hasEmptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("can open new project dialog", async ({ page }) => {
    await page.goto("/projects");

    const newProjectButton = page.getByRole("button", { name: /new project|create project/i });
    await expect(newProjectButton).toBeVisible({ timeout: 10_000 });
    await newProjectButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByLabel(/name/i)).toBeVisible();
  });

  test("project form validates required fields", async ({ page }) => {
    await page.goto("/projects");

    const newProjectButton = page.getByRole("button", { name: /new project|create project/i });
    await newProjectButton.click();

    const submitButton = page.getByRole("dialog").getByRole("button", { name: /create|save/i });
    await submitButton.click();

    // Dialog stays open when validation fails
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("project templates page loads", async ({ page }) => {
    await page.goto("/projects/templates");

    await expect(page.getByRole("heading", { name: /template/i })).toBeVisible({ timeout: 10_000 });
  });
});
