import type { Kit, Product, ServiceCatalogItem } from "../types";

export interface KitContentLine {
  label: string;
  qty: number;
}

/** Resolve os itens (produtos + serviços) de um kit real do catálogo em linhas legíveis. */
export function kitContentsFromCatalog(kit: Pick<Kit, "items" | "serviceItems">, products: Product[], serviceCatalog: ServiceCatalogItem[]): KitContentLine[] {
  const productLines = kit.items.map((it) => ({
    label: products.find((p) => p.id === it.productId)?.name ?? "Produto removido",
    qty: it.qty,
  }));
  const serviceLines = (kit.serviceItems ?? []).map((it) => ({
    label: serviceCatalog.find((s) => s.id === it.serviceId)?.name ?? "Serviço removido",
    qty: it.qty,
  }));
  return [...productLines, ...serviceLines];
}
