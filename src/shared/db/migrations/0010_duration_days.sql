ALTER TABLE "protocol_supplements" ADD COLUMN "duration_days" integer;--> statement-breakpoint
ALTER TABLE "protocol_supplements" DROP CONSTRAINT IF EXISTS "protocol_supplements_protocol_id_supplement_id_unique";
