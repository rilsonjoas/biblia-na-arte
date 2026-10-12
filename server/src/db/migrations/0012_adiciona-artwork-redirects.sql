CREATE TABLE "artwork_redirects" (
	"old_slug" text PRIMARY KEY NOT NULL,
	"old_id" uuid NOT NULL,
	"new_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artwork_redirects_old_id_unique" UNIQUE("old_id"),
	CONSTRAINT "artwork_redirects_no_self_redirect" CHECK ("artwork_redirects"."old_slug" <> "artwork_redirects"."new_slug")
);
--> statement-breakpoint
CREATE INDEX "idx_artwork_redirects_new_slug" ON "artwork_redirects" USING btree ("new_slug");