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
  primaryKey,
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

// Submissão de artistas + painel administrativo (roadmap, planejado
// 2026-09-05): distingue obra que veio do vault (curadoria pessoal do
// Rilson, via Obsidian) de obra aprovada pelo painel (submetida por
// artista externo). Existe porque o reseed do vault (`import-seed-data.ts`)
// apaga toda obra que não está no export atual — sem essa distinção,
// uma obra de submissão seria apagada no primeiro reseed seguinte, já
// que ela nunca existiu como nota no vault. A etapa de remoção do
// reseed filtra por `origem = 'vault'`; `submissao` nunca é tocada por
// ele.
export const artworkOrigemEnum = pgEnum('artwork_origem', ['vault', 'submissao']);

export const submissionStatusEnum = pgEnum('submission_status', [
  'pendente',
  'aprovado',
  'rejeitado',
]);

// Dois papéis desde o início, mesmo com um usuário só por enquanto:
// `revisor` prepara/edita/sinaliza uma submissão como pronta; só
// `admin` de fato aprova (o que a torna uma obra pública). Resolve de
// saída a pergunta "quem tem a palavra final na curadoria" — fica
// garantido pela arquitetura, não só combinado verbalmente com um
// eventual parceiro (ver ROADMAP, seção "Submissão de artistas...").
export const userRoleEnum = pgEnum('user_role', ['admin', 'revisor']);

export const bibleBooks = pgTable(
  'bible_books',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    chapters: integer('chapters').notNull(),
    testament: testamentEnum('testament').notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_bible_books_slug').on(table.slug),
    index('idx_bible_books_testament').on(table.testament),
    index('idx_bible_books_order').on(table.order),
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

    // Submissão de artistas (roadmap, 2026-09-05) — ver comentário do
    // enum `artworkOrigemEnum` acima. Toda obra existente até aqui é
    // 'vault' (valor padrão), preenchido automaticamente pela migração.
    origem: artworkOrigemEnum('origem').default('vault').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_artworks_category').on(table.category),
    index('idx_artworks_origem').on(table.origem),
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

// "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) — biografia do
// PINTOR, não da obra. Decisão deliberada: casa por `name` (string exata,
// mesmo padrão já usado em EXCLUDED_ARTISTS/LICENSED_ARTISTS no export),
// não por FK em `artworks.artist_or_director` — evita uma migração de
// dado maior mexendo em toda `artworks` só pra isso, e o app já convive
// bem com casamento por nome (mesmo princípio da auditoria de direitos
// autorais). Fonte da verdade continua o vault (`Autores/*.md`), reimportado
// via o mesmo `db:seed` das obras — nunca editado direto no painel/banco.
export const artists = pgTable(
  'artists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    bio: text('bio'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_artists_slug').on(table.slug)],
);

// "Filtros Avançados" (roadmap, Passo 2, 2026-09-02) — vocabulário aberto
// vindo das tags `arte-e-literatura/pintura/tema/<slug>` do vault. Catálogo
// próprio (não `text[]` em `artworks`) pelo mesmo motivo de `artists`: dá
// lugar pro `name` bonito (a tag do Obsidian já vem sem acento — "ressurreicao"
// não diz sozinho se é "ressurreição", precisa de um nome curado em algum
// lugar) e deixa a contagem por tema sempre calculada ao vivo via JOIN, nunca
// armazenada (mesmo princípio de `artists`/`bible_books`: nunca guardar
// contagem que pode ficar desatualizada). `slug` como chave primária — é
// natural e estável pro vocabulário (curadoria manual, não gerado por
// usuário), sem necessidade de um `id` uuid a mais.
export const themes = pgTable('themes', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
});

