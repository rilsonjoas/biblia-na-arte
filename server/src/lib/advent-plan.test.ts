import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SLUGS_DO_PLANO, getAdventPlanSlugs, inicioDoAdvento } from './advent-plan.js';

function diasDe(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  for (let ms = Date.parse(`${inicio}T00:00:00Z`); ms <= Date.parse(`${fim}T00:00:00Z`); ms += 86_400_000) {
    dias.push(new Date(ms).toISOString().slice(0, 10));
  }
  return dias;
}

const PLANO_2026_APROVADO: Record<string, string> = {
  '2026-11-29': 'gustave-dore-o-profeta-isaias',
  '2026-11-30': 'jan-bruegel-o-velho-profecia-do-profeta-isaias',
  '2026-12-01': 'hieronymus-francken-ii-a-parabola-das-dez-virgens',
  '2026-12-02': 'james-tissot-o-profeta-habacuque',
  '2026-12-03': 'friedrich-wilhelm-schadow-as-virgens-prudentes-e-insensatas',
  '2026-12-04': 'john-martin-o-juizo-final',
  '2026-12-05': 'gustave-dore-miqueias-exorta-os-israelitas-ao-arrependimento',
  '2026-12-06': 'rembrandt-van-rijn-a-pregacao-de-joao-batista',
  '2026-12-07': 'gustave-dore-joao-batista-prega-no-deserto',
  '2026-12-08': 'hieronymus-bosch-joao-batista-no-deserto',
  '2026-12-09': 'caravaggio-joao-batista-no-deserto',
  '2026-12-10': 'james-tissot-o-profeta-oseias',
  '2026-12-11': 'michelangelo-o-profeta-joel',
  '2026-12-12': 'gustave-dore-o-profeta-jeremias',
  '2026-12-13': 'alexander-ivanov-o-anjo-gabriel-aparece-a-zacarias',
  '2026-12-14': 'rogier-van-der-weyden-o-nascimento-de-joao-batista',
  '2026-12-15': 'jeronimo-cosida-o-nascimento-de-joao-batista',
  '2026-12-16': 'henry-ossawa-tanner-maria',
  '2026-12-17': 'rembrandt-van-rijn-o-sonho-de-jose',
  '2026-12-18': 'autor-desconhecido-o-sonho-de-jose-e-a-jornada-ate-belem',
  '2026-12-19': 'william-blake-o-anjo-aparecendo-a-zacarias',
  '2026-12-20': 'fra-angelico-a-anunciacao',
  '2026-12-21': 'gerard-david-a-anunciacao',
  '2026-12-22': 'carl-bloch-a-visitacao',
  '2026-12-23': 'pieter-bruegel-o-velho-o-censo-em-belem',
  '2026-12-24': 'michael-rieser-a-noite-antes-do-nascimento-de-cristo-am-abend-vor-christi-geburt-a-noite-antes-do-na',
  '2026-12-25': 'antoon-van-dyck-natividade',
  '2026-12-26': 'rembrandt-van-rijn-o-apedrejamento-de-estevao',
  '2026-12-27': 'domenichino-sao-joao-evangelista',
  '2026-12-28': 'francois-joseph-navez-o-massacre-dos-inocentes',
  '2026-12-29': 'rembrandt-van-rijn-a-cancao-de-louvor-de-simeao',
  '2026-12-30': 'francisco-de-zurbaran-a-fuga-para-o-egito',
  '2026-12-31': 'gerard-david-descanso-no-caminho-para-o-egito',
  '2027-01-01': 'rembrandt-van-rijn-a-circuncisao-de-jesus',
  '2027-01-02': 'ticiano-a-sagrada-familia-com-um-pastor',
  '2027-01-03': 'caravaggio-a-adoracao-dos-pastores',
  '2027-01-04': 'paul-hey-a-estrela-de-belem-der-stern-von-bethlehem-a-estrela-de-belem',
  '2027-01-05': 'bartolome-esteban-murillo-adoracao-dos-reis-magos',
  '2027-01-06': 'sandro-botticelli-a-adoracao-dos-magos',
};

describe('inicioDoAdvento', () => {
  it('é o domingo 4 semanas antes do Natal', () => {
    expect(inicioDoAdvento(2026)).toBe('2026-11-29');
    expect(inicioDoAdvento(2027)).toBe('2027-11-28');
    expect(inicioDoAdvento(2028)).toBe('2028-12-03');
    // Natal num domingo: o 4º domingo do Advento é 18/12.
    expect(inicioDoAdvento(2033)).toBe('2033-11-27');
  });

  it('sempre cai num domingo entre 27/11 e 03/12', () => {
    for (let ano = 2026; ano <= 2100; ano++) {
      const inicio = inicioDoAdvento(ano);
      expect(new Date(`${inicio}T00:00:00Z`).getUTCDay()).toBe(0);
      expect(inicio >= `${ano}-11-27` && inicio <= `${ano}-12-03`).toBe(true);
    }
  });
});

