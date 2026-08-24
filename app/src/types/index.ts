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
  /** Referencia o Produto real do catálogo (quando o item veio de lá), usado no relatório de Lucro por Produto. */
  productId?: string;
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

/** Tipos de pedido do cliente — cada um tem seu próprio conjunto de perguntas de satisfação. */
export const ORDER_CATEGORIES = ["Coffee Break", "Evento Especial", "Solicitação de Água", "Abastecimento Simples", "Surpreenda"] as const;
export type OrderCategoryName = (typeof ORDER_CATEGORIES)[number];

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "NPS" | "Estrelas" | "Texto";
  active: boolean;
  /** A qual tipo de pedido essa pergunta pertence — a pesquisa de satisfação é própria por tipo. */
  orderCategory: OrderCategoryName;
}

export type SurveyKind = "pedido" | "aplicacao";

export interface SurveyResponseAnswer {
  questionId: string;
  value: number | string;
}

/** Uma resposta completa a um dos dois formulários (pesquisa do pedido ou da aplicação). */
export interface SurveyResponse {
  id: string;
  kind: SurveyKind;
  /** Preenchido apenas para kind "pedido". */
  orderId?: string;
  answers: SurveyResponseAnswer[];
  createdAt: string;
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
  /** Preço de custo (o que a Direct Eventos paga ao fornecedor). */
  costPrice: number;
  /** Margem negociada em contrato, em % sobre o custo. Editável no MVP; futuramente deve vir do contrato. */
  marginPercent: number;
  /** Preço de venda final usado no pedido — derivado de costPrice * (1 + marginPercent/100). */
  price: number;
  description?: string;
  supplierId?: string;
  /** Foto do produto (data URL ou link), exibida no catálogo e no pedido. */
  photoUrl?: string;
  active: boolean;
}

export interface KitItem {
  productId: string;
  qty: number;
}

export interface KitServiceItem {
  serviceId: string;
  qty: number;
}

export interface Kit {
  id: string;
  name: string;
  description?: string;
  items: KitItem[];
  /** Serviços incluídos no kit (opcional), além dos produtos. */
  serviceItems?: KitServiceItem[];
  /** Taxa de serviço aplicada sobre a soma dos itens, em %. Editável no MVP. */
  serviceFeePercent: number;
  /** Foto do kit (data URL ou link), exibida no catálogo e no pedido. */
  photoUrl?: string;
  active: boolean;
}

export const SERVICE_CATALOG_CATEGORIES = ["Limpeza", "Logística", "Organização de Eventos", "Recepção", "Outros"] as const;
export type ServiceCatalogCategory = (typeof SERVICE_CATALOG_CATEGORIES)[number];

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  category: ServiceCatalogCategory;
  /** Preço do serviço, usado quando incluído em kits e eventos premium. */
  price: number;
  active: boolean;
}

export const DECORATION_CATEGORIES = ["Mesa e Ambientação", "Flores e Arranjos", "Iluminação", "Painéis e Backdrop", "Balões", "Outros"] as const;
export type DecorationCategory = (typeof DECORATION_CATEGORIES)[number];

export interface Decoration {
  id: string;
  name: string;
  description?: string;
  category: DecorationCategory;
  price: number;
  photoUrl?: string;
  active: boolean;
}

export const POPUP_TEXT_MAX_LENGTH = 500;

