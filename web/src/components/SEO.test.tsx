import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SEO } from './SEO';

describe('SEO', () => {
  beforeEach(() => {
    document.title = '';
    document.head.innerHTML = '';
  });

  it('atualiza o document.title e meta description com valores padrão', () => {
    render(<SEO />);
    expect(document.title).toBe('Bíblia na Arte — As Sagradas Escrituras Através das Artes');

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta).not.toBeNull();
    expect(descMeta?.getAttribute('content')).toContain('Explore pinturas, obras de arte');
  });

  it('atualiza o document.title e OpenGraph quando title customizado é informado', () => {
    render(<SEO title="O Bom Samaritano" description="Análise da pintura" />);
    expect(document.title).toBe('O Bom Samaritano | Bíblia na Arte');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe('O Bom Samaritano | Bíblia na Arte');

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute('content')).toBe('Análise da pintura');
  });

  it('injeta dados estruturados Schema.org no head', () => {
    const mockSchema = {
      '@context': 'https://schema.org',
      '@type': 'VisualArtwork',
      name: 'O Bom Samaritano',
    };

    render(<SEO title="O Bom Samaritano" schema={mockSchema} />);

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('VisualArtwork');
    expect(script?.textContent).toContain('O Bom Samaritano');
  });
});
