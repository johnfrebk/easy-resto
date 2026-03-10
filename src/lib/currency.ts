/** Formatea un número como moneda colombiana (COP) sin decimales, con separador de miles */
export function fmtCOP(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}
