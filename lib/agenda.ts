// Horário de São Paulo (UTC-3 fixo, sem horário de verão desde 2019)
const OFFSET_SP_H = 3;
const REPUBLICAR_APOS_DIAS = 20;
export const LIMITE_POR_TIPO = { threads: 500, telegram: 1024, default: 2000 } as const;

export function diaSP(agora: Date) {
  const s = new Date(agora.getTime() - OFFSET_SP_H * 3600e3);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate() };
}

export function horarioSP(dia: { y: number; m: number; d: number }, hhmm: string) {
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(dia.y, dia.m, dia.d, h + OFFSET_SP_H, mi));
}

export function diasDoPeriodo(periodo: string, dias: number | undefined, agora: Date) {
  const hoje = diaSP(agora);
  const base = (n: number) => {
    const d = new Date(Date.UTC(hoje.y, hoje.m, hoje.d + n));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
  };
  if (periodo === "hoje") return [base(0)];
  if (periodo === "amanha") return [base(1)];
  if (periodo === "semana") {
    const dow = new Date(Date.UTC(hoje.y, hoje.m, hoje.d)).getUTCDay(); // 0 = domingo
    const restantes = dow === 0 ? 1 : 8 - dow;
    return Array.from({ length: restantes }, (_, i) => base(i));
  }
  if (periodo === "dias") return Array.from({ length: dias ?? 2 }, (_, i) => base(i));
  // "todos": janela de 30 dias, renovada pela programação
  return Array.from({ length: 30 }, (_, i) => base(i));
}

export function republicarAposDias() {
  return REPUBLICAR_APOS_DIAS;
}
