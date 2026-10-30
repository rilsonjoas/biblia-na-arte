import { z } from 'zod';

type Json = Record<string, unknown>;

/**
 * Campo com valor padrão não é obrigatório para quem chama a API (o servidor preenche). O `z.toJSONSchema` em modo de saída
 * os lista em `required`; o `zod-to-json-schema`, que este módulo substitui, não os listava. Mantemos o comportamento
 * antigo para a OpenAPI (e os contratos dos consumidores) não mudarem de significado.
 */
function tirarPadroesDeRequired(no: unknown): void {
  if (Array.isArray(no)) return no.forEach(tirarPadroesDeRequired);
  if (typeof no !== 'object' || no === null) return;
  const obj = no as Json;
  const props = obj.properties as Record<string, Json> | undefined;
  if (props && Array.isArray(obj.required)) {
    obj.required = (obj.required as string[]).filter((k) => !('default' in (props[k] ?? {})));
    if ((obj.required as string[]).length === 0) delete obj.required;
  }
  Object.values(obj).forEach(tirarPadroesDeRequired);
}

/**
 * Esquema JSON (draft-7) de um schema Zod, para o OpenAPI e a validação do Fastify. Substitui o `zod-to-json-schema`
 * (que não suporta o Zod 4). `allowedAdditionalProperties: true` (esquemas de query, que ignoram chaves extras) usa o modo
 * de entrada, que não fecha o objeto com `additionalProperties: false`; os demais usam o modo de saída, como antes.
 */
export function zodToJsonSchema(
  schema: z.ZodType,
  opcoes: { allowedAdditionalProperties?: boolean; $refStrategy?: string } = {},
): Json {
  const { $schema: _descartado, ...resto } = z.toJSONSchema(schema, {
    target: 'draft-7',
    io: opcoes.allowedAdditionalProperties ? 'input' : 'output',
    unrepresentable: 'any',
    // `z.date()` não tem forma em JSON Schema no Zod 4 (viraria `{}`); na resposta a data sai como texto ISO.
    override: (ctx) => {
      if (ctx.zodSchema._zod.def.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date-time';
      }
    },
  }) as Json;
  tirarPadroesDeRequired(resto);
  return resto;
}
