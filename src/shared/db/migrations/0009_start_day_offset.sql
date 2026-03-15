ALTER TABLE "protocol_supplements" ADD COLUMN "start_day_offset" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol_supplements" DROP COLUMN IF EXISTS "prerequisite_id";--> statement-breakpoint
ALTER TABLE "protocol_supplements" DROP COLUMN IF EXISTS "delay_days";
