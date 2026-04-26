import "@testing-library/jest-dom";
import { expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

// Wire vitest-axe's `toHaveNoViolations` matcher onto vitest's expect.
// Tests in tests/unit/a11y/*.test.tsx use this to assert WCAG compliance.
expect.extend(axeMatchers);

// vi is available globally via vitest's globals:true setting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const vi: any;

// server-only is aliased in vitest.config.ts - no runtime mock needed here
void vi;
