// Vercel build wrapper: runs drizzle migrations against the production
// database before `next build`, but only for production deploys. Preview /
// development deploys skip the migrate step so they don't mutate the prod
// schema (Vercel preview builds otherwise share the production DATABASE_URL
// unless explicitly overridden).
//
// Vercel auto-detects the `vercel-build` script in package.json and runs it
// in place of the default build command - no Vercel dashboard config change
// needed.

import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV ?? "local";
const isProd = env === "production";

if (isProd) {
  console.log("[vercel-build] VERCEL_ENV=production -> running drizzle-kit migrate");
  execSync("npx drizzle-kit migrate", { stdio: "inherit" });
} else {
  console.log(`[vercel-build] VERCEL_ENV=${env} -> skipping migrations`);
}

console.log("[vercel-build] running next build");
execSync("next build", { stdio: "inherit" });
