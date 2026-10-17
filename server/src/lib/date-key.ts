/** 'YYYY-MM-DD' que existe no calendário (rejeita 2026-13-45 e 2027-02-29). O formato sozinho não
 *  basta: a data impossível passava na regex, chegava ao SQL e o Postgres a rejeitava, o que virava
 *  `500 internal_error` para um erro do cliente em `/artworks/daily?date=2026-13-45`. O Lecionário e o
 *  Scriptorium respondem 400 nesse caso (hetzner-infra/CONTRATOS-ENTRE-PROJETOS.md, 5.1). Mesma regra
 *  nos dois, sem pacote compartilhado (padrão de duplicação do cluster). */
export function isValidDateKey(dateKey: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}
