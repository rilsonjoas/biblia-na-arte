CREATE TABLE "daily_artwork" (
	"date" date PRIMARY KEY NOT NULL,
	"artwork_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_artwork" ADD CONSTRAINT "daily_artwork_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_artwork_artwork_id" ON "daily_artwork" USING btree ("artwork_id");