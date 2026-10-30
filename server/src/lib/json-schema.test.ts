import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodToJsonSchema } from './json-schema.js';

/** `zodToJsonSchema` substitui o `zod-to-json-schema` (Zod 4). O que a OpenAPI e os contratos dos consumidores esperam. */
describe('zodToJsonSchema', () => {
  it('z.date() vira string date-time (o Zod 4 não representa Date; sem isto vira {} e o tipo gerado vira unknown)', () => {
    expect(zodToJsonSchema(z.object({ createdAt: z.string().or(z.date()).optional() }))).toMatchObject({
      properties: { createdAt: { anyOf: [{ type: 'string' }, { type: 'string', format: 'date-time' }] } },
    });
  });

  it('campo com valor padrão não é obrigatório (o servidor preenche)', () => {
    const j = zodToJsonSchema(z.object({ q: z.string(), limit: z.coerce.number().default(20) }));
    expect(j.required).toEqual(['q']);
  });

  it('sem nenhum obrigatório, não deixa `required: []`', () => {
    expect(zodToJsonSchema(z.object({ limit: z.number().default(1) }))).not.toHaveProperty('required');
  });

  it('esquema de resposta fecha o objeto (additionalProperties: false), como antes', () => {
    expect(zodToJsonSchema(z.object({ a: z.string() }))).toMatchObject({ additionalProperties: false });
  });

  it('allowedAdditionalProperties: true (query) não fecha o objeto, e o padrão segue opcional', () => {
    const j = zodToJsonSchema(z.object({ q: z.string(), limit: z.coerce.number().default(20) }), { allowedAdditionalProperties: true });
    expect(j).not.toHaveProperty('additionalProperties', false);
    expect(j.required).toEqual(['q']);
  });

  it('não vaza o $schema', () => {
    expect(zodToJsonSchema(z.string())).not.toHaveProperty('$schema');
  });
});
