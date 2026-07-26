import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // ── Project-wide rule overrides ──────────────────────────────────────────
    // The eslint-plugin-react-hooks v6 ships a batch of new rules that are
    // overly aggressive on legitimate patterns (hydration-safe localStorage
    // reads, dialog open/close sync, URL→state mirrors, react-pdf elements,
    // factory components in form-builder libraries). We keep them on but
    // demote to warnings so CI doesn't fail on every render-phase nuance.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/incompatible-library": "warn",
      "react/display-name": "warn",
      // rules-of-hooks is the one classic rule that catches genuine bugs (a hook
      // called conditionally / inside a callback breaks hook ordering). It is a
      // hard error - CI must fail on it. (The prior demotion masked a real
      // violation in ControlledFileUpload, now fixed.)
      "react-hooks/rules-of-hooks": "error",
      // `any` is a hard error everywhere by default; the deliberate generic-any
      // in the form-builder library is re-permitted in the scoped block below.
      "@typescript-eslint/no-explicit-any": "error",
      // Allow intentionally-unused args/vars when prefixed with `_` (e.g. a
      // Playwright globalSetup(_config) or a required-but-unused callback arg).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The form-builder library under components/form/controlled/** intentionally
    // uses `any` for generic field-array shapes - the consumer supplies the row
    // type via Controller props, so the library itself can't name it. This is a
    // deliberate, contained exception; `any` remains a hard error everywhere else.
    files: ["components/form/controlled/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
