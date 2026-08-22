# Bíblia na Arte 🎨✨

Uma plataforma digital que explora a profunda conexão entre as Sagradas Escrituras e as manifestações artísticas ao longo da história. Descobra como pinturas, músicas e outras formas de arte deram vida às narrativas bíblicas.

## Sobre o Projeto

BiblianaArte.com é um projeto cultural e educativo que celebra a intersecção entre fé, arte e história. Nossa missão é tornar acessível o vasto patrimônio artístico inspirado pela Bíblia, oferecendo uma experiência rica e envolvente para estudantes, pesquisadores, artistas e entusiastas da cultura.

### ✨ Características

- 🎨 **Galeria Curada**: Obras de arte cuidadosamente selecionadas com suas referências bíblicas
- 📖 **Navegação Bíblica**: Explore arte através dos livros e capítulos da Bíblia
- 🔍 **Pesquisa Inteligente**: Encontre obras por artista, período, passagem bíblica ou tema
- 🎵 **Múltiplas Mídias**: Pinturas, esculturas, música sacra e outras manifestações artísticas
- 📱 **Design Responsivo**: Experiência otimizada para todos os dispositivos

## Por que isto existe

A arte que a Bíblia inspirou ao longo de dois mil anos está espalhada — museus, acervos, coleções privadas — sem nenhum fio que conecte uma pintura de volta ao versículo que a gerou. Quem quer estudar Gênesis 1 e ver como Michelangelo, Doré e outros visualizaram a criação não tem onde buscar isso de forma curada; o Google Imagens não distingue "João 3:16" de "João Batista".

Eu construo isto porque contemplar a beleza que Deus espalhou na criação — inclusive a beleza que passa pela mão humana — não é secundário à fé, é parte dela. Arte sacra não é decoração, é teologia visual. Um catálogo bem curado, com referência bíblica precisa e proveniência de direitos autorais séria, é mordomia: tornar esse patrimônio acessível sem custo pra quem quer estudar, pregar ou só contemplar.

Hoje isso é uma fundação técnica sólida (self-host, sem Supabase, catálogo real, ~850 obras) buscando a audiência certa via SEO de nicho — não virá de campanha, vem de quem já está procurando "arte bíblica Gênesis" e encontra algo curado em vez de resultado genérico. A visão de mais longo prazo é virar referência: coleções temáticas (Vida de Cristo, Parábolas), modo devocional, o tipo de profundidade que só cresce com curadoria contínua — não um catálogo estático, uma biblioteca visual que vale a pena voltar.

## Como Executar Localmente

> [!NOTE]
> Desde 2026-08-07 este é um **monorepo pnpm workspace** (`web/` +
> `server/`) — o projeto saiu do Supabase (banco de dados e storage morto
> por inatividade em set/2025) e roda hoje em self-host num VPS Hetzner.
> **Não usar Supabase de novo** — decisão explícita do mantenedor. O
> caminho até produção confiável e o backlog completo vivem no
> [`docs/ROADMAP.md`](docs/ROADMAP.md).

### Pré-requisitos
- Node.js 20+
- **pnpm** (não npm/yarn/bun — o lockfile do workspace é do pnpm)
- **git-lfs** instalado antes de clonar (as imagens do catálogo em
  `web/public/images/`, ~111MB em WebP, são versionadas via Git LFS —
  sem o `git-lfs`, você recebe só ponteiros de texto, não as imagens
  de verdade)

### Passos para Instalação

```bash
# 1. Clone este repositório (com git-lfs já instalado)
git clone https://github.com/rilsonjoas/biblia-na-arte.git
cd biblia-na-arte

# 2. Instale as dependências (todo o workspace: web + server)
pnpm install

# 3. Frontend
pnpm dev:web       # http://localhost:8080

# 4. Backend (precisa de um Postgres rodando e configurado em server/.env)
pnpm dev:server    # http://localhost:3000
```

### Scripts Disponíveis (raiz do workspace)

```bash
pnpm dev:web        # Frontend em desenvolvimento
pnpm dev:server     # API em desenvolvimento
pnpm build:web      # Build de produção do frontend
pnpm build:server   # Build de produção da API
pnpm lint           # Lint em todos os pacotes do workspace
```

## Deploy (VPS Hetzner)

O site roda em `biblianaarte.narniano.com` (web) e
`api-biblianaarte.narniano.com` (API) num VPS Hetzner, atrás do Traefik.

**Fluxo automático (recomendado):** o workflow `.github/workflows/deploy.yml`
faz o deploy a cada push em `main` — conecta por SSH no VPS, faz
`git pull --ff-only` em `/opt/biblia-na-arte` (que é um clone real do
GitHub) e roda `make deploy service=biblia-na-arte` no
`~/hetzner-infra` (rebuilda as imagens e sobe os containers). Depois faz
um smoke test nas URLs públicas.

