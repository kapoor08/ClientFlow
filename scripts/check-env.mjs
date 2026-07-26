// P3-10: environment-schema validation, run in "check mode".
//
// Standalone zod parser over process.env - NOT imported by the app runtime, so
// it can never break boot. Wired into CI (`npm run env:check`) to catch a
// missing/malformed required variable before build/deploy. Optional integration
// vars (Slack, Inngest, Turnstile, PostHog, EmailJS, seed/test creds) are
// intentionally not required here - only the vars needed to boot the app are.
import "dotenv/config";
import { z } from "zod";

const isUrl = (v) => {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

const urlStr = z.string().refine(isUrl, "must be a valid URL");

const schema = z.object({
  NEXT_PUBLIC_APP_URL: urlStr,
  BETTER_AUTH_URL: urlStr,
  BETTER_AUTH_SECRET: z.string().min(16, "must be at least 16 characters"),
  EMAIL_FROM: z.string().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "must be an email address"),
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  CRON_SECRET: z.string().min(8, "must be at least 8 characters"),
});

const errors = [];

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    errors.push(`${issue.path.join(".")}: ${issue.message}`);
  }
}

// The app reads NEON_DATABASE_URL || DATABASE_URL; require at least one, as a
// postgres connection string.
const dbUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
  errors.push(
    "NEON_DATABASE_URL or DATABASE_URL: must be set to a postgres:// connection string",
  );
}

if (errors.length > 0) {
  console.error("Environment validation FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("Environment validation passed.");
