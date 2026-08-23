import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

// Espelha supabase/schema.sql original, sem as partes específicas do
// Supabase Auth (RLS, policies, grants pra anon/authenticated) — essa API
// é o único cliente do banco, o controle de acesso é feito aqui, não em
// Postgres role.

export const artworkCategoryEnum = pgEnum('artwork_category', [
  'painting',
  'music',
  'film',
]);

export const testamentEnum = pgEnum('testament_type', ['old', 'new']);

export const bibleBooks = pgTable(
  'bible_books',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    chapters: integer('chapters').notNull(),
    testament: testamentEnum('testament').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_bible_books_slug').on(table.slug),
    index('idx_bible_books_testament').on(table.testament),
  ],
);

export const artworks = pgTable(
  'artworks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    artistOrDirector: text('artist_or_director').notNull(),
    year: text('year'),
    category: artworkCategoryEnum('category').notNull(),
    mediumOrGenre: text('medium_or_genre'),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    embedUrl: text('embed_url'),
    sourceUrl: text('source_url'),
    dimensionsOrDuration: text('dimensions_or_duration'),

    // Campos novos (não existiam no schema do Supabase) — resultado direto
    // da auditoria de direitos autorais de 2026-08-07. Toda obra que não é
    // domínio público simples precisa registrar sob que licença está
    // publicada e o texto de atribuição a mostrar na página da obra.
    // Ex.: Andrei Mironov → licenseType='cc-by-sa-4.0', attributionText
    // com nome + link pra fonte, conforme exigido pela licença.
    licenseType: text('license_type').default('public-domain').notNull(),
    attributionText: text('attribution_text'),

    // "Onde ver pessoalmente" (roadmap Fase 5) — texto livre, ex.
    // "Cleveland Museum of Art, Cleveland, EUA". Curadoria progressiva,
    // não retroativa: preenchido só quando a fonte primária já foi
    // confirmada (mesmo padrão de `attributionText`).
    location: text('location'),

    // "Vozes dos clássicos" (roadmap Fase 5, 2026-08-23) — onde
    // Rookmaaker/Schaeffer/Lewis já comentaram esta obra específica, com
    // fonte verificada (não paráfrase). Curadoria de profundidade, não de
    // escala — a maioria das obras nunca terá isso preenchido, e não deveria.
    classicCommentaryAuthor: text('classic_commentary_author'),
    classicCommentary: text('classic_commentary'),

    // Soft-delete resultado da auditoria de 2026-08-22: obras sem licença
    // que permita uso ficam com active=false em vez de serem apagadas —
    // se um dia o artista liberar (licença formal/CC), basta voltar pra
    // true. A API só devolve active=true (ver queries.ts e functions.sql).
    // Lista do que está desativado e por quê: docs/AUDITORIA-COPYRIGHT.md
    active: boolean('active').default(true).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_artworks_category').on(table.category),
    index('idx_artworks_artist').on(table.artistOrDirector),
    index('idx_artworks_year').on(table.year),
    index('idx_artworks_created_at').on(table.createdAt),
    // Índice GIN de full-text search em português — combina título,
    // descrição e artista, usado pela função search_artworks() (ver
    // migrations/0001_search.sql, não é expressável no schema do Drizzle).
    index('idx_artworks_search_all').using(
      'gin',
      sql`to_tsvector('portuguese', coalesce(${table.title}, '') || ' ' || coalesce(${table.description}, '') || ' ' || coalesce(${table.artistOrDirector}, ''))`,
    ),
  ],
);

export const bibleReferences = pgTable(
  'bible_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    artworkId: uuid('artwork_id')
      .notNull()
      .references(() => artworks.id, { onDelete: 'cascade' }),
    book: text('book').notNull(),
    bookSlug: text('book_slug').notNull(),
    chapter: integer('chapter').notNull(),
    verses: text('verses'),
    passageText: text('passage_text'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_bible_references_artwork_id').on(table.artworkId),
    index('idx_bible_references_book_slug').on(table.bookSlug),
    index('idx_bible_references_chapter').on(table.chapter),
  ],
);