**Fluxo manual (se precisar):**

```bash
ssh narniano@167.233.254.53
cd /opt/biblia-na-arte && git pull --ff-only origin main
cd ~/hetzner-infra && make deploy service=biblia-na-arte
```

O VPS acessa o GitHub via deploy key read-only do repo (nunca use uma
chave com acesso de escrita pra isso). O GitHub Actions acessa o VPS via
uma chave SSH própria, instalada em `~/.ssh/authorized_keys`, com os
segredos `DEPLOY_SSH_KEY`, `VPS_HOST` e `VPS_USER` configurados no repo.

## Tecnologias Utilizadas

**Frontend (`web/`):**
- ⚡ **Vite** + SWC · ⚛️ **React 18** · 📘 **TypeScript**
- 🎨 **Tailwind CSS** + **shadcn/ui** · 🎯 **React Router** · 🔍 **TanStack Query**

**Backend (`server/`):**
- 🚀 **Fastify** — API REST, leve, adequada pro VPS pequeno onde roda
- 🗄️ **Drizzle ORM** + Postgres — sem engine binária separada
- ✅ **Zod** — validação de entrada
- 🔒 helmet + rate limit + CORS restrito

A API é **só-leitura** (v1). Notas operacionais que não são óbvias:

- Schema das tabelas em `server/src/db/schema.ts` — os campos
  `license_type` e `attribution_text` de `artworks` existem por causa da
  auditoria de direitos autorais de 2026-08-07
- SQL puro não-expressável no DSL do Drizzle vive em
  `server/src/db/custom-sql/functions.sql` (trigger de `updated_at` e a
  função `search_artworks()`, full-text search em português via
  `ts_rank`), aplicado junto das migrations
- Migrations: gerar com `pnpm --filter server db:generate`, aplicar com
  `pnpm --filter server db:migrate`
- A imagem Docker da API se constrói a partir da **raiz** do monorepo:
  `docker build -f server/Dockerfile -t biblianaarte-api .`

Pipeline de dados (curadoria manual a partir do vault Obsidian, roda no
desktop do mantenedor — não faz parte do deploy; comandos documentados no
[`docs/ROADMAP.md`](docs/ROADMAP.md), seção "Como executar"): o export
converte as imagens pra WebP no momento da cópia (`web/public/images/`
é saída 100% derivada do vault) e o seed importa o JSON no Postgres.

## Arquitetura de Dados

Três tabelas, relacionamentos diretos:

- **Artwork** — título, artista/diretor, ano, categoria, descrição,
  imagem, `license_type` + `attribution_text`
- **BibleReference** — liga uma obra a livro/capítulo/versículo(s)
- **BibleBook** — metadados de livro bíblico (slug, capítulos, testamento)

## Estrutura do Projeto

```
biblia-na-arte/
├── pnpm-workspace.yaml
├── web/                  # Frontend
│   ├── public/
│   │   └── images/       # Imagens do catálogo em WebP (Git LFS)
│   └── src/
│       ├── components/   # Componentes reutilizáveis
│       ├── pages/        # Páginas da aplicação
│       ├── lib/          # Utilitários, camada de API, helpers
│       └── types/        # Definições TypeScript
└── server/               # API REST
    └── src/
        ├── db/           # Schema Drizzle, client, migrations, SQL custom
        ├── routes/       # Handlers HTTP
        ├── schemas/      # Validação Zod
        └── plugins/      # Segurança, error handling
```

## Contribuindo

Acreditamos que a arte inspirada pela fé deve ser preservada e compartilhada. Se você tem conhecimento sobre obras de arte com temática bíblica, ficamos felizes em receber sua contribuição!

### Como Contribuir

1. 🍴 Faça um fork do projeto
2. 🌟 Crie uma branch para sua feature (`git checkout -b feature/nova-obra`)
3. ✅ Commit suas mudanças (`git commit -m 'Adiciona nova obra: [Nome da Obra]'`)
4. 📤 Push para a branch (`git push origin feature/nova-obra`)
5. 🔄 Abra um Pull Request

### Adicionando Novas Obras

Para adicionar uma nova obra de arte:
1. Adicione a imagem em `src/assets/`
2. Inclua os dados da obra em `src/data/artworks.ts`
3. Certifique-se de incluir as referências bíblicas precisas
4. Teste localmente antes de submeter

## Licença

Este projeto é uma iniciativa educacional e cultural. A publicação de cada
obra segue uma auditoria de direitos autorais (feita em 2026-08-07, ver nota
correspondente no vault Obsidian do mantenedor) — a maioria do acervo é
domínio público (morte do artista há 70+ anos), algumas obras contemporâneas
são publicadas com atribuição sob licença explícita (ex. Andrei Mironov,
CC BY-SA 4.0), e obras sem licença clara **não entram no catálogo público**,
mesmo estando disponíveis no repositório de dados interno.
