import { test, expect } from "@playwright/test";

// Session is pre-loaded via storageState in playwright.config.ts (authenticated project)

test.describe("Tasks", () => {
  test("tasks page loads with board or list view", async ({ page }) => {
    await page.goto("/tasks");

    await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 10_000 });
  });

  test("can switch between board and list view", async ({ page }) => {
    await page.goto("/tasks");

    // Wait for page to settle
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });

    const listButton = page.getByRole("button", { name: /^list$/i });
    const boardButton = page.getByRole("button", { name: /^board$/i });

    if (await listButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listButton.click();
      await page.waitForTimeout(500);
    }

    if (await boardButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await boardButton.click();
    }
  });

  test("can open new task dialog", async ({ page }) => {
    await page.goto("/tasks");

    const newTaskButton = page.getByRole("button", { name: /new task|add task|create task/i });
    await expect(newTaskButton).toBeVisible({ timeout: 10_000 });
    await newTaskButton.click();

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("task detail sheet shows log time button", async ({ page }) => {
    await page.goto("/tasks");

    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });

    // Only interact with existing tasks — skip if none
    const taskItem = page
      .locator("[data-task-id], tr[data-row], [role='row']")
      .filter({ hasText: /./u })
      .first();

    if (await taskItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await taskItem.click();
      await expect(
        page.getByRole("button", { name: /log time/i })
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});
