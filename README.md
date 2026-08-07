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

## Como Executar Localmente

> [!NOTE]
> Desde 2026-08-07 este é um **monorepo pnpm workspace** (`web/` +
> `server/`) — o projeto saiu do Supabase (banco de dados e storage) e está
> migrando pra self-host num VPS próprio. Detalhes técnicos em
> [`CLAUDE.md`](CLAUDE.md).

### Pré-requisitos
- Node.js 20+
- **pnpm** (não npm/yarn/bun — o lockfile do workspace é do pnpm)
- **git-lfs** instalado antes de clonar (as imagens em `web/src/assets/`
  são ~467MB versionadas via Git LFS — sem o `git-lfs`, você recebe só
  ponteiros de texto, não as imagens de verdade)

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

## Tecnologias Utilizadas

**Frontend (`web/`):**
- ⚡ **Vite** + SWC · ⚛️ **React 18** · 📘 **TypeScript**
- 🎨 **Tailwind CSS** + **shadcn/ui** · 🎯 **React Router** · 🔍 **TanStack Query**

**Backend (`server/`):**
- 🚀 **Fastify** — API REST, leve, adequada pro VPS pequeno onde roda
- 🗄️ **Drizzle ORM** + Postgres — sem engine binária separada
- ✅ **Zod** — validação de entrada
- 🔒 helmet + rate limit + CORS restrito

## Estrutura do Projeto

```
biblia-na-arte/
├── pnpm-workspace.yaml
├── web/                  # Frontend
│   └── src/
│       ├── components/   # Componentes reutilizáveis
│       ├── pages/        # Páginas da aplicação
│       ├── lib/          # Utilitários e helpers
│       ├── types/        # Definições TypeScript
│       └── assets/       # Imagens (Git LFS)
└── server/               # API REST
    └── src/
        ├── db/           # Schema Drizzle, client, migrations
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