// Junção pura obra↔tema (N:N) — sem colunas extras (diferente de
// `bible_references`, que precisa de capítulo/versículo por referência).
// PK composta evita duplicar o mesmo par obra+tema no reimport.
export const artworkThemes = pgTable(
  'artwork_themes',
  {
    artworkId: uuid('artwork_id')
      .notNull()
      .references(() => artworks.id, { onDelete: 'cascade' }),
    themeSlug: text('theme_slug')
      .notNull()
      .references(() => themes.slug, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.artworkId, table.themeSlug] }),
    index('idx_artwork_themes_theme_slug').on(table.themeSlug),
  ],
);

// Login do painel administrativo (roadmap, 2026-09-05). Começa só com o
// Rilson (`admin`); convite futuro pra revisor externo (ex.: equipe de
// um eventual parceiro) é uma linha nova aqui, sem reengenharia nenhuma.
// Hash de senha via `crypto.scrypt` nativo do Node — sem dependência
// nova só pra isso.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('revisor').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Fila de obras submetidas por artistas externos, separada de
// `artworks` de propósito — nada aqui é servido publicamente até
// aprovado, então não corre risco de uma submissão não revisada vazar
// pra API por um filtro esquecido em algum lugar (ver ROADMAP,
// "Submissão de artistas..."). Campos da obra espelham `artworks`/
// `bibleReferences`, mas quase todos opcionais: existem pra serem
// preenchidos com a mesma qualidade do resto do acervo, mas não travam
// a submissão se vierem incompletos — a régua de qualidade de verdade
// acontece na revisão, não na entrada (mesma lógica de uma nota nova
// do vault, que pode nascer rasa e ser enriquecida depois).
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    status: submissionStatusEnum('status').default('pendente').notNull(),

    // Quem submeteu — sempre obrigatório, é o mínimo pra poder
    // responder/negociar direitos com a pessoa.
    submitterName: text('submitter_name').notNull(),
    submitterEmail: text('submitter_email').notNull(),
    submitterContact: text('submitter_contact'), // WhatsApp/Instagram, opcional

    // Confirmação de direito de imagem — obrigatória de verdade (não é
    // "opcional, mas deveria"): proteção legal antes de publicar algo
    // de terceiro. `rightsConfirmedAt` registra quando foi marcada, não
    // só que foi marcada.
    rightsConfirmed: boolean('rights_confirmed').notNull().default(false),
    rightsConfirmedAt: timestamp('rights_confirmed_at', { withTimezone: true }),

    // Dados da obra em si — mesmos nomes de campo de `artworks` onde
    // existe equivalente direto, pra facilitar o mapeamento na hora de
    // aprovar. Só `title` e `imagePath` são obrigatórios: o mínimo pra
    // a submissão ser revisável (precisa de algo pra olhar e um nome
    // pra identificar na fila).
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    artistName: text('artist_name'),
    year: text('year'),
    category: artworkCategoryEnum('category').default('painting').notNull(),
    description: text('description'),
    location: text('location'),
    sourceUrl: text('source_url'),

    // Caminho da imagem numa pasta privada (não servida publicamente)
    // até a aprovação — nesse momento é copiada/convertida (mesmo
    // pipeline WebP do `sharp` que o export do vault já usa) pra
    // `web/public/images/`.
    imagePath: text('image_path').notNull(),

    // Referência bíblica sugerida pelo próprio artista — um só
    // registro aqui de propósito (a maioria não vai saber apontar
    // várias referências com precisão); o revisor pode adicionar mais
    // referências reais em `bible_references` direto na hora de
    // aprovar, se for o caso.
    suggestedBook: text('suggested_book'),
    suggestedChapter: integer('suggested_chapter'),
    suggestedVerses: text('suggested_verses'),
    suggestedPassageText: text('suggested_passage_text'),

    // Preenchidos durante a revisão, não na submissão.
    reviewerNotes: text('reviewer_notes'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    // Preenchido só depois de aprovada — link pra obra real que a
    // submissão virou, pra rastreabilidade (de onde essa obra veio).
    approvedArtworkId: uuid('approved_artwork_id').references(() => artworks.id),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_submissions_status').on(table.status),
    index('idx_submissions_created_at').on(table.createdAt),
  ],
);

