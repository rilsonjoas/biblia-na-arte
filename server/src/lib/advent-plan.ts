/** Plano curado da Pintura do Dia do 1º domingo do Advento até 6 de janeiro (Epifania).
 *
 *  Por que existe: a escolha pelo lecionário (`daily-artwork.ts`) liga a obra ao CAPÍTULO da leitura
 *  do dia. No Advento isso rende dias sem relação com o tempo litúrgico (Baal, Eliseu, Pedro curando
 *  o paralítico), e 24/12 não tem leitura cadastrada, então cai no sorteio do acervo inteiro. Decisão
 *  do autor em 20/11/2026: lista curada, com plano para os anos seguintes (docs/PLANO-ADVENTO-NATAL.md).
 *
 *  Como funciona, sem depender do ano:
 *  - de 17/12 a 24/12 e de 25/12 a 06/01 o dia é fixo (`FIXOS`);
 *  - antes de 17/12 vale a semana do Advento (1 a 3, contada do 1º domingo) e o dia da semana (`SEMANAS`);
 *  - cada dia tem 2 a 3 candidatas em ordem. O ano 2026 usa a 1ª, 2027 a 2ª, 2028 a 3ª (ou volta à 1ª), e
 *    nenhuma obra repete dentro do mesmo ano.
 *
 *  Módulo puro: só devolve slugs. Quem decide se a obra ainda é publicável (ativa, com imagem) é
 *  `queries.ts`, que cai na próxima candidata e, por último, no lecionário. */

const ANO_BASE = 2026;

/** Candidatas por semana do Advento (1..3) e dia da semana (0 = domingo). */
const SEMANAS: Record<number, Record<number, readonly string[]>> = {
  // Semana 1: esperança e vigilância
  1: {
    0: ['gustave-dore-o-profeta-isaias', 'james-tissot-o-profeta-malaquias'],
    1: ['jan-bruegel-o-velho-profecia-do-profeta-isaias', 'gustave-dore-a-visao-de-zacarias-dos-quatro-carros'],
    2: ['hieronymus-francken-ii-a-parabola-das-dez-virgens', 'ernst-friedrich-von-liphart-a-parabola-das-virgens-prudentes-e-insensatas'],
    3: ['james-tissot-o-profeta-habacuque', 'james-tissot-o-profeta-ageu'],
    4: ['friedrich-wilhelm-schadow-as-virgens-prudentes-e-insensatas', 'john-fleetwood-as-virgens-prudentes-e-insensatas'],
    5: ['john-martin-o-juizo-final', 'gustave-dore-o-juizo-final'],
    6: ['gustave-dore-miqueias-exorta-os-israelitas-ao-arrependimento', 'james-tissot-o-profeta-naum'],
  },
  // Semana 2: preparai o caminho (João Batista e os profetas)
  2: {
    0: ['rembrandt-van-rijn-a-pregacao-de-joao-batista', 'jan-steen-joao-batista-pregando'],
    1: ['gustave-dore-joao-batista-prega-no-deserto', 'pieter-de-grebber-joao-batista-prega-a-herodes-antipas'],
    2: ['hieronymus-bosch-joao-batista-no-deserto', 'caravaggio-joao-batista-no-deserto'],
    3: ['caravaggio-joao-batista-no-deserto', 'hieronymus-bosch-joao-batista-no-deserto'],
    4: ['james-tissot-o-profeta-oseias', 'michelangelo-o-profeta-joel'],
    5: ['michelangelo-o-profeta-joel', 'james-tissot-o-profeta-obadias'],
    6: ['gustave-dore-o-profeta-jeremias', 'gustave-dore-o-profeta-amos'],
  },
  // Semana 3: alegria, os nascimentos anunciados, Maria
  3: {
    0: ['alexander-ivanov-o-anjo-gabriel-aparece-a-zacarias', 'william-blake-o-anjo-aparecendo-a-zacarias'],
    1: ['rogier-van-der-weyden-o-nascimento-de-joao-batista', 'jeronimo-cosida-o-nascimento-de-joao-batista'],
    2: ['jeronimo-cosida-o-nascimento-de-joao-batista', 'rogier-van-der-weyden-o-nascimento-de-joao-batista'],
    3: ['henry-ossawa-tanner-maria', 'lucas-cranach-o-velho-a-virgem-e-a-crianca'],
    4: ['masolino-da-panicale-a-anunciacao', 'henry-ossawa-tanner-a-anunciacao'],
    5: ['gerard-david-a-anunciacao', 'jan-provoost-a-anunciacao'],
    6: ['beatrice-emma-parsons-anunciacao', 'william-henry-margetson-a-anunciacao'],
  },
};

