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
