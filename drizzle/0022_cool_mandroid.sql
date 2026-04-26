CREATE TABLE "outbound_webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text NOT NULL,
	"attempts" integer NOT NULL,
	"response_status" integer,
	"error" text,
	"delivered_at" timestamp,
	"replay_of_delivery_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"email" text PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"source" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"flag_key" text NOT NULL,
	"organization_id" text NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rate_limit_buckets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "rate_limit_buckets" CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_refunded_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "refund_reason" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "dunning_stage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "last_dunning_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deletion_scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "outbound_webhook_deliveries" ADD CONSTRAINT "outbound_webhook_deliveries_webhook_id_outbound_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."outbound_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_webhook_deliveries" ADD CONSTRAINT "outbound_webhook_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbound_webhook_deliveries_webhook_idx" ON "outbound_webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "outbound_webhook_deliveries_organization_idx" ON "outbound_webhook_deliveries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "outbound_webhook_deliveries_status_idx" ON "outbound_webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_flag_org_unique" ON "feature_flag_overrides" USING btree ("flag_key","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_key_unique" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "invoices_organization_idx" ON "invoices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoices_subscription_idx" ON "invoices" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "invoices_external_invoice_idx" ON "invoices" USING btree ("external_invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_dunning_idx" ON "invoices" USING btree ("status","dunning_stage");--> statement-breakpoint
CREATE INDEX "subscriptions_organization_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_subscription_idx" ON "subscriptions" USING btree ("stripe_subscription_id");