/** Datas fixas, chave `MM-DD`. */
const FIXOS: Record<string, readonly string[]> = {
  '12-17': ['rembrandt-van-rijn-o-sonho-de-jose', 'georges-de-la-tour-jose-o-carpinteiro'],
  '12-18': ['autor-desconhecido-o-sonho-de-jose-e-a-jornada-ate-belem', 'georges-de-la-tour-jose-o-carpinteiro'],
  '12-19': [
    'william-blake-o-anjo-aparecendo-a-zacarias',
    'alexander-ivanov-o-anjo-gabriel-aparece-a-zacarias',
    'william-blake-a-virgem-e-a-crianca',
  ],
  '12-20': ['fra-angelico-a-anunciacao', 'leonardo-da-vinci-a-anunciacao'],
  '12-21': ['gerard-david-a-anunciacao', 'petrus-christus-a-anunciacao'],
  '12-22': ['carl-bloch-a-visitacao', 'rogier-van-der-weyden-a-visitacao'],
  '12-23': ['pieter-bruegel-o-velho-o-censo-em-belem', 'ticiano-a-anunciacao'],
  '12-24': [
    'michael-rieser-a-noite-antes-do-nascimento-de-cristo-am-abend-vor-christi-geburt-a-noite-antes-do-na',
    'geertgen-tot-sint-jans-a-natividade-a-noite',
  ],
  '12-25': ['antoon-van-dyck-natividade', 'william-henry-margetson-o-primeiro-natal', 'gustave-dore-o-nascimento-de-jesus'],
  '12-26': [
    'rembrandt-van-rijn-o-apedrejamento-de-estevao',
    'gustave-dore-a-morte-de-estevao',
    'bartholomeus-breenbergh-o-apedrejamento-de-estevao',
  ],
  '12-27': [
    'domenichino-sao-joao-evangelista',
    'ticiano-joao-evangelista-em-patmos',
    'gustave-dore-joao-na-ilha-de-patmos',
  ],
  '12-28': [
    'francois-joseph-navez-o-massacre-dos-inocentes',
    'lippo-memmi-o-massacre-dos-inocentes',
    'gustave-dore-a-matanca-dos-inocentes-de-belem',
  ],
  '12-29': [
    'rembrandt-van-rijn-a-cancao-de-louvor-de-simeao',
    'aert-de-gelder-cantico-de-louvor-de-simeao',
    'giotto-di-bondone-apresentacao-de-jesus-no-templo',
  ],
  '12-30': [
    'francisco-de-zurbaran-a-fuga-para-o-egito',
    'jean-leon-gerome-a-fuga-para-o-egito',
    'almeida-junior-fuga-da-sagrada-familia-para-o-egito',
  ],
  '12-31': [
    'gerard-david-descanso-no-caminho-para-o-egito',
    'francisco-de-zurbaran-descanso-na-fuga-para-o-egito',
    'eugene-girardet-a-fuga-para-o-egito',
  ],
  '01-01': ['rembrandt-van-rijn-a-circuncisao-de-jesus', 'hans-holbein-o-velho-apresentacao-de-jesus-no-templo'],
  '01-02': ['ticiano-a-sagrada-familia-com-um-pastor', 'rembrandt-van-rijn-a-sagrada-familia'],
  '01-03': ['caravaggio-a-adoracao-dos-pastores', 'giorgione-a-adoracao-dos-pastores', 'nicolaes-maes-adoracao-dos-pastores'],
  '01-04': [
    'paul-hey-a-estrela-de-belem-der-stern-von-bethlehem-a-estrela-de-belem',
    'gustave-dore-os-magos-sao-guiados-por-uma-estrela',
  ],
  '01-05': [
    'bartolome-esteban-murillo-adoracao-dos-reis-magos',
    'diego-velazquez-a-adoracao-dos-reis-magos',
    'j-c-leyendecker-os-tres-reis-magos',
  ],
  '01-06': [
    'sandro-botticelli-a-adoracao-dos-magos',
    'peter-paul-rubens-adoracao-dos-magos',
    'giorgione-a-adoracao-dos-reis-magos',
  ],
};

