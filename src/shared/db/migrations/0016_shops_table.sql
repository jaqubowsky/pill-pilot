CREATE TABLE "shops" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"delivery_cost" numeric(10, 2),
	"free_delivery_threshold" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "shops" ADD CONSTRAINT "shops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "supplements" ADD COLUMN "shop_id" text;
ALTER TABLE "supplements" ADD CONSTRAINT "supplements_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL;
