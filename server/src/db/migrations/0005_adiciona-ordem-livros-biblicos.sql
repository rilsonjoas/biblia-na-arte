ALTER TABLE "bible_books" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_bible_books_order" ON "bible_books" USING btree ("order");