CREATE TABLE "status_check_daily_rollups" (
	"id" text PRIMARY KEY NOT NULL,
	"component_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_checks" integer NOT NULL,
	"successful_checks" integer NOT NULL,
	"uptime_bp" integer NOT NULL,
	"avg_latency_ms" integer,
	"worst_state_on_day" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_check_results" (
	"id" text PRIMARY KEY NOT NULL,
	"component_id" text NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"success" boolean NOT NULL,
	"latency_ms" integer,
	"http_status" integer,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "status_components" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"probe_config" jsonb NOT NULL,
	"current_state" text DEFAULT 'unknown' NOT NULL,
	"state_updated_at" timestamp,
	"auto_open_incident_after_min" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_incident_components" (
	"incident_id" text NOT NULL,
	"component_id" text NOT NULL,
	CONSTRAINT "status_incident_components_incident_id_component_id_pk" PRIMARY KEY("incident_id","component_id")
);
--> statement-breakpoint
CREATE TABLE "status_incident_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"body" text NOT NULL,
	"state_at_post" text NOT NULL,
	"posted_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"current_state" text NOT NULL,
	"impact" text NOT NULL,
	"is_scheduled" boolean DEFAULT false NOT NULL,
	"scheduled_for" timestamp,
	"scheduled_until" timestamp,
	"posted_by_user_id" text,
	"is_auto_opened" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_service_signals" (
	"signal_key" text PRIMARY KEY NOT NULL,
	"last_observed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "status_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"verification_token" text,
	"verification_expires_at" timestamp,
	"verified_at" timestamp,
	"last_emailed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_check_daily_rollups" ADD CONSTRAINT "status_check_daily_rollups_component_id_status_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."status_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_check_results" ADD CONSTRAINT "status_check_results_component_id_status_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."status_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_incident_components" ADD CONSTRAINT "status_incident_components_incident_id_status_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."status_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_incident_components" ADD CONSTRAINT "status_incident_components_component_id_status_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."status_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_incident_updates" ADD CONSTRAINT "status_incident_updates_incident_id_status_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."status_incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_incident_updates" ADD CONSTRAINT "status_incident_updates_posted_by_user_id_user_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_incidents" ADD CONSTRAINT "status_incidents_posted_by_user_id_user_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "status_check_daily_rollups_component_date_unique" ON "status_check_daily_rollups" USING btree ("component_id","date");--> statement-breakpoint
CREATE INDEX "status_check_results_component_checked_idx" ON "status_check_results" USING btree ("component_id","checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "status_components_slug_unique" ON "status_components" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "status_incident_updates_incident_idx" ON "status_incident_updates" USING btree ("incident_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "status_incidents_slug_unique" ON "status_incidents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "status_incidents_state_idx" ON "status_incidents" USING btree ("current_state");--> statement-breakpoint
CREATE INDEX "status_incidents_started_idx" ON "status_incidents" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "status_subscribers_email_unique" ON "status_subscribers" USING btree ("email");