export interface Service {
  id: string;
  name: string;
  desc: string;
  mono: string;
  iconPath: string;
  route?: string;
}

export type OrderStatus =
  | "Aguardando aprovação"
  | "Em preparação"
  | "Solicitado"
  | "Pronto para entrega"
  | "Entregue"
  | "Finalizado"
  | "Cancelado"
  | "Recebido";

export interface CostCenterAllocation {
  code: string;
  percent: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  category: string;
  type: string;
  mono: string;
  qty: string;
  peopleCount?: number;
  datetime: string;
  status: OrderStatus;
  value: string;
  valueNumber?: number;
  items?: OrderItem[];
  eventName?: string;
  location?: string;
  eventTime?: string;
  pickupDate?: string;
  pickupTime?: string;
  coffeeInstructions?: string;
  dietaryRestrictions?: string;
  notes?: string;
  costCenters?: CostCenterAllocation[];
  requiresApproval?: boolean;
  managerApproved?: boolean;
  guApproved?: boolean;
  createdAt: string;
  history?: { label: string; time: string }[];
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time?: string;
}

export interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "NPS" | "Estrelas" | "Texto";
  active: boolean;
}

export interface Promo {
  id: string;
  tag: "NOVIDADE" | "PROMOÇÃO";
  title: string;
  desc: string;
  fullDesc?: string;
  validity?: string;
  terms?: string;
  ctaLabel: string;
  color: string;
  bg: string;
}

export interface WeeklyActivity {
  id: string;
  day: string;
  type: "Pedido" | "Favorito" | "Mensagem";
  text: string;
  time: string;
}

export const SUPPLIER_CATEGORIES = ["Alimentos e Bebidas", "Descartáveis", "Limpeza", "Decoração", "Serviços Gerais", "Outros"] as const;
export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  cnpj?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export const PRODUCT_TYPES = ["Bebida", "Salgado", "Doce", "Pão e Bolo", "Fruta", "Descartável", "Outro"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_UNITS = ["un", "kg", "L", "pacote", "caixa"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  unit: ProductUnit;
  price: number;
  description?: string;
  supplierId?: string;
  active: boolean;
}

export interface KitItem {
  productId: string;
  qty: number;
}

export interface Kit {
  id: string;
  name: string;
  description?: string;
  items: KitItem[];
  price?: number;
  active: boolean;
}

export const SERVICE_CATALOG_CATEGORIES = ["Limpeza", "Logística", "Organização de Eventos", "Recepção", "Outros"] as const;
export type ServiceCatalogCategory = (typeof SERVICE_CATALOG_CATEGORIES)[number];

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  category: ServiceCatalogCategory;
  active: boolean;
}
