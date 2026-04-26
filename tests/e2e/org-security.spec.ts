import { test, expect } from "@playwright/test";

test.describe("Org Security", () => {
  test("org-security page loads", async ({ page }) => {
    await page.goto("/org-security");
    await expect(
      page.getByRole("heading", { name: /security|sessions|access/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page surfaces session-management or MFA section", async ({ page }) => {
    await page.goto("/org-security");
    // The page composes several panels; we just verify at least one core
    // security panel is reachable.
    const sessionsHeading = page.getByText(/active sessions|session management/i).first();
    const mfaHeading = page.getByText(/multi.factor|mfa|two.factor|2fa/i).first();
    const ipHeading = page.getByText(/ip.allowlist|allowed ip|ip restriction/i).first();
    await expect(sessionsHeading.or(mfaHeading).or(ipHeading)).toBeVisible({
      timeout: 10_000,
    });
  });
});