describe('getAdventPlanSlugs: 2026 aprovado em 20/11/2026', () => {
  const escolhida = (data: string) => getAdventPlanSlugs(data)?.[0];

  it('cobre do 1º domingo do Advento a 06/01, sem furo', () => {
    for (const dia of diasDe('2026-11-29', '2027-01-06')) {
      expect(getAdventPlanSlugs(dia), dia).toBeDefined();
    }
  });

  it('não cobre o dia anterior ao Advento nem o seguinte à Epifania', () => {
    expect(getAdventPlanSlugs('2026-11-28')).toBeUndefined();
    expect(getAdventPlanSlugs('2027-01-07')).toBeUndefined();
    expect(getAdventPlanSlugs('2026-09-03')).toBeUndefined();
  });

  it('segue a tabela aprovada', () => {
    expect(escolhida('2026-11-29')).toBe('gustave-dore-o-profeta-isaias');
    expect(escolhida('2026-12-06')).toBe('rembrandt-van-rijn-a-pregacao-de-joao-batista');
    expect(escolhida('2026-12-13')).toBe('alexander-ivanov-o-anjo-gabriel-aparece-a-zacarias');
    expect(escolhida('2026-12-17')).toBe('rembrandt-van-rijn-o-sonho-de-jose');
    expect(escolhida('2026-12-20')).toBe('fra-angelico-a-anunciacao');
    expect(escolhida('2026-12-22')).toBe('carl-bloch-a-visitacao');
    expect(escolhida('2026-12-23')).toBe('pieter-bruegel-o-velho-o-censo-em-belem');
    expect(escolhida('2026-12-24')).toMatch(/^michael-rieser-a-noite-antes/);
    expect(escolhida('2026-12-25')).toBe('antoon-van-dyck-natividade');
    expect(escolhida('2027-01-06')).toBe('sandro-botticelli-a-adoracao-dos-magos');
  });

  it('coincide, dia a dia, com a lista aprovada em 20/11/2026', () => {
    for (const [dia, slug] of Object.entries(PLANO_2026_APROVADO)) {
      expect(escolhida(dia), dia).toBe(slug);
    }
    expect(Object.keys(PLANO_2026_APROVADO)).toHaveLength(39);
  });

  it('a véspera de Natal, que não tem leitura cadastrada, tem obra', () => {
    expect(getAdventPlanSlugs('2026-12-24')).toBeDefined();
  });
});

describe('getAdventPlanSlugs: anos seguintes', () => {
  it('2027 usa a 2ª candidata dos dias fixos', () => {
    expect(getAdventPlanSlugs('2027-12-25')?.[0]).toBe('william-henry-margetson-o-primeiro-natal');
    expect(getAdventPlanSlugs('2027-12-20')?.[0]).toBe('leonardo-da-vinci-a-anunciacao');
  });

  it('cobre todos os dias e não repete obra dentro do ano, de 2026 a 2060', () => {
    for (let ano = 2026; ano <= 2060; ano++) {
      const dias = diasDe(inicioDoAdvento(ano), `${ano + 1}-01-06`);
      const escolhidas = dias.map((dia) => getAdventPlanSlugs(dia)?.[0]);
      expect(escolhidas.includes(undefined), `furo em ${ano}`).toBe(false);
      expect(new Set(escolhidas).size, `repetição em ${ano}`).toBe(escolhidas.length);
    }
  });

  it('o domingo seguinte é sempre o 1º domingo da semana 2, em qualquer ano', () => {
    for (let ano = 2026; ano <= 2040; ano++) {
      const segundoDomingo = new Date(Date.parse(`${inicioDoAdvento(ano)}T00:00:00Z`) + 7 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      expect(getAdventPlanSlugs(segundoDomingo)?.[0]).toMatch(/joao-batista/);
    }
  });

  it('entre dois anos seguidos poucas obras se repetem', () => {
    const doAno = (ano: number) =>
      new Set(diasDe(inicioDoAdvento(ano), `${ano + 1}-01-06`).map((d) => getAdventPlanSlugs(d)?.[0]));
    const a = doAno(2026);
    const b = doAno(2027);
    const repetidas = [...a].filter((slug) => b.has(slug)).length;
    expect(repetidas).toBeLessThanOrEqual(10);
  });
});

describe('SLUGS_DO_PLANO', () => {
  it('todos existem no catálogo exportado do cofre', () => {
    const exportado = JSON.parse(
      readFileSync(new URL('../../scripts/vault-export.json', import.meta.url), 'utf-8'),
    ) as { artworks: { slug: string }[] };
    const slugs = new Set(exportado.artworks.map((a) => a.slug));
    expect(SLUGS_DO_PLANO.filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  it('só tem slugs em formato de slug', () => {
    for (const slug of SLUGS_DO_PLANO) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});
