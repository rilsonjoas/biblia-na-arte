import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PLATAFORMAS, urlRenovar, urlTrocar, urlMe, lerRenovacao } from './token-renewal.mjs';

describe('urlRenovar (refresh de token long-lived, sem app secret)', () => {
  test('Threads usa graph.threads.net com th_refresh_token', () => {
    const u = new URL(urlRenovar('threads', 'TOKEN+/='));
    assert.equal(u.origin + u.pathname, 'https://graph.threads.net/refresh_access_token');
    assert.equal(u.searchParams.get('grant_type'), 'th_refresh_token');
    assert.equal(u.searchParams.get('access_token'), 'TOKEN+/='); // codificado e decodificado sem perda
  });

  test('Instagram usa graph.instagram.com com ig_refresh_token', () => {
    const u = new URL(urlRenovar('instagram', 'abc'));
    assert.equal(u.origin + u.pathname, 'https://graph.instagram.com/refresh_access_token');
    assert.equal(u.searchParams.get('grant_type'), 'ig_refresh_token');
  });

  test('plataforma desconhecida é erro, não URL inventada', () => {
    assert.throws(() => urlRenovar('facebook', 'x'), /plataforma/i);
  });
});

describe('urlTrocar (short-lived -> long-lived, exige app secret)', () => {
  test('Threads: th_exchange_token com client_secret', () => {
    const u = new URL(urlTrocar('threads', 'curto', 'segredo'));
    assert.equal(u.origin + u.pathname, 'https://graph.threads.net/access_token');
    assert.equal(u.searchParams.get('grant_type'), 'th_exchange_token');
    assert.equal(u.searchParams.get('client_secret'), 'segredo');
    assert.equal(u.searchParams.get('access_token'), 'curto');
  });

  test('Instagram: ig_exchange_token', () => {
    const u = new URL(urlTrocar('instagram', 'curto', 's'));
    assert.equal(u.searchParams.get('grant_type'), 'ig_exchange_token');
  });
});

describe('urlMe', () => {
  test('pede id e username na versão fixa da API', () => {
    assert.match(urlMe('threads', 't'), /^https:\/\/graph\.threads\.net\/v1\.0\/me\?fields=id,username&access_token=t$/);
    assert.match(urlMe('instagram', 't'), /^https:\/\/graph\.instagram\.com\/v21\.0\/me\?fields=id,username&access_token=t$/);
  });
});

describe('lerRenovacao (interpreta a resposta da Meta)', () => {
  test('sucesso: devolve o token novo e os dias até vencer', () => {
    const r = lerRenovacao({ access_token: 'NOVO', token_type: 'bearer', expires_in: 5184000 });
    assert.deepEqual(r, { ok: true, token: 'NOVO', dias: 60 });
  });

  test('arredonda os dias para baixo (nunca promete mais do que tem)', () => {
    assert.equal(lerRenovacao({ access_token: 'N', expires_in: 86399 }).dias, 0);
    assert.equal(lerRenovacao({ access_token: 'N', expires_in: 86400 * 2 + 5 }).dias, 2);
  });

  test('erro da Meta vira motivo legível, sem eco de token', () => {
    const r = lerRenovacao({ error: { message: 'Session has expired', code: 190, error_subcode: 463 } });
    assert.equal(r.ok, false);
    assert.match(r.motivo, /190/);
    assert.match(r.motivo, /Session has expired/);
  });

  test('resposta sem access_token nem erro é falha, não sucesso vazio', () => {
    assert.equal(lerRenovacao({}).ok, false);
    assert.equal(lerRenovacao(null).ok, false);
  });

  test('token novo vazio ou sem expires_in não é aceito', () => {
    assert.equal(lerRenovacao({ access_token: '', expires_in: 100 }).ok, false);
    assert.equal(lerRenovacao({ access_token: 'N' }).ok, false);
  });
});

test('PLATAFORMAS lista o nome do secret de cada uma', () => {
  assert.equal(PLATAFORMAS.threads.secret, 'THREADS_ACCESS_TOKEN');
  assert.equal(PLATAFORMAS.instagram.secret, 'INSTAGRAM_ACCESS_TOKEN');
});
