/** Preço de venda = custo + margem negociada em contrato (editável no MVP). */
export function computeProductPrice(costPrice: number, marginPercent: number): number {
  return costPrice * (1 + marginPercent / 100);
}

/** Preço do kit = soma dos preços finais dos itens + taxa de serviço (editável no MVP). */
export function computeKitPrice(itemsTotal: number, serviceFeePercent: number): number {
  return itemsTotal * (1 + serviceFeePercent / 100);
}
