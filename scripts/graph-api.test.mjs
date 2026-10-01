import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isGraphErrorTransient, graphPost, waitForContainerReady, parsePlatforms } from './graph-api.mjs';

/** Resposta falsa da Graph API, com o formato que a Meta devolve. */
function res({ ok = true, status = 200, body = {} } = {}) {
  return { ok, status, json: async () => body };
}

describe('isGraphErrorTransient', () => {
  test('trata code 190 (token morto) como definitivo, nunca retenta', () => {
    // 2026-09-07 e 09-11: sessão invalidada. Retentar aqui só gasta 20s e
    // mascara a causa real.
    assert.equal(isGraphErrorTransient({ error: { code: 190, message: 'Invalid OAuth token' } }, 401), false);
  });

  test('190 ganha mesmo que a Meta marque is_transient', () => {
    // O 190 é o único caso em que sabemos que retentar não adianta, então
    // tem precedência sobre qualquer flag.
    assert.equal(isGraphErrorTransient({ error: { code: 190, is_transient: true } }, 500), false);
  });

  test('retenta o que a Meta marca is_transient', () => {
    assert.equal(isGraphErrorTransient({ error: { is_transient: true } }, 400), true);
  });

  test('retenta code 2 (Threads 500)', () => {
    assert.equal(isGraphErrorTransient({ error: { code: 2 } }, 500), true);
  });

  test('retenta o subcode 4279009 (Media Not Found) mesmo com is_transient false', () => {
    // 2026-09-18 e 09-27. A Meta diz que não é transitório; sumiu esperando.
    const body = { error: { error_subcode: 4279009, is_transient: false } };
    assert.equal(isGraphErrorTransient(body, 400), true);
  });

  test('retenta o subcode 2207027 (Instagram, mídia ainda não pronta) mesmo com is_transient false', () => {
    // 2026-10-01: container respondeu FINISHED e o media_publish, 0,26s
    // depois, voltou 9007/2207027 "The media is not ready for publishing".
    const body = { error: { code: 9007, error_subcode: 2207027, is_transient: false } };
    assert.equal(isGraphErrorTransient(body, 400), true);
  });

  test('retenta 5xx com corpo que não traz error', () => {
    assert.equal(isGraphErrorTransient({}, 503), true);
    assert.equal(isGraphErrorTransient(undefined, 500), true);
  });

  test('não retenta 4xx comum', () => {
    assert.equal(isGraphErrorTransient({ error: { code: 100, message: 'param inválido' } }, 400), false);
    assert.equal(isGraphErrorTransient({}, 404), false);
  });

  test('não retenta o que é sucesso nem corpo sem erro', () => {
    assert.equal(isGraphErrorTransient({ id: '123' }, 200), false);
    assert.equal(isGraphErrorTransient(null, undefined), false);
  });
});

describe('graphPost', () => {
  test('monta a URL com os params e devolve o body no primeiro sucesso', async () => {
    let chamada = null;
    const out = await graphPost('https://graph/x', '/123/media', { image_url: 'https://a/b.webp', caption: 'oi' }, {
      fetchImpl: async (url, init) => {
        chamada = { url: String(url), init };
        return res({ body: { id: '99' } });
      },
    });
    assert.deepEqual(out, { id: '99' });
    assert.equal(chamada.url, 'https://graph/x/123/media?image_url=https%3A%2F%2Fa%2Fb.webp&caption=oi');
    assert.equal(chamada.init.method, 'POST');
  });

  test('gasta tentativas no transitório e devolve assim que passa', async () => {
    let n = 0;
    const dormiu = [];
    const out = await graphPost('https://graph/x', '/media', {}, {
      fetchImpl: async () => {
        n += 1;
        return n < 3
          ? res({ ok: false, status: 500, body: { error: { code: 2 } } })
          : res({ body: { id: 'ok' } });
      },
      sleepImpl: async (ms) => { dormiu.push(ms); },
    });
    assert.deepEqual(out, { id: 'ok' });
    assert.equal(n, 3);
    assert.deepEqual(dormiu, [5000, 5000]);
  });

  test('aborta na hora no 190, sem gastar tentativa nem dormir', async () => {
    let n = 0;
    let dormiu = false;
    await assert.rejects(
      () => graphPost('https://graph/x', '/media', {}, {
        fetchImpl: async () => {
          n += 1;
          return res({ ok: false, status: 401, body: { error: { code: 190 } } });
        },
        sleepImpl: async () => { dormiu = true; },
      }),
      /falhou \(401\)/,
    );
    assert.equal(n, 1);
    assert.equal(dormiu, false);
  });

  test('lança depois de estourar as tentativas, com o último erro', async () => {
    let n = 0;
    await assert.rejects(
      () => graphPost('https://graph/x', '/media', {}, {
        fetchImpl: async () => {
          n += 1;
          return res({ ok: false, status: 500, body: { error: { code: 2, msg: `tentativa ${n}` } } });
        },
        sleepImpl: async () => {},
        maxAttempts: 4,
        retryDelayMs: 1,
      }),
      /definitivamente após 4 tentativas/,
    );
    assert.equal(n, 4);
  });

  test('respeita maxAttempts e retryDelayMs customizados', async () => {
    const dormiu = [];
    await assert.rejects(() => graphPost('https://graph/x', '/m', {}, {
      fetchImpl: async () => res({ ok: false, status: 503, body: {} }),
      sleepImpl: async (ms) => { dormiu.push(ms); },
      maxAttempts: 2,
      retryDelayMs: 250,
    }));
    assert.deepEqual(dormiu, [250]);
  });
});

