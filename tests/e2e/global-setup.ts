import { chromium, FullConfig, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? "playwright@test.clientflow.dev";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Playwright123!";
const TEST_FIRST = "Playwright";
const TEST_LAST = "Test";

/**
 * Submit a form and wait for the resulting auth POST + any client redirect to
 * settle, instead of a fixed sleep. `waitForResponse`/`waitForLoadState` are
 * deterministic (they resolve as soon as the work is done and only time out if
 * it genuinely never happens), which removes the flaky fixed-timeout waits
 * (P2-20). Both are `.catch`-guarded because the failure path (bad credentials
 * → no redirect) is expected during the "does the user exist yet?" probe.
 */
async function submitAndSettle(page: Page, click: () => Promise<void>) {
  await Promise.all([
    page
      .waitForResponse((r) => r.url().includes("/api/auth/") && r.request().method() === "POST", {
        timeout: 15_000,
      })
      .catch(() => null),
    click(),
  ]);
  await page.waitForLoadState("networkidle").catch(() => {});
}

/**
 * Global setup: registers a test user (if needed) then signs in using a real
 * browser so BetterAuth creates the session cookie via its own flow.
 * Saves the authenticated cookie state to disk for all authenticated tests.
 */
export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  async function signIn() {
    await page.goto("/auth/sign-in");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await submitAndSettle(page, () => page.getByRole("button", { name: /sign in/i }).click());
  }

  // ── Step 1: ensure the test user exists ──────────────────────────────────
  // Try signing in first - if the user already exists this is all we need.
  await signIn();

  const signedIn = !page.url().includes("/auth/");

  if (!signedIn) {
    // Sign-in failed - user doesn't exist yet. Register first.
    await page.goto("/auth/sign-up");
    await page.getByLabel(/first name/i).fill(TEST_FIRST);
    await page.getByLabel(/last name/i).fill(TEST_LAST);
    // "Work email" label on the sign-up form
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    await submitAndSettle(page, () =>
      page.getByRole("button", { name: /create account/i }).click(),
    );

    // After sign-up, BetterAuth redirects to verify-email (not a session cookie).
    // Since BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION is not "true" in dev, we can
    // sign in immediately without verifying.
    await signIn();
  }

  // ── Step 2: handle post-sign-in redirects ────────────────────────────────
  // After sign-in, the app may redirect to /onboarding or /dashboard.
  if (page.url().includes("/onboarding")) {
    // Click through onboarding steps until we reach the dashboard
    for (let i = 0; i < 8; i++) {
      const btn = page.getByRole("button", {
        name: /continue|next|finish|complete|get started|go to dashboard/i,
      });
      if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await Promise.all([page.waitForLoadState("networkidle").catch(() => {}), btn.click()]);
      } else {
        break;
      }
      if (!page.url().includes("/onboarding")) break;
    }
  }

  // Verify we are no longer on an auth page
  const finalUrl = page.url();
  if (finalUrl.includes("/auth/")) {
    await browser.close();
    throw new Error(
      `[globalSetup] Authentication failed. Still on auth page: ${finalUrl}\n` +
        `Ensure the dev server is running and TEST_USER_EMAIL/TEST_USER_PASSWORD are correct.\n` +
        `TEST_EMAIL: ${TEST_EMAIL}`,
    );
  }

  // ── Step 3: save session state ───────────────────────────────────────────
  await context.storageState({ path: "tests/e2e/.auth-state.json" });
  console.log(
    `[globalSetup] Authenticated as ${TEST_EMAIL} - session saved to tests/e2e/.auth-state.json`,
  );

  await browser.close();
}
