import { describe, it, expect } from 'vitest';
import { createSubmissionSchema, loginSchema } from './submission.schema.js';

describe('createSubmissionSchema', () => {
  const minimal = {
    submitterName: 'Maria Artista',
    submitterEmail: 'maria@example.com',
    rightsConfirmed: 'true',
    title: 'Cristo na Cruz',
  };

  it('aceita o mínimo obrigatório, sem nenhum campo opcional', () => {
    const result = createSubmissionSchema.parse(minimal);
    expect(result.title).toBe('Cristo na Cruz');
    expect(result.rightsConfirmed).toBe(true);
    expect(result.artistName).toBeUndefined();
  });

  it('exige rightsConfirmed — não deixa passar sem a confirmação de direito de imagem', () => {
    expect(() => createSubmissionSchema.parse({ ...minimal, rightsConfirmed: 'false' })).toThrow();
    expect(() => createSubmissionSchema.parse({ ...minimal, rightsConfirmed: undefined })).toThrow();
  });

  it('exige nome, e-mail e título — o mínimo pra ser revisável', () => {
    expect(() => createSubmissionSchema.parse({ ...minimal, submitterName: '' })).toThrow();
    expect(() => createSubmissionSchema.parse({ ...minimal, submitterEmail: 'não-é-email' })).toThrow();
    expect(() => createSubmissionSchema.parse({ ...minimal, title: '' })).toThrow();
  });

  it('aceita todos os campos opcionais preenchidos, com a mesma qualidade de uma obra do vault', () => {
    const full = {
      ...minimal,
      subtitle: 'Christ on the Cross',
      artistName: 'Diego Velázquez',
      year: '1632',
      description: 'Descrição rica da obra.',
      location: 'Museo del Prado, Madri, Espanha',
      sourceUrl: 'https://www.museodelprado.es/obra',
      suggestedBook: 'João',
      suggestedChapter: '19',
      suggestedVerses: '17-18',
      suggestedPassageText: 'Tomaram, pois, a Jesus...',
    };
    const result = createSubmissionSchema.parse(full);
    expect(result.artistName).toBe('Diego Velázquez');
    expect(result.suggestedChapter).toBe(19);
  });

  it('rejeita URL de fonte inválida quando preenchida', () => {
    expect(() => createSubmissionSchema.parse({ ...minimal, sourceUrl: 'não é url' })).toThrow();
  });
});

describe('loginSchema', () => {
  it('exige e-mail válido e senha não vazia', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '123' })).not.toThrow();
    expect(() => loginSchema.parse({ email: 'invalido', password: '123' })).toThrow();
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow();
  });
});