describe('waitForContainerReady', () => {
  test('volta assim que vê FINISHED', async () => {
    let n = 0;
    const ok = await waitForContainerReady('https://graph/x', 'cid', 'tok', 'status_code', {
      fetchImpl: async () => {
        n += 1;
        return res({ body: { status_code: n < 2 ? 'IN_PROGRESS' : 'FINISHED' } });
      },
      sleepImpl: async () => {},
      delayMs: 1,
    });
    assert.equal(ok, true);
    assert.equal(n, 2);
  });

  test('lança se o container vier em ERROR', async () => {
    await assert.rejects(
      () => waitForContainerReady('https://graph/x', 'cid', 'tok', 'status', {
        fetchImpl: async () => res({ body: { status: 'ERROR', error_message: 'bad' } }),
        sleepImpl: async () => {},
      }),
      /Container de mídia falhou/,
    );
  });

  test('consulta o campo de status que a plataforma usa e manda o token', async () => {
    // Instagram usa status_code, Threads usa status. O campo errado aqui
    // é o que faria o poll nunca achar FINISHED.
    let urlVisto = null;
    await waitForContainerReady('https://graph/x', 'cid', 'tok', 'status_code', {
      fetchImpl: async (url) => {
        urlVisto = String(url);
        return res({ body: { status_code: 'FINISHED' } });
      },
    });
    assert.ok(urlVisto.includes('fields=status_code'), urlVisto);
    assert.ok(urlVisto.includes('access_token=tok'), urlVisto);
  });

  test('devolve false em vez de travar se nunca confirmar (rede de segurança)', async () => {
    let n = 0;
    const ok = await waitForContainerReady('https://graph/x', 'cid', 'tok', 'status', {
      fetchImpl: async () => {
        n += 1;
        return res({ body: { status: 'IN_PROGRESS' } });
      },
      sleepImpl: async () => {},
      attempts: 3,
      delayMs: 1,
    });
    assert.equal(ok, false);
    assert.equal(n, 3);
  });
});

describe('parsePlatforms', () => {
  test('default é todas as três', () => {
    assert.deepEqual([...parsePlatforms(undefined)].sort(), ['facebook', 'instagram', 'threads']);
  });

  test('aceita subconjunto, que é como se testa uma plataforma sem duplicar post', () => {
    assert.deepEqual([...parsePlatforms('threads')], ['threads']);
    assert.deepEqual([...parsePlatforms(' instagram , threads ')].sort(), ['instagram', 'threads']);
  });

  test('ignora nome desconhecido em vez de tentar publicar nele', () => {
    assert.deepEqual([...parsePlatforms('instagram,mastodon')], ['instagram']);
  });

  test('devolve conjunto vazio quando nada é válido, para o caller recusar', () => {
    // Publicar em zero plataformas e sair com 0 seria job verde sem post.
    assert.deepEqual([...parsePlatforms('mastodon')], []);
  });
});
