ALTER TABLE "protocol_supplements" ADD COLUMN "is_critical" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "protocol_supplements" ps SET "is_critical" = s."is_critical" FROM "supplements" s WHERE ps."supplement_id" = s."id";--> statement-breakpoint
ALTER TABLE "supplements" DROP COLUMN "is_critical";
