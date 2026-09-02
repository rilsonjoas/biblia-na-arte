CREATE TABLE "artwork_themes" (
	"artwork_id" uuid NOT NULL,
	"theme_slug" text NOT NULL,
	CONSTRAINT "artwork_themes_artwork_id_theme_slug_pk" PRIMARY KEY("artwork_id","theme_slug")
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artwork_themes" ADD CONSTRAINT "artwork_themes_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artwork_themes" ADD CONSTRAINT "artwork_themes_theme_slug_themes_slug_fk" FOREIGN KEY ("theme_slug") REFERENCES "public"."themes"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artwork_themes_theme_slug" ON "artwork_themes" USING btree ("theme_slug");