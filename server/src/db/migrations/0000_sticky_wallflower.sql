CREATE TYPE "public"."artwork_category" AS ENUM('painting', 'music', 'film');--> statement-breakpoint
CREATE TYPE "public"."testament_type" AS ENUM('old', 'new');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist_or_director" text NOT NULL,
	"year" text,
	"category" "artwork_category" NOT NULL,
	"medium_or_genre" text,
	"description" text NOT NULL,
	"image_url" text,
	"embed_url" text,
	"source_url" text,
	"dimensions_or_duration" text,
	"license_type" text DEFAULT 'public-domain' NOT NULL,
	"attribution_text" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bible_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"chapters" integer NOT NULL,
	"testament" "testament_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bible_books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bible_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artwork_id" uuid NOT NULL,
	"book" text NOT NULL,
	"book_slug" text NOT NULL,
	"chapter" integer NOT NULL,
	"verses" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bible_references" ADD CONSTRAINT "bible_references_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artworks_category" ON "artworks" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artworks_artist" ON "artworks" USING btree ("artist_or_director");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artworks_year" ON "artworks" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artworks_created_at" ON "artworks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artworks_search_all" ON "artworks" USING gin (to_tsvector('portuguese', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("artist_or_director", '')));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bible_books_slug" ON "bible_books" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bible_books_testament" ON "bible_books" USING btree ("testament");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bible_references_artwork_id" ON "bible_references" USING btree ("artwork_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bible_references_book_slug" ON "bible_references" USING btree ("book_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bible_references_chapter" ON "bible_references" USING btree ("chapter");