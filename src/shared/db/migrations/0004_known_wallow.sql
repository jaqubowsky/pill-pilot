ALTER TABLE "protocol_supplements" ADD COLUMN "prerequisite_id" text;--> statement-breakpoint
ALTER TABLE "protocol_supplements" ADD COLUMN "delay_days" integer;--> statement-breakpoint
ALTER TABLE "supplements" ADD COLUMN "stock_unit" "dosage_unit" DEFAULT 'capsule' NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol_supplements" ADD CONSTRAINT "protocol_supplements_prerequisite_id_protocol_supplements_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."protocol_supplements"("id") ON DELETE set null ON UPDATE no action;