-- ── Dedup BEFORE the unique indexes (self-healing) ────────────────────────────
-- These run unconditionally: on a clean DB the `rn > 1` predicates match no
-- rows (no-op); on a DB that accumulated duplicates from the pre-fix handlers
-- they remove the strays so the UNIQUE indexes below can build. On production,
-- take a PITR checkpoint / snapshot before applying (these DELETE rows).

-- Subscriptions: survivor = the row organization_current_subscriptions points
-- at, else the newest. Repoint child invoices to the survivor first.
WITH ranked AS (
  SELECT s.id,
         row_number() OVER (
           PARTITION BY s.stripe_subscription_id
           ORDER BY (ocs.subscription_id = s.id) DESC NULLS LAST, s.created_at DESC
         ) AS rn,
         first_value(s.id) OVER (
           PARTITION BY s.stripe_subscription_id
           ORDER BY (ocs.subscription_id = s.id) DESC NULLS LAST, s.created_at DESC
         ) AS survivor_id
  FROM subscriptions s
  LEFT JOIN organization_current_subscriptions ocs ON ocs.subscription_id = s.id
  WHERE s.stripe_subscription_id IS NOT NULL
)
UPDATE invoices i SET subscription_id = r.survivor_id
FROM ranked r WHERE i.subscription_id = r.id AND r.rn > 1;--> statement-breakpoint
WITH ranked AS (
  SELECT s.id,
         row_number() OVER (
           PARTITION BY s.stripe_subscription_id
           ORDER BY (ocs.subscription_id = s.id) DESC NULLS LAST, s.created_at DESC
         ) AS rn
  FROM subscriptions s
  LEFT JOIN organization_current_subscriptions ocs ON ocs.subscription_id = s.id
  WHERE s.stripe_subscription_id IS NOT NULL
)
DELETE FROM subscriptions s USING ranked r WHERE s.id = r.id AND r.rn > 1;--> statement-breakpoint
-- Invoices: leaf table; keep the newest row per external_invoice_id.
DELETE FROM invoices i USING (
  SELECT id, row_number() OVER (
    PARTITION BY external_invoice_id ORDER BY created_at DESC
  ) AS rn
  FROM invoices WHERE external_invoice_id IS NOT NULL
) d WHERE i.id = d.id AND d.rn > 1;--> statement-breakpoint
DROP INDEX "invoices_external_invoice_idx";--> statement-breakpoint
DROP INDEX "subscriptions_stripe_subscription_idx";--> statement-breakpoint
ALTER TABLE "billing_webhook_events" ADD COLUMN "processing_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_stripe_event_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_external_invoice_unique" ON "invoices" USING btree ("external_invoice_id") WHERE "invoices"."external_invoice_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_unique" ON "subscriptions" USING btree ("stripe_subscription_id") WHERE "subscriptions"."stripe_subscription_id" IS NOT NULL;