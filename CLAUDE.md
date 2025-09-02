# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BiblianaArte.com is a React web application that explores the connection between biblical passages and artistic works (paintings, music, films). The site allows users to browse artworks by category, search by biblical references, and explore the relationship between scripture and art.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture

The application uses a React SPA with client-side routing:

### Core Structure
- **App.tsx**: Main app with React Router setup and routes
- **pages/**: Route components (Index, BibleBooks, ArtCategories, ArtworkDetail, About, Contribute, NotFound)
- **components/**: Reusable UI components including shadcn/ui components
- **data/**: Static data files for artworks and bible structure
- **lib/data.ts**: Data access layer with functions for filtering/searching artworks and bible books
- **types/**: TypeScript interfaces for Artwork, BibleReference, and BibleBook

### Key Data Models
- **Artwork**: Contains artwork metadata, biblical references, and media URLs
- **BibleReference**: Links artworks to specific bible passages (book, chapter, verses)
- **BibleBook**: Bible book metadata with slug, chapters, and testament

### Routing Structure
- `/` - Homepage
- `/biblia` - Bible books browser
- `/arte` - Art categories
- `/arte/:category` - Filtered artworks by category
- `/obra/:artworkId` - Individual artwork details
- `/sobre` - About page
- `/contribuir` - Contribute page

### Tech Stack
- React 18 with TypeScript
- Vite build tool with SWC
- React Router for routing
- shadcn/ui component library with Radix UI primitives
- TanStack Query for state management
- Tailwind CSS for styling
- Lucide React for icons

### Asset Management
- Images stored in `/src/assets/`
- YouTube embeds for music content using `embedUrl` field
- Image paths use `/src/assets/` prefix in data

### Data Layer
The `src/lib/data.ts` module provides centralized functions for:
- Getting all artworks/bible books
- Filtering by category, bible reference, or search query
- Finding specific artworks or bible books by ID/slug