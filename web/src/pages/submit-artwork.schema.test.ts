import { describe, expect, it } from 'vitest';
import { submitArtworkFormSchema as schema } from './submit-artwork.schema';

const valido = { submitterName: 'Maria', submitterEmail: 'maria@exemplo.org', rightsConfirmed: true, title: 'A Ceia' };
const mensagens = (r: ReturnType<typeof schema.safeParse>) =>
  r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);

/** Validação do formulário de submissão de obra (o que a pessoa vê). Migração para o Zod 4 (30/10/2026): mesmas mensagens e regras. */
describe('formulário de submissão de obra', () => {
  it('aceita só os campos obrigatórios', () => {
    expect(schema.safeParse(valido).success).toBe(true);
  });

  it('mensagens em português dos obrigatórios', () => {
    const m = mensagens(schema.safeParse({ ...valido, submitterName: '  ', submitterEmail: 'sem-arroba', title: '' }));
    expect(m).toContain('submitterName: Seu nome é obrigatório');
    expect(m).toContain('submitterEmail: E-mail inválido');
    expect(m).toContain('title: Título da obra é obrigatório');
  });

  it('exige confirmar o direito sobre a imagem, com a mensagem certa', () => {
    expect(mensagens(schema.safeParse({ ...valido, rightsConfirmed: false }))).toEqual([
      'rightsConfirmed: É preciso confirmar que você tem direito sobre a imagem',
    ]);
    expect(mensagens(schema.safeParse({ ...valido, rightsConfirmed: undefined }))).toHaveLength(1);
  });

  it('apara espaços (nome, e-mail, título)', () => {
    const r = schema.parse({ ...valido, submitterName: '  Maria  ', submitterEmail: '  maria@exemplo.org ', title: ' A Ceia ' });
    expect([r.submitterName, r.submitterEmail, r.title]).toEqual(['Maria', 'maria@exemplo.org', 'A Ceia']);
  });

  it('endereço da fonte: vazio é aceito, endereço válido é aceito, texto solto não', () => {
    expect(schema.safeParse({ ...valido, sourceUrl: '' }).success).toBe(true);
    expect(schema.safeParse({ ...valido, sourceUrl: 'https://exemplo.org/obra' }).success).toBe(true);
    expect(mensagens(schema.safeParse({ ...valido, sourceUrl: 'exemplo' }))).toContain('sourceUrl: URL inválida');
  });

  it('capítulo: vazio e ausente passam; "3" vira 3; zero, negativo, decimal e texto não', () => {
    expect(schema.safeParse({ ...valido, suggestedChapter: '' }).success).toBe(true);
    expect(schema.safeParse({ ...valido }).success).toBe(true);
    expect(schema.parse({ ...valido, suggestedChapter: '3' }).suggestedChapter).toBe(3);
    for (const ruim of ['0', '-2', '1.5', 'abc']) {
      expect(schema.safeParse({ ...valido, suggestedChapter: ruim }).success, `capítulo ${ruim}`).toBe(false);
    }
  });

  it('limites de tamanho', () => {
    expect(schema.safeParse({ ...valido, submitterName: 'x'.repeat(201) }).success).toBe(false);
    expect(schema.safeParse({ ...valido, description: 'x'.repeat(5001) }).success).toBe(false);
    expect(schema.safeParse({ ...valido, description: 'x'.repeat(5000) }).success).toBe(true);
  });
});
