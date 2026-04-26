import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

/**
 * Smoke a11y suite - runs axe-core against the key reusable primitives so
 * we catch the most common WCAG regressions (missing labels, low contrast on
 * interactive elements, role mismatches) before they ship.
 *
 * These tests are deliberately broad and shallow. Detailed page-level axe
 * runs belong in Playwright with `@axe-core/playwright`.
 */

describe("a11y · UI primitives", () => {
  it("Button (variants + sizes) has no axe violations", async () => {
    const { container } = render(
      <div>
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled aria-label="Disabled action">
          Disabled
        </Button>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("PageHeader renders semantic heading + description", async () => {
    const { container } = render(
      <PageHeader title="Clients" description="3 clients in this workspace" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("RouteErrorBoundary fallback is accessible", async () => {
    const error = Object.assign(new Error("boom"), { digest: "abc" });
    const { container } = render(
      <RouteErrorBoundary error={error} reset={() => {}} segment="the dashboard" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
