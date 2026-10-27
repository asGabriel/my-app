/** Formatação de valores com suporte ao modo privado (oculta valores),
 * usado nas telas do Controle Mensal. */

export function money(value: number, privado: boolean): string {
  if (privado) return '•• •••';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function short(value: number, privado: boolean): string {
  if (privado) return '••••';
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}

/** Rótulo curto para barras de gráfico: "850", "1,2k", "12k". */
export function compact(value: number, privado: boolean): string {
  if (privado) return '•';
  if (Math.abs(value) < 1000) return String(Math.round(value));
  const k = value / 1000;
  return `${k.toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(k) < 10 ? 1 : 0 })}k`;
}
