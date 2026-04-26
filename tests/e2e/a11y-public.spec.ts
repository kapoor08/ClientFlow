import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Page-level accessibility scans for public routes.
 *
 * Rules excluded for now:
 *   - color-contrast: design-system review pending; can be re-enabled once
 *     the brand palette is finalised.
 *   - region: many marketing pages are intentionally a single landmark.
 *
 * If a violation surfaces, run `npx playwright test a11y-public.spec.ts --headed`
 * locally and use the Axe DevTools panel to inspect.
 */

const PUBLIC_PAGES = [
  { name: "Landing", path: "/" },
  { name: "Pricing", path: "/pricing" },
  { name: "Features", path: "/features" },
  { name: "Contact", path: "/contact" },
  { name: "Sign-in", path: "/auth/sign-in" },
  { name: "Sign-up", path: "/auth/sign-up" },
];

for (const { name, path } of PUBLIC_PAGES) {
  test(`a11y: ${name} (${path})`, async ({ page }) => {
    await page.goto(path);
    // Wait for any client-side mounts (banners, captcha widgets) to settle.
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "region"])
      .analyze();

    if (results.violations.length > 0) {
      // Surface violations in test output for triage.

      console.error(
        `Axe violations on ${path}:\n` +
          results.violations
            .map(
              (v) =>
                `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${
                  v.nodes.length === 1 ? "" : "s"
                })`,
            )
            .join("\n"),
      );
    }

    expect(results.violations).toEqual([]);
  });
}
