ALTER TYPE "public"."protocol_status" ADD VALUE 'processing';--> statement-breakpoint
ALTER TYPE "public"."protocol_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "protocols" ALTER COLUMN "parsed_data" DROP NOT NULL;