/** Pop-up de comunicação exibido para os perfis selecionados ao acessarem o app. */
export interface Popup {
  id: string;
  text: string;
  imageUrl?: string;
  active: boolean;
  profileIds: string[];
  createdAt: string;
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
  { id: "eventos-premium", label: "Eventos Premium", group: "Área do colaborador" },
  { id: "pesquisa-app", label: "Pesquisa da Aplicação (responder)", group: "Área do colaborador" },
  { id: "admin-relatorios", label: "Relatórios", group: "Painel Administrativo" },
  { id: "admin-produtos", label: "Catálogos · Produtos", group: "Painel Administrativo" },
  { id: "admin-kits", label: "Catálogos · Kits", group: "Painel Administrativo" },
  { id: "admin-servicos", label: "Catálogos · Serviços", group: "Painel Administrativo" },
  { id: "admin-decoracoes", label: "Catálogos · Decorações", group: "Painel Administrativo" },
  { id: "admin-fornecedores", label: "Catálogos · Fornecedores", group: "Painel Administrativo" },
  { id: "admin-pesquisa", label: "Configurar Pesquisa de Satisfação", group: "Painel Administrativo" },
  { id: "admin-pesquisa-app", label: "Pesquisa da Aplicação (CX/UX/NPS)", group: "Painel Administrativo" },
  { id: "admin-usuarios", label: "Pessoas · Usuários", group: "Painel Administrativo" },
  { id: "admin-permissoes", label: "Pessoas · Perfis e Permissões", group: "Painel Administrativo" },
  { id: "admin-faturamento", label: "Financeiro · Faturamento", group: "Painel Administrativo" },
  { id: "admin-centros-custo", label: "Financeiro · Centros de Custo", group: "Painel Administrativo" },
  { id: "admin-contratos", label: "Financeiro · Contratos", group: "Painel Administrativo" },
  { id: "admin-ocorrencias", label: "Ocorrências", group: "Painel Administrativo" },
  { id: "admin-popups", label: "Pop-ups", group: "Painel Administrativo" },
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
  /** Código do centro de custo associado (perfis Cliente solicitante, Gestor aprovador e Consumidor final). */
  costCenterCode?: string;
  active: boolean;
  createdAt: string;
  lastPasswordResetAt?: string;
}

/** Perfis cujo usuário fica associado a um centro de custo específico. */
export const COST_CENTER_LINKED_PROFILE_IDS = ["prof-cliente", "prof-gestor", "prof-consumidor"] as const;

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

export const CONTRACT_PRICING_MODES = ["Preço fixo", "Preço variável por consumo"] as const;
export type ContractPricingMode = (typeof CONTRACT_PRICING_MODES)[number];

/**
 * Dados de contrato por centro de custo. Pensado para crescer: hoje cobre os
 * campos mais comuns (preço, aprovação, ponto focal), mas o objetivo é virar
 * a fonte de parâmetros que hoje estão "soltos" nas telas (ex.: exigir
 * aprovador, reajuste, condições de pagamento).
 */
export interface Contract {
  id: string;
  costCenterCode: string;
  pricingMode: ContractPricingMode;
  /** Valor mensal fixo, usado quando pricingMode = "Preço fixo". */
  fixedPrice?: number;
  requiresApprover: boolean;
  clientFocalPointName?: string;
  clientFocalPointEmail?: string;
  clientFocalPointPhone?: string;
  startDate?: string;
  endDate?: string;
  paymentTerms?: string;
  /** Reajuste anual previsto, em %. */
  annualReadjustmentPercent?: number;
  slaNotes?: string;
  notes?: string;
  active: boolean;
}

export const APP_SURVEY_CATEGORIES = ["CX", "UX", "NPS"] as const;
export type AppSurveyCategory = (typeof APP_SURVEY_CATEGORIES)[number];

/** Pesquisa sobre a própria aplicação (não sobre um pedido específico). */
export interface AppSurveyQuestion {
  id: string;
  text: string;
  category: AppSurveyCategory;
  type: "NPS" | "Estrelas" | "Escala 1-5" | "Texto";
  active: boolean;
}

export const PREMIUM_EVENT_STATUSES = ["Rascunho", "Confirmado", "Concluído", "Cancelado"] as const;
export type PremiumEventStatus = (typeof PREMIUM_EVENT_STATUSES)[number];

export const PREMIUM_EVENT_ITEM_KINDS = ["produto", "kit", "servico", "decoracao", "espaco"] as const;
export type PremiumEventItemKind = (typeof PREMIUM_EVENT_ITEM_KINDS)[number];

export interface PremiumEventItem {
  kind: PremiumEventItemKind;
  /** Id do item no catálogo correspondente; ausente para "espaco" (item livre). */
  refId?: string;
  label: string;
  qty: number;
  unitPrice: number;
}

export interface PremiumEvent {
  id: string;
  name: string;
  clientName?: string;
  costCenterCode?: string;
  eventDate?: string;
  location?: string;
  guestCount?: number;
  items: PremiumEventItem[];
  status: PremiumEventStatus;
  notes?: string;
  createdAt: string;
}
