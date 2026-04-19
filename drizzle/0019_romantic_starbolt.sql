ALTER TABLE "plans" ADD COLUMN "features" jsonb;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "stripe_monthly_price_id" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "stripe_yearly_price_id" text;