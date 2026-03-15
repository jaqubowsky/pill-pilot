ALTER TABLE "protocol_supplements" ADD COLUMN "dosage_interval_minutes" integer;
ALTER TABLE "protocol_supplements" ADD COLUMN "wait_after_taking_minutes" integer;
ALTER TABLE "daily_logs" ADD COLUMN "timer_notified_at" timestamp;
ALTER TABLE "daily_logs" ADD COLUMN "timer_adjustment_minutes" integer;
