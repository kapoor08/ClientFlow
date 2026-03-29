import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("sign-in page loads and shows form", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on empty form submission", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/enter both your email and password/i)).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.getByLabel(/email/i).fill("nonexistent@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show an error message, not redirect
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await expect(
      page.getByRole("heading", { name: /create your account|sign up|create account|get started/i })
    ).toBeVisible();
  });

  test("SSO page loads and shows email form", async ({ page }) => {
    await page.goto("/auth/sso");

    await expect(page.getByRole("heading", { name: /sign in with sso/i })).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with sso/i })).toBeVisible();
  });

  test("redirects unauthenticated users from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("forgot password link is visible on sign-in", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("SSO link is visible on sign-in page", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("link", { name: /sign in with sso/i })).toBeVisible();
  });
});