/** Todos os slugs que o plano pode usar (para conferir contra o catálogo). */
export const SLUGS_DO_PLANO: readonly string[] = [
  ...new Set([
    ...Object.values(FIXOS).flat(),
    ...Object.values(SEMANAS).flatMap((semana) => Object.values(semana).flat()),
  ]),
];

const DIA_MS = 86_400_000;

function utc(ano: number, mes: number, dia: number): number {
  return Date.UTC(ano, mes - 1, dia);
}

function isoDe(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 1º domingo do Advento: 4 domingos antes do Natal (o 4º é o domingo anterior a 25/12, ou 18/12 se o Natal cair num domingo). */
export function inicioDoAdvento(ano: number): string {
  const natal = utc(ano, 12, 25);
  const diaSemana = new Date(natal).getUTCDay();
  const voltar = diaSemana === 0 ? 7 : diaSemana;
  return isoDe(natal - voltar * DIA_MS - 21 * DIA_MS);
}

const cachePorAno = new Map<number, Map<string, readonly string[]>>();

/** Plano do ano litúrgico que começa no Advento de `ano` e termina em 06/01 de `ano + 1`.
 *  Dia => candidatas, a escolhida do ano primeiro. */
function planoDoAno(ano: number): Map<string, readonly string[]> {
  const guardado = cachePorAno.get(ano);
  if (guardado) return guardado;

  const plano = new Map<string, readonly string[]>();
  const usadas = new Set<string>();
  const inicio = Date.parse(`${inicioDoAdvento(ano)}T00:00:00Z`);
  const fim = utc(ano + 1, 1, 6);

  for (let ms = inicio; ms <= fim; ms += DIA_MS) {
    const data = isoDe(ms);
    const mesDia = data.slice(5);
    const lista =
      FIXOS[mesDia] ??
      SEMANAS[Math.floor((ms - inicio) / (7 * DIA_MS)) + 1]?.[new Date(ms).getUTCDay()];
    if (!lista || lista.length === 0) continue;

    const deslocamento = (((ano - ANO_BASE) % lista.length) + lista.length) % lista.length;
    const girada = [...lista.slice(deslocamento), ...lista.slice(0, deslocamento)];
    const escolhida = girada.find((slug) => !usadas.has(slug));
    if (!escolhida) continue;
    usadas.add(escolhida);
    plano.set(data, [escolhida, ...girada.filter((slug) => slug !== escolhida && !usadas.has(slug))]);
  }

  cachePorAno.set(ano, plano);
  return plano;
}

/** Candidatas do plano para a data (`YYYY-MM-DD`), a escolhida do ano primeiro; `undefined` fora do período. */
export function getAdventPlanSlugs(dateStr: string): readonly string[] | undefined {
  const ano = Number(dateStr.slice(0, 4));
  const mes = Number(dateStr.slice(5, 7));
  const dia = Number(dateStr.slice(8, 10));
  if (!Number.isInteger(ano) || mes < 1) return undefined;
  const anoLiturgico = mes === 1 && dia <= 6 ? ano - 1 : ano;
  if (mes > 1 && mes < 11) return undefined;
  return planoDoAno(anoLiturgico).get(dateStr);
}
