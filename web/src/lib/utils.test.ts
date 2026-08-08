import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('junta classes e resolve conflitos de tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('ignora falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
