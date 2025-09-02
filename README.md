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

### Pré-requisitos
- Node.js (versão 16 ou superior) - [Instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm ou yarn

### Passos para Instalação

```bash
# 1. Clone este repositório
git clone https://github.com/seu-usuario/biblia-na-arte.git

# 2. Navegue até o diretório do projeto
cd biblia-na-arte

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

### Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Visualizar build de produção
npm run lint     # Verificar código com ESLint
```

## Tecnologias Utilizadas

Este projeto foi construído com amor usando tecnologias modernas:

- ⚡ **Vite** - Build tool ultrarrápida
- ⚛️ **React 18** - Biblioteca para interfaces de usuário
- 📘 **TypeScript** - JavaScript com tipagem estática
- 🎨 **Tailwind CSS** - Framework CSS utilitário
- 🧩 **shadcn/ui** - Componentes acessíveis e customizáveis
- 🎯 **React Router** - Navegação no lado do cliente
- 🔍 **TanStack Query** - Gerenciamento de estado assíncrono

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
├── data/          # Dados estáticos (obras de arte, estrutura bíblica)
├── lib/           # Utilitários e helpers
├── types/         # Definições TypeScript
└── assets/        # Imagens e recursos estáticos
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

Este projeto é uma iniciativa educacional e cultural. Todas as obras de arte referenciadas são de domínio público ou utilizadas para fins educacionais.
