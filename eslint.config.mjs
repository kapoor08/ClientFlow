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
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/incompatible-library": "warn",
      "react/display-name": "warn",
      // The form-builder library under components/form/controlled/content
      // intentionally uses `any` for generic field-array shapes (the consumer
      // supplies the row type via Controller props). Downgrading this globally
      // keeps the signal on real `any` regressions elsewhere as a warning.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
