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
