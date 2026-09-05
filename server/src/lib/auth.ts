import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Hash de senha via scrypt nativo do Node — sem dependência nova só pra
// isso (painel administrativo, roadmap 2026-09-05). Formato do hash
// armazenado: "salt:hash", ambos em hex, pra guardar tudo numa coluna só
// sem precisar de uma segunda pra salt.
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = scryptSync(password, salt, KEY_LENGTH);

  // timingSafeEqual exige buffers do mesmo tamanho — um hash com
  // tamanho diferente (formato corrompido/antigo) já não é válido,
  // sem vazar isso por diferença de tempo de execução.
  if (hashBuffer.length !== candidateBuffer.length) return false;

  return timingSafeEqual(hashBuffer, candidateBuffer);
}
