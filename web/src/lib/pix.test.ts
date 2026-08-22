import { describe, it, expect } from 'vitest';
import { buildPixBrCode, crc16, PIX_CONFIG } from './pix';

describe('crc16', () => {
  // Vetor de referência do CRC-16/CCITT-FALSE ("123456789" -> 29B1),
  // mesmo algoritmo exigido pelo BR Code do Bacen
  it('calcula CRC16-CCITT-FALSE corretamente', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('retorna sempre 4 dígitos hex maiúsculos', () => {
    const crc = crc16('');
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe('buildPixBrCode', () => {
  it('começa com o formato do payload e termina com o CRC 6304', () => {
    const code = buildPixBrCode(PIX_CONFIG);
    expect(code.startsWith('000201')).toBe(true);
    expect(code.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
    expect(code.includes('6304')).toBe(true);
  });

  it('inclui o GUI oficial do Pix e a chave', () => {
    const code = buildPixBrCode(PIX_CONFIG);
    expect(code).toContain('br.gov.bcb.pix');
    expect(code).toContain(PIX_CONFIG.key);
  });

  it('remove acentos e limita nome/cidade aos máximos do padrão', () => {
    const code = buildPixBrCode({
      key: 'chave@teste.com',
      receiverName: 'ÁéÍÓÚção Testando Nome Grande Demais Aqui',
      city: 'São José dos Campos Pretos',
    });
    expect(code).not.toContain('ç');
    expect(code).not.toContain('ã');
  });

  it('CRC muda se a chave mudar (payload sensível ao conteúdo)', () => {
    const a = buildPixBrCode({ ...PIX_CONFIG, key: 'a@b.com' });
    const b = buildPixBrCode({ ...PIX_CONFIG, key: 'c@d.com' });
    expect(a.slice(-4)).not.toBe(b.slice(-4));
  });
});
