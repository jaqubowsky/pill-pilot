CREATE TABLE IF NOT EXISTS "protocol_supplements" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"supplement_id" text NOT NULL,
	"notes" text,
	"cycle_start_date" date,
	"cycle_days_on" integer,
	"cycle_days_off" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "protocol_supplements_protocol_id_supplement_id_unique" UNIQUE("protocol_id","supplement_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "protocol_supplements" ADD CONSTRAINT "protocol_supplements_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "protocol_supplements" ADD CONSTRAINT "protocol_supplements_supplement_id_supplements_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  INSERT INTO "protocol_supplements" ("id", "protocol_id", "supplement_id", "notes", "cycle_start_date", "cycle_days_on", "cycle_days_off", "sort_order", "active")
  SELECT
    gen_random_uuid()::text,
    ss."protocol_id",
    ss."supplement_id",
    (SELECT ss2."notes" FROM "supplement_schedules" ss2 WHERE ss2."protocol_id" = ss."protocol_id" AND ss2."supplement_id" = ss."supplement_id" LIMIT 1),
    s."cycle_start_date",
    s."cycle_days_on",
    s."cycle_days_off",
    MIN(ss."sort_order"),
    bool_and(ss."active")
  FROM "supplement_schedules" ss
  JOIN "supplements" s ON s."id" = ss."supplement_id"
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplement_schedules' AND column_name = 'protocol_id')
  GROUP BY ss."protocol_id", ss."supplement_id", s."cycle_start_date", s."cycle_days_on", s."cycle_days_off";
EXCEPTION WHEN undefined_column THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "supplement_schedules" ADD COLUMN IF NOT EXISTS "protocol_supplement_id" text;
--> statement-breakpoint
DO $$ BEGIN
  UPDATE "supplement_schedules" ss
  SET "protocol_supplement_id" = ps."id"
  FROM "protocol_supplements" ps
  WHERE ss."protocol_supplement_id" IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplement_schedules' AND column_name = 'protocol_id')
    AND ps."protocol_id" = ss."protocol_id"
    AND ps."supplement_id" = ss."supplement_id";
EXCEPTION WHEN undefined_column THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "supplement_schedules" ALTER COLUMN "protocol_supplement_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "supplement_schedules" ADD CONSTRAINT "supplement_schedules_protocol_supplement_id_protocol_supplements_id_fk" FOREIGN KEY ("protocol_supplement_id") REFERENCES "public"."protocol_supplements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "supplement_schedules" DROP CONSTRAINT IF EXISTS "supplement_schedules_protocol_id_protocols_id_fk";
EXCEPTION WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "supplement_schedules" DROP CONSTRAINT IF EXISTS "supplement_schedules_supplement_id_supplements_id_fk";
EXCEPTION WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "supplement_schedules" DROP COLUMN IF EXISTS "protocol_id";
--> statement-breakpoint
ALTER TABLE "supplement_schedules" DROP COLUMN IF EXISTS "supplement_id";
--> statement-breakpoint
ALTER TABLE "supplement_schedules" DROP COLUMN IF EXISTS "notes";
--> statement-breakpoint
ALTER TABLE "supplement_schedules" DROP COLUMN IF EXISTS "sort_order";
--> statement-breakpoint
ALTER TABLE "supplement_schedules" DROP COLUMN IF EXISTS "active";
--> statement-breakpoint
ALTER TABLE "supplements" DROP COLUMN IF EXISTS "cycle_start_date";
--> statement-breakpoint
ALTER TABLE "supplements" DROP COLUMN IF EXISTS "cycle_days_on";
--> statement-breakpoint
ALTER TABLE "supplements" DROP COLUMN IF EXISTS "cycle_days_off";
