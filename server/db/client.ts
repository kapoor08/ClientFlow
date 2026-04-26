import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set NEON_DATABASE_URL or DATABASE_URL in your environment before using the database client",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, {
  // Only log SQL in dev. In production this would leak session tokens,
  // user IDs, and other PII through both Vercel server logs and Sentry.
  logger: process.env.DRIZZLE_LOG_QUERIES === "1",
});
