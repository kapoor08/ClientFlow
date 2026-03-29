ALTER TABLE "invoices" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "number" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "is_manual" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "line_items" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sent_at" timestamp;