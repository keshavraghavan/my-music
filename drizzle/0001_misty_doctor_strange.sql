ALTER TABLE "plays" ADD COLUMN "provider_play_id" text;--> statement-breakpoint
ALTER TABLE "service_connections" ADD COLUMN "reconnect_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "service_connections" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "plays_user_source_provider_id_unique" ON "plays" USING btree ("user_id","source","provider_play_id");