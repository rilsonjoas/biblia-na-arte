import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from './markdown';

describe('Markdown', () => {
  it('renderiza negrito, itálico e links', () => {
    render(<Markdown content="**forte** e *italico* com [link](https://example.com)" />);
    const strong = screen.getByText('forte');
    expect(strong.tagName).toBe('STRONG');
    const em = screen.getByText('italico');
    expect(em.tagName).toBe('EM');
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('escapa HTML cru (conteúdo curado não é HTML)', () => {
    render(<Markdown content="<script>alert('x')</script> e texto normal" />);
    expect(screen.queryByText(/alert\('x'\)/, { selector: 'script' })).toBeNull();
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText(/texto normal/)).toBeDefined();
  });

  it('renderiza citação', () => {
    render(<Markdown content="> citacao famosa" />);
    expect(screen.getByText('citacao famosa').closest('blockquote')).not.toBeNull();
  });

  it('renderiza lista', () => {
    render(<Markdown content={'- item 1\n- item 2'} />);
    expect(screen.getByText('item 1').tagName).toBe('LI');
    expect(screen.getByText('item 2').tagName).toBe('LI');
  });
});
