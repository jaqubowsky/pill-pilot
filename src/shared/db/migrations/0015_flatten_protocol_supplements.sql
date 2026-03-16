-- Flatten protocolSupplements into supplementSchedules

-- Step 1: Add new columns to supplement_schedules (nullable initially)
ALTER TABLE "supplement_schedules" ADD COLUMN "protocol_id" text;
ALTER TABLE "supplement_schedules" ADD COLUMN "supplement_id" text;
ALTER TABLE "supplement_schedules" ADD COLUMN "notes" text;
ALTER TABLE "supplement_schedules" ADD COLUMN "is_critical" boolean NOT NULL DEFAULT false;
ALTER TABLE "supplement_schedules" ADD COLUMN "cycle_days_on" integer;
ALTER TABLE "supplement_schedules" ADD COLUMN "cycle_days_off" integer;
ALTER TABLE "supplement_schedules" ADD COLUMN "start_day_offset" integer NOT NULL DEFAULT 0;
ALTER TABLE "supplement_schedules" ADD COLUMN "duration_days" integer;
ALTER TABLE "supplement_schedules" ADD COLUMN "dosage_interval_minutes" integer;
ALTER TABLE "supplement_schedules" ADD COLUMN "wait_after_taking_minutes" integer;
ALTER TABLE "supplement_schedules" ADD COLUMN "sort_order" integer NOT NULL DEFAULT 0;
ALTER TABLE "supplement_schedules" ADD COLUMN "active" boolean NOT NULL DEFAULT true;
ALTER TABLE "supplement_schedules" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;

-- Step 2: Copy data from protocol_supplements
UPDATE "supplement_schedules" ss
SET
  "protocol_id" = ps."protocol_id",
  "supplement_id" = ps."supplement_id",
  "notes" = ps."notes",
  "is_critical" = ps."is_critical",
  "cycle_days_on" = ps."cycle_days_on",
  "cycle_days_off" = ps."cycle_days_off",
  "start_day_offset" = ps."start_day_offset",
  "duration_days" = ps."duration_days",
  "dosage_interval_minutes" = ps."dosage_interval_minutes",
  "wait_after_taking_minutes" = ps."wait_after_taking_minutes",
  "sort_order" = ps."sort_order",
  "active" = ps."active",
  "created_at" = ps."created_at"
FROM "protocol_supplements" ps
WHERE ss."protocol_supplement_id" = ps."id";

-- Step 3: Set NOT NULL on protocol_id and supplement_id
ALTER TABLE "supplement_schedules" ALTER COLUMN "protocol_id" SET NOT NULL;
ALTER TABLE "supplement_schedules" ALTER COLUMN "supplement_id" SET NOT NULL;

-- Step 4: Add FK constraints
ALTER TABLE "supplement_schedules" ADD CONSTRAINT "supplement_schedules_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE CASCADE;
ALTER TABLE "supplement_schedules" ADD CONSTRAINT "supplement_schedules_supplement_id_supplements_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "supplements"("id") ON DELETE CASCADE;

-- Step 5: Add composite index for sibling queries
CREATE INDEX "supplement_schedules_protocol_supplement_idx" ON "supplement_schedules" ("protocol_id", "supplement_id");

-- Step 6: Drop old FK column
ALTER TABLE "supplement_schedules" DROP COLUMN "protocol_supplement_id";

-- Step 7: Drop old table
DROP TABLE "protocol_supplements";
