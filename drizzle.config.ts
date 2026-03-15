import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: ["./db/schema.ts", "./db/auth-schema.ts"],
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
