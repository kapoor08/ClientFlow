ALTER TABLE "tasks" ADD COLUMN "ref_number" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;