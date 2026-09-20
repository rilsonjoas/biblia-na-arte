ALTER TABLE "artworks" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_slug_unique" UNIQUE("slug");