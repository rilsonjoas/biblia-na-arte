// Configuração e geração do Pix estático (BR Code EMV do Bacen).
//
// Mesmo padrão do Lecionário (lecionario-web/src/lib/pix.ts), copiado
// pra cá conforme registrado no ROADMAP.md — chave dedicada ao projeto,
// já criada (2026-08-22): biblianaarte@narniano.com. O campo 59 do
// padrão limita o nome a 25 caracteres — usamos a forma curta; na
// confirmação o banco exibe o nome completo do titular registrado de
// qualquer forma (o campo é cosmético, quem manda é o DICT).
export const PIX_CONFIG = {
  key: 'biblianaarte@narniano.com',
  receiverName: 'Rilson Joás Guedes',
  city: 'Recife',
} as const;

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) — exigido pelo padrão EMV BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Campo ID-Length-Value do padrão EMV. */
function tlv(id: string, value: string): string {
  const len = value.length.toString(16).toUpperCase().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Monta o payload "Copia e Cola" do Pix estático (BR Code):
 * https://www.bcb.gov.br/estabilidadefinanceira/pix (padrão EMV-QRCPS-MPM).
 * Sem valor fixado — quem doa escolhe quanto.
 */
// Entrada como strings soltas pra permitir overrides em testes
export function buildPixBrCode({
  key,
  receiverName,
  city,
}: {
  key: string;
  receiverName: string;
  city: string;
}): string {
  const sanitize = (s: string, max: number) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '')
      .slice(0, max);

  const merchantAccount = tlv('00', 'br.gov.bcb.pix') + tlv('01', key.slice(0, 77));

  const payload =
    tlv('00', '01') +
    tlv('26', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('58', 'BR') +
    tlv('59', sanitize(receiverName, 25)) +
    tlv('60', sanitize(city, 15)) +
    '6304';

  return payload + crc16(payload);
}
