import { describe, expect, it } from 'vitest';
import { artworkIdFromSlug, uuidV5 } from './deterministic-uuid.js';

describe('artworkIdFromSlug', () => {
  it('devolve o mesmo UUID pro mesmo slug, sempre', () => {
    const a = artworkIdFromSlug('rembrandt-o-filho-prodigo');
    const b = artworkIdFromSlug('rembrandt-o-filho-prodigo');
    expect(a).toBe(b);
  });

  it('devolve UUIDs diferentes pra slugs diferentes', () => {
    expect(artworkIdFromSlug('obra-a')).not.toBe(artworkIdFromSlug('obra-b'));
  });

  it('devolve um UUID v5 válido (versão e variante corretas)', () => {
    const id = artworkIdFromSlug('qualquer-slug');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('bate com o vetor de teste oficial do RFC 4122 (namespace DNS + "www.widgets.com")', () => {
    expect(uuidV5('www.widgets.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(
      '21f7f8de-8051-5b89-8680-0195ef798b6a',
    );
  });
});
