CREATE TABLE "cart_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"shop_name" text,
	"items" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "cart_scans" ADD CONSTRAINT "cart_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
