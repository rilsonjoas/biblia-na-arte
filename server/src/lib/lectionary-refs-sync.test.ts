import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// A tabela de leituras (`src/data/daily-readings-refs.json`) é COPIADA À MÃO do Lecionário
// (docs: hetzner-infra/CONTRATOS-ENTRE-PROJETOS.md, seção 2.5). Se o calendário de lá mudar e
// a cópia for esquecida, a Pintura do Dia daqui e a do Lecionário escolhem obras diferentes no
// mesmo dia, sem erro nenhum. Este teste é a segunda metade da corrente: compara a cópia com o
// arquivo OFICIAL do Lecionário (que o teste de lá garante estar em dia com o calendário).
//
// Rede fora do ar não reprova (CI não pode depender do GitHub estar de pé): avisa e pula.
// Divergência ou arquivo oficial inexistente reprova.
const URL_OFICIAL =
  process.env.LECIONARIO_REFS_URL ??
  'https://raw.githubusercontent.com/rilsonjoas/lecionario/main/lecionario-web/data/daily-readings-refs.json';
// Para rodar localmente contra um checkout do Lecionário, sem rede:
//   LECIONARIO_REFS_FILE=../lecionario/lecionario-web/data/daily-readings-refs.json npx vitest run
const ARQUIVO_LOCAL = process.env.LECIONARIO_REFS_FILE;

const COPIA = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'daily-readings-refs.json',
);

type Tabela = Record<string, { season: string; refs: string[] }>;

async function carregarOficial(): Promise<Tabela | 'sem-rede'> {
  if (ARQUIVO_LOCAL) return JSON.parse(readFileSync(path.resolve(ARQUIVO_LOCAL), 'utf-8'));
  let res: Response;
  try {
    res = await fetch(URL_OFICIAL, { signal: AbortSignal.timeout(15_000) });
  } catch {
    return 'sem-rede';
  }
  if (res.status >= 500) return 'sem-rede';
  if (!res.ok) {
    throw new Error(
      `Arquivo oficial do Lecionário não encontrado (HTTP ${res.status}) em ${URL_OFICIAL}. ` +
        'Se o caminho mudou, atualize URL_OFICIAL aqui e a seção 2.5 de CONTRATOS-ENTRE-PROJETOS.md.',
    );
  }
  return (await res.json()) as Tabela;
}

describe('tabela de leituras copiada do Lecionário', () => {
  it('é idêntica ao arquivo oficial do Lecionário', async () => {
    const oficial = await carregarOficial();
    if (oficial === 'sem-rede') {
      console.warn('[lectionary-refs-sync] GitHub inacessível: comparação pulada (não reprova).');
      return;
    }
    const copia = JSON.parse(readFileSync(COPIA, 'utf-8')) as Tabela;
    const dias = new Set([...Object.keys(oficial), ...Object.keys(copia)]);
    const diferentes = [...dias].filter(
      (d) => JSON.stringify(oficial[d]) !== JSON.stringify(copia[d]),
    );
    expect(
      diferentes.length,
      `${diferentes.length} dia(s) divergem do Lecionário (ex.: ${diferentes.slice(0, 3).join(', ')}). ` +
        'Copie lecionario/lecionario-web/data/daily-readings-refs.json para ' +
        'biblia-na-arte/server/src/data/daily-readings-refs.json.',
    ).toBe(0);
  });
});
