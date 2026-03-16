CREATE TYPE "public"."cart_scan_status" AS ENUM('processing', 'completed', 'failed');

ALTER TABLE "cart_scans" ADD COLUMN "status" "cart_scan_status" DEFAULT 'completed' NOT NULL;
ALTER TABLE "cart_scans" ALTER COLUMN "items" DROP NOT NULL;

UPDATE "cart_scans" SET "status" = 'completed' WHERE "items" IS NOT NULL;
ALTER TABLE "cart_scans" ALTER COLUMN "status" SET DEFAULT 'processing';
