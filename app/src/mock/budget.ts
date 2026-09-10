import type { CostCenter, CostCenterAllocation, Order } from "../types";

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Pedidos que contam para o consumo do mês corrente de um centro de custo (exclui cancelados). */
function ordersForBudgetPeriod(code: string, orders: Order[]): Order[] {
  const since = startOfMonth();
  return orders.filter((o) => {
    if (o.status === "Cancelado") return false;
    if (!o.costCenters?.some((cc) => cc.code === code)) return false;
    const created = o.createdAt ? new Date(o.createdAt) : null;
    return created ? created >= since : true;
  });
}

/** Total já consumido pelo centro de custo no mês corrente, rateado pelo percentual alocado em cada pedido. */
export function costCenterConsumption(code: string, orders: Order[]): number {
  return ordersForBudgetPeriod(code, orders).reduce((sum, o) => {
    const alloc = o.costCenters!.find((cc) => cc.code === code)!;
    return sum + (o.valueNumber ?? 0) * (alloc.percent / 100);
  }, 0);
}

/** Consumo do mês corrente agrupado por categoria de serviço (Coffee Break, Água, etc.). */
export function costCenterConsumptionByCategory(code: string, orders: Order[]): Record<string, number> {
  const byCategory: Record<string, number> = {};
  for (const o of ordersForBudgetPeriod(code, orders)) {
    const alloc = o.costCenters!.find((cc) => cc.code === code)!;
    const share = (o.valueNumber ?? 0) * (alloc.percent / 100);
    byCategory[o.category] = (byCategory[o.category] ?? 0) + share;
  }
  return byCategory;
}

/** Saldo restante do mês (null quando o centro de custo não tem orçamento configurado). */
export function costCenterRemainingBudget(costCenter: CostCenter, orders: Order[]): number | null {
  if (!costCenter.monthlyBudget) return null;
  return costCenter.monthlyBudget - costCenterConsumption(costCenter.code, orders);
}

/** Verifica se lançar `orderTotal` (rateado pelas alocações informadas) estouraria o saldo mensal
 * de algum dos centros de custo envolvidos. Sem orçamento configurado, nunca estoura. */
export function wouldExceedBudget(allocations: CostCenterAllocation[], orderTotal: number, costCenters: CostCenter[], orders: Order[]): boolean {
  return allocations.some((a) => {
    const cc = costCenters.find((c) => c.code === a.code);
    if (!cc?.monthlyBudget) return false;
    const consumed = costCenterConsumption(a.code, orders);
    const share = orderTotal * (a.percent / 100);
    return consumed + share > cc.monthlyBudget;
  });
}
