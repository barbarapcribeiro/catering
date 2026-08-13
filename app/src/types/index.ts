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
  /** Status do fechamento financeiro do pedido — controlado na tela de Faturamento. */
  billingStatus?: "Pendente" | "Fechado" | "Enviado ao ERP";
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
  /** Preço de custo (o que a Sodexo paga ao fornecedor). */
  costPrice: number;
  /** Margem negociada em contrato, em % sobre o custo. Editável no MVP; futuramente deve vir do contrato. */
  marginPercent: number;
  /** Preço de venda final usado no pedido — derivado de costPrice * (1 + marginPercent/100). */
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
  /** Taxa de serviço aplicada sobre a soma dos itens, em %. Editável no MVP. */
  serviceFeePercent: number;
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

/** Todas as páginas/subpáginas do app, usadas nas telas de Perfis e Permissões. */
export interface AppPageDef {
  id: string;
  label: string;
  group: "Área do colaborador" | "Painel Administrativo";
}

export const APP_PAGES: AppPageDef[] = [
  { id: "home", label: "Home", group: "Área do colaborador" },
  { id: "pedido-coffee", label: "Novo Pedido · Coffee Break", group: "Área do colaborador" },
  { id: "pedido-evento", label: "Novo Pedido · Evento Especial", group: "Área do colaborador" },
  { id: "pedido-agua", label: "Novo Pedido · Água", group: "Área do colaborador" },
  { id: "pedido-abastecimento", label: "Novo Pedido · Abastecimento Simples", group: "Área do colaborador" },
  { id: "surpreenda", label: "Surpreenda", group: "Área do colaborador" },
  { id: "pedidos", label: "Gerenciar Pedidos", group: "Área do colaborador" },
  { id: "producao", label: "Produção", group: "Área do colaborador" },
  { id: "fique-por-dentro", label: "Fique por Dentro", group: "Área do colaborador" },
  { id: "aprovacoes", label: "Aprovações", group: "Área do colaborador" },
  { id: "admin-operacao", label: "Operação (dashboard)", group: "Painel Administrativo" },
  { id: "admin-relatorios", label: "Relatórios", group: "Painel Administrativo" },
  { id: "admin-produtos", label: "Catálogos · Produtos", group: "Painel Administrativo" },
  { id: "admin-kits", label: "Catálogos · Kits", group: "Painel Administrativo" },
  { id: "admin-servicos", label: "Catálogos · Serviços", group: "Painel Administrativo" },
  { id: "admin-fornecedores", label: "Catálogos · Fornecedores", group: "Painel Administrativo" },
  { id: "admin-pesquisa", label: "Configurar Pesquisa de Satisfação", group: "Painel Administrativo" },
  { id: "admin-usuarios", label: "Pessoas · Usuários", group: "Painel Administrativo" },
  { id: "admin-permissoes", label: "Pessoas · Perfis e Permissões", group: "Painel Administrativo" },
  { id: "admin-faturamento", label: "Financeiro · Faturamento", group: "Painel Administrativo" },
  { id: "admin-centros-custo", label: "Financeiro · Centros de Custo", group: "Painel Administrativo" },
  { id: "admin-ocorrencias", label: "Ocorrências", group: "Painel Administrativo" },
];

/**
 * Nível de permissão por página. "elementos" da tela (botões de aprovar,
 * editar, excluir etc.) são modelados como estas 4 ações — granularidade
 * padrão de sistemas de permissão, em vez de cada elemento individual.
 */
export interface PagePermission {
  ver: boolean;
  criarEditar: boolean;
  aprovar: boolean;
  excluir: boolean;
}

export const EMPTY_PAGE_PERMISSION: PagePermission = { ver: false, criarEditar: false, aprovar: false, excluir: false };

export interface Profile {
  id: string;
  name: string;
  /** "Quem é" — descrição da persona. */
  whoIs?: string;
  /** "O que faz na solução". */
  responsibilities?: string;
  permissions: Record<string, PagePermission>;
  active: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  profileId?: string;
  active: boolean;
  createdAt: string;
  lastPasswordResetAt?: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  manager?: string;
  active: boolean;
}

export const OCCURRENCE_TYPES = ["Atraso na entrega", "Item incorreto ou faltando", "Qualidade do produto", "Problema de atendimento", "Outro"] as const;
export type OccurrenceType = (typeof OCCURRENCE_TYPES)[number];

export const OCCURRENCE_SEVERITIES = ["Baixa", "Média", "Alta"] as const;
export type OccurrenceSeverity = (typeof OCCURRENCE_SEVERITIES)[number];

export const OCCURRENCE_STATUSES = ["Aberta", "Em análise", "Resolvida", "Cancelada"] as const;
export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

export interface Occurrence {
  id: string;
  orderId?: string;
  type: OccurrenceType;
  severity: OccurrenceSeverity;
  status: OccurrenceStatus;
  description: string;
  reportedBy?: string;
  createdAt: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export const BILLING_STATUSES = ["Pendente", "Fechado", "Enviado ao ERP"] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];
