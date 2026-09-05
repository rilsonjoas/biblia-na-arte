CREATE TYPE "public"."artwork_origem" AS ENUM('vault', 'submissao');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pendente', 'aprovado', 'rejeitado');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'revisor');--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "submission_status" DEFAULT 'pendente' NOT NULL,
	"submitter_name" text NOT NULL,
	"submitter_email" text NOT NULL,
	"submitter_contact" text,
	"rights_confirmed" boolean DEFAULT false NOT NULL,
	"rights_confirmed_at" timestamp with time zone,
	"title" text NOT NULL,
	"subtitle" text,
	"artist_name" text,
	"year" text,
	"category" "artwork_category" DEFAULT 'painting' NOT NULL,
	"description" text,
	"location" text,
	"source_url" text,
	"image_path" text NOT NULL,
	"suggested_book" text,
	"suggested_chapter" integer,
	"suggested_verses" text,
	"suggested_passage_text" text,
	"reviewer_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"approved_artwork_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'revisor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "origem" "artwork_origem" DEFAULT 'vault' NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_approved_artwork_id_artworks_id_fk" FOREIGN KEY ("approved_artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_submissions_created_at" ON "submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_artworks_origem" ON "artworks" USING btree ("origem");