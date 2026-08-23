import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'biblianaarte:favoritos';

/** Lê o array de IDs favoritados do localStorage. Nunca lança — modo
 *  privado, cookies bloqueados etc. simplesmente devolvem lista vazia. */
function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage indisponível — favorito simplesmente não persiste
    // nesta sessão, sem quebrar a interação.
  }
}

/** Favoritos locais (roadmap Fase 5) — sem conta de usuário, por design:
 *  fica só no navegador de quem favoritou, mesmo princípio de qualquer
 *  outro dado só-do-cliente deste site (não precisa de backend pra isso).
 *  `storage` event sincroniza entre abas abertas do mesmo navegador. */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavorites());

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setFavoriteIds(readFavorites());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite };
}
