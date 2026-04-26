import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Page-level accessibility scans for authenticated app routes. Uses the
 * shared `.auth-state.json` from global setup.
 *
 * Same exclusions as the public scan - see a11y-public.spec.ts for rationale.
 */

const PROTECTED_PAGES = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Clients", path: "/clients" },
  { name: "Projects", path: "/projects" },
  { name: "Tasks", path: "/tasks" },
  { name: "Invoices", path: "/invoices" },
  { name: "Billing", path: "/billing" },
  { name: "Settings", path: "/settings" },
  { name: "Org Security", path: "/org-security" },
];

for (const { name, path } of PROTECTED_PAGES) {
  test(`a11y: ${name} (${path})`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "region"])
      .analyze();

    if (results.violations.length > 0) {
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
