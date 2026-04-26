import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { emailCategoryPreferences } from "@/db/schema";

export type EmailCategory = "product" | "billing" | "marketing";

export type CategoryPreferences = {
  productOptIn: boolean;
  billingOptIn: boolean;
  marketingOptIn: boolean;
};

const DEFAULTS: CategoryPreferences = {
  productOptIn: true,
  billingOptIn: true,
  marketingOptIn: true,
};

/**
 * Map the `module` tag attached to every outbound email to a coarse category.
 * Modules not listed here (auth, billing, security) are critical and bypass
 * the category check entirely - see `CRITICAL_MODULES` in send.ts.
 *
 * Anything unknown defaults to "product" so we don't silently start sending
 * uncategorized mail to people who opted out of everything-but-marketing.
 */
const MODULE_TO_CATEGORY: Record<string, EmailCategory> = {
  // Product: workflow noise
  tasks: "product",
  projects: "product",
  files: "product",
  notifications: "product",
  portal: "product",
  organization: "product",
  invitations: "product",
  access: "product",
  ops: "product",
  "public-contact": "product",
  // Billing: non-critical nudges (real billing events live in CRITICAL_MODULES)
  // Marketing: nothing routed here today - reserved for future newsletters.
};

export function categoryForModule(module: string | undefined): EmailCategory {
  if (!module) return "product";
  return MODULE_TO_CATEGORY[module] ?? "product";
}

export async function getCategoryPreferences(email: string): Promise<CategoryPreferences> {
  const [row] = await db
    .select({
      productOptIn: emailCategoryPreferences.productOptIn,
      billingOptIn: emailCategoryPreferences.billingOptIn,
      marketingOptIn: emailCategoryPreferences.marketingOptIn,
    })
    .from(emailCategoryPreferences)
    .where(eq(emailCategoryPreferences.email, email.toLowerCase()))
    .limit(1);
  return row ?? DEFAULTS;
}

export async function isCategoryAllowed(email: string, category: EmailCategory): Promise<boolean> {
  const prefs = await getCategoryPreferences(email);
  if (category === "product") return prefs.productOptIn;
  if (category === "billing") return prefs.billingOptIn;
  return prefs.marketingOptIn;
}

export async function setCategoryPreferences(
  email: string,
  patch: Partial<CategoryPreferences>,
): Promise<CategoryPreferences> {
  const lower = email.toLowerCase();
  const current = await getCategoryPreferences(lower);
  const next: CategoryPreferences = { ...current, ...patch };
  await db
    .insert(emailCategoryPreferences)
    .values({ email: lower, ...next })
    .onConflictDoUpdate({
      target: emailCategoryPreferences.email,
      set: { ...next, updatedAt: new Date() },
    });
  return next;
}
