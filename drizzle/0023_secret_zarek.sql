CREATE TABLE "email_category_preferences" (
	"email" text PRIMARY KEY NOT NULL,
	"product_opt_in" boolean DEFAULT true NOT NULL,
	"billing_opt_in" boolean DEFAULT true NOT NULL,
	"marketing_opt_in" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "gstin" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "gst_state_code" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "gst_legal_name" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "subtotal_cents" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "gstin_at_invoice" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "hsn_sac_code" text;