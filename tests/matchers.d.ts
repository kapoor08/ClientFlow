// Type augmentation for the jest-axe matcher registered in tests/setup.ts, so
// `expect(...).toHaveNoViolations()` typechecks now that tests are included in tsc.
import "vitest";

interface CustomMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

// These interfaces are intentionally empty - they exist only to merge the custom
// matcher into vitest's Assertion via declaration merging, which requires
// `interface ... extends`. Disable the empty-object-type / explicit-any rules for
// this augmentation block only.
declare module "vitest" {
  /* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
}
