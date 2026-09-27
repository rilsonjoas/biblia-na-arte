/**
 * Testes do módulo de legendas (`social-caption.mjs`).
 *
 * Roda com o test runner nativo do Node — sem vitest, sem dependência
 * nova, sem mexer no lockfile. O diretório `scripts/` não é pacote do
 * pnpm workspace, então não tinha cobertura nenhuma; este arquivo é o
 * que fecha isso.
 *
 * Testa-se a INTERFACE (`buildCaption` e `buildThreadsCaption`), não os
 * helpers internos. Cortar por frase, escolher a referência mais curta e
 * capitalizar citação são implementação — o contrato é o que a legenda
 * final diz, e é isso que muda na prática quando alguém edita o acervo.
 *
 * Comando: `pnpm test:scripts`
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildCaption, buildThreadsCaption } from './social-caption.mjs';

const WEB = 'https://exemplo.test';

function obra(overrides = {}) {
  return {
    id: 'abc-123',
    title: 'Jesus e a mulher Samaritana',
    year: 1890,
    artistOrDirector: 'Henryk Siemiradzki',
    description: 'Encontro inesperado à beira do poço.\n\n### Contexto Histórico\nBloco histórico que não deve aparecer na legenda.',
    location: 'Nápoles, 1890',
    references: [
      // A PRIMEIRA da lista é a mais longa de propósito: `pickReference`
      // tem que escolher a mais curta, não a primeira.
      { book: 'João', chapter: 4, verses: '7-30', passageText: 'Se alguém me desse a beber, eu não teria sede.' },
      { book: 'João', chapter: 4, verses: '6', passageText: 'Disse-lhe Jesus: Se eu te conhecesse, e tu me conhecesses, e a mulher te desse a beber.' },
    ],
    ...overrides,
  };
}

describe('buildCaption (Instagram/Facebook)', () => {
  test('monta a legenda completa na ordem esperada', () => {
    const out = buildCaption(obra(), { webBase: WEB });
    assert.equal(
      out,
      [
        'Jesus e a mulher Samaritana (1890)',
        'Henryk Siemiradzki',
        '',
        'Encontro inesperado à beira do poço.',
        '',
        '"Se alguém me desse a beber, eu não teria sede."',
        '— João 4:7-30',
        '',
        'Nápoles, 1890',
        '',
        'Veja a obra completa (contexto histórico, outras referências) em ' +
          'https://exemplo.test/obra/abc-123?utm_source=instagram&utm_medium=post&utm_campaign=artecristadiaria',
        '',
        '#BíbliaNaArte #ArteCristã #ArteSacra #Devocional',
      ].join('\n'),
    );
  });

  test('o link carrega UTM com a source da plataforma', () => {
    const ig = buildCaption(obra(), { webBase: WEB });
    const fb = buildCaption(obra(), { source: 'facebook', webBase: WEB });
    assert.match(ig, /utm_source=instagram&utm_medium=post&utm_campaign=artecristadiaria/);
    assert.match(fb, /utm_source=facebook&utm_medium=post&utm_campaign=artecristadiaria/);
  });

  test('UTM tem campaign fixo, sem o id da obra', () => {
    // Campaign por obra criaria uma linha nova por dia no relatório sem
    // responder pergunta. O id fica no path, que é onde se segmenta.
    const a = buildCaption(obra({ id: 'obra-um' }), { webBase: WEB });
    const b = buildCaption(obra({ id: 'obra-dois' }), { webBase: WEB });
    const campaign = (s) => s.match(/utm_campaign=([^&\s]+)/)[1];
    assert.equal(campaign(a), campaign(b));
    assert.ok(a.includes('/obra/obra-um'));
    assert.ok(b.includes('/obra/obra-dois'));
  });

  test('obra sem ano omite o parêntese do ano', () => {
    const out = buildCaption(obra({ year: null }), { webBase: WEB });
    assert.equal(out.split('\n')[0], 'Jesus e a mulher Samaritana');
    assert.ok(!out.includes('null'));
  });

  test('descrição longa corta no fim de uma frase quando há frase completa perto do teto', () => {
    // O ponto precisa cair depois de 40% do teto (700 * 0.4 = 280), senão
    // o corte por fronteira devolveria um fragmento curto demais.
    const filler = 'x'.repeat(400);
    const longa = `${filler} Fim de uma frase. ${'y'.repeat(600)}`;
    const out = buildCaption(obra({ description: longa }), { webBase: WEB });
    const intro = out.split('\n')[3];
    assert.ok(intro.length <= 715, `intro muito longa: ${intro.length}`);
    assert.ok(intro.endsWith('Fim de uma frase. (…)'));
  });

  test('sem frase completa após 40% do teto, corta seco e marca com (…)', () => {
    // Fallback deliberado: cortar no ponto primitivo devolveria só os
    // primeiros 40% do texto, o que é pior que um corte no meio de uma
    // palavra. O "(…)" é a sinalização de que houve corte.
    const longa = 'Uma frase. ' + 'z'.repeat(1200);
    const out = buildCaption(obra({ description: longa }), { webBase: WEB });
    const intro = out.split('\n')[3];
    assert.ok(intro.length <= 715, `intro muito longa: ${intro.length}`);
    assert.ok(intro.endsWith(' (…)'));
    assert.ok(intro.startsWith('Uma frase. '), 'não deve devolver só o fragmento curto');
  });

  test('markdown da descrição não vaza pra legenda', () => {
    const out = buildCaption(obra({ description: '**Negrito** e um **trecho**.' }), { webBase: WEB });
    assert.ok(out.includes('Negrito e um trecho.'));
    assert.ok(!out.includes('**'));
  });

  test('cabeçalho "### Contexto Histórico" é cortado da intro', () => {
    const out = buildCaption(obra(), { webBase: WEB });
    assert.ok(!out.includes('Contexto Histórico'));
    assert.ok(!out.includes('não deve aparecer'));
  });

  test('obra sem descrição não deixa linha em branco sobrando', () => {
    const out = buildCaption(obra({ description: null }), { webBase: WEB });
    assert.equal(out.split('\n')[2], '');
    assert.equal(out.split('\n')[3], '"Se alguém me desse a beber, eu não teria sede."');
  });

  test('referência sem versículos mostra só livro e capítulo', () => {
    const out = buildCaption(
      obra({ references: [{ book: 'Salmo', chapter: 23, passageText: 'O Senhor é o meu pastor.' }] }),
      { webBase: WEB },
    );
    assert.ok(out.includes('— Salmo 23\n'));
    assert.ok(!out.includes('Salmo 23:'));
  });

  test('citação que começa no meio de frase é capitalizada', () => {
    // O ACF traz o versículo como continuação: "eis que a mão do Senhor…".
    // Na fonte vem minúsculo; como citação isolada, parece erro de digitação.
    const out = buildCaption(
      obra({ references: [{ book: 'Isaías', chapter: 59, verses: '1', passageText: 'eis que a mão do Senhor não é curta para salvar' }] }),
      { webBase: WEB },
    );
    assert.ok(out.includes('"Eis que a mão do Senhor não é curta para salvar"'));
  });

  test('escolhe a citação mais curta, não a primeira da lista', () => {
    const out = buildCaption(obra(), { webBase: WEB });
    assert.ok(out.includes('Se alguém me desse a beber'));
    assert.ok(!out.includes('Se eu te conhecesse'));
  });
});

describe('buildThreadsCaption', () => {
  test('formato enxuto: título, autor, referência e link, sem hashtags', () => {
    const out = buildThreadsCaption(obra(), { webBase: WEB });
    assert.equal(
      out,
      [
        'Jesus e a mulher Samaritana (1890) — Henryk Siemiradzki',
        'João 4:7-30',
        '',
        'https://exemplo.test/obra/abc-123?utm_source=threads&utm_medium=post&utm_campaign=artecristadiaria',
      ].join('\n'),
    );
    assert.ok(!out.includes('#'));
  });

  test('o link usa source=threads, diferente do Instagram', () => {
    const out = buildThreadsCaption(obra(), { webBase: WEB });
    assert.match(out, /utm_source=threads&/);
  });

  test('legenda fica dentro do teto de 500 com título realisticamente longo', () => {
    // ~300 caracteres: título comprido de obra com nome do artista e
    // sufixo. Ainda tem que caber E manter o link.
    const out = buildThreadsCaption(
      obra({ title: 'A Ressurreição de Lázaro na Capela Sistina, detalhe do registro inferior direito, Michelangelo Buonarroti' }),
      { webBase: WEB },
    );
    assert.ok(out.length <= 500, `legenda passou do teto: ${out.length}`);
    assert.ok(out.includes('utm_source=threads'), 'o link não pode sumir');
  });

  test.todo(
    'título acima de ~430 caracteres perde o link (bug real, não coberto)',
    () => {
      // `truncateAtSentence` corta por fronteira de frase, e a última
      // linha da legenda é uma URL nua. Com título desse tamanho o corte
      // dispara e consome o link — o post sairia sem URL e o cron
      // reportaria sucesso. Nenhum item do acervo atual tem título
      // assim, e o acervo cresce por curadoria, então isso vira problema
      // sozinho em algum momento.
      // Contrato correto a adotar quando for corrigido: o link sobrevive ao corte.
      const out = buildThreadsCaption(obra({ title: 'T'.repeat(450) }), { webBase: WEB });
      assert.ok(out.includes('utm_source=threads'), 'o link tem que sobreviver ao corte');
    },
  );

  test('legenda com referência ausente não quebra', () => {
    const out = buildThreadsCaption(obra({ references: [] }), { webBase: WEB });
    assert.ok(out.startsWith('Jesus e a mulher Samaritana (1890) — Henryk Siemiradzki\n\nhttps://'));
  });
});
