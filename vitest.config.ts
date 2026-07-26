import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    // Coverage floor for the pure, critical logic that now has real tests.
    // Active only under `npm run test:coverage` (requires @vitest/coverage-v8).
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/auth/api-key-hash.ts",
        "lib/webhooks/signature.ts",
        "lib/billing/invoice-totals.ts",
        "server/webhooks/url-guard.ts",
      ],
      thresholds: { lines: 70, functions: 70, statements: 70 },
    },
  },
  resolve: {
    // More specific aliases must come before general ones
    alias: [
      { find: "server-only", replacement: path.resolve(__dirname, "tests/__mocks__/server-only.ts") },
      { find: "@/server/db/client", replacement: path.resolve(__dirname, "tests/__mocks__/db.ts") },
      { find: "@/db/schema", replacement: path.resolve(__dirname, "tests/__mocks__/schema.ts") },
      { find: "@/db/auth-schema", replacement: path.resolve(__dirname, "tests/__mocks__/auth-schema.ts") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
});
