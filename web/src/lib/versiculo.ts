// "Versículo do Dia" — fonte única do cluster "A Biblioteca": a rota
// /api/versiculo-do-dia do Lecionário (leituras RCL, tradução ARC,
// determinística por data). Chamada SEM `?date` de propósito — o endpoint
// resolve "hoje" em America/Sao_Paulo (decisão do cluster: um único
// relógio, mesmo contrato do /artworks/daily deste projeto). O MESMO
// endpoint alimenta o home do Scriptorium Divinum, então os dois mostram o
// mesmo versículo no mesmo dia.
//
// Endpoint nunca responde 404 (fora da cobertura RCL cai num pool fixo,
// `fallback: true`); erro de rede/5xx vira `null` — o card é vitrine na
// home e deve "sumir com graça", nunca quebrar a página. Lembrete: a rota
// só responde quando o deploy do lecionario-web estiver no ar.
const LECIONARIO_URL = import.meta.env.VITE_LECIONARIO_URL?.replace(/\/+$/, '') ?? 'https://lecionario.narniano.com';

export interface Verse {
  type: 'gospel' | 'psalm' | 'first_reading' | 'second_reading' | 'fallback';
  reference: string;
  citation: string;
  text: string;
}

export interface VersiculoDoDia {
  /** Dia no fuso de referência (America/Sao_Paulo), YYYY-MM-DD. */
  date: string;
  verse: Verse;
  /** true quando o dia não tem leitura RCL e o pool fixo assumiu. */
  fallback: boolean;
  /** true quando a guarda anti-repetição trocou o versículo litúrgico. */
  shifted: boolean;
}

export function lecionarioHomeUrl(): string {
  return LECIONARIO_URL;
}

export async function getVerseOfTheDay(): Promise<VersiculoDoDia | null> {
  try {
    const response = await fetch(`${LECIONARIO_URL}/api/versiculo-do-dia`);
    if (!response.ok) return null;
    return (await response.json()) as VersiculoDoDia;
  } catch {
    return null;
  }
}