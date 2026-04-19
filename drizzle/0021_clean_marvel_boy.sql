ALTER TABLE "tasks" ADD COLUMN "last_overdue_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "payment_method_expiry_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "first_response_breach_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolution_breach_notified_at" timestamp;