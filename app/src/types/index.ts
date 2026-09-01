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
  | "Recebido"
  /** Orçamento montado pela GU, aguardando o cliente solicitante aprovar o valor antes de entrar em produção. */
  | "Orçamento enviado";

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

export interface OrderAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
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
  /** Marca quando a copeira já recolheu os utensílios após a entrega (data de recolhimento acima). */
  utensilsRetrieved?: boolean;
  coffeeInstructions?: string;
  dietaryRestrictions?: string;
  notes?: string;
  costCenters?: CostCenterAllocation[];
  attachments?: OrderAttachment[];
  /** Status do fechamento financeiro do pedido — controlado na tela de Faturamento. */
  billingStatus?: "Pendente" | "Fechado" | "Enviado ao ERP";
  requiresApproval?: boolean;
  managerApproved?: boolean;
  guApproved?: boolean;
  /** Preenchido quando esse pedido nasceu de uma solicitação de orçamento aprovada. */
  quoteRequestId?: string;
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

export const ORDER_STATUS_LIST: OrderStatus[] = [
  "Solicitado",
  "Aguardando aprovação",
  "Orçamento enviado",
  "Em preparação",
  "Pronto para entrega",
  "Entregue",
  "Finalizado",
  "Cancelado",
  "Recebido",
];

export const QUOTE_STATUSES = ["Solicitado", "Em elaboração", "Enviado para aprovação", "Aprovado", "Recusado"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_EXPERIENCE_OPTIONS = ["Descontraída", "Corporativa", "Sofisticada", "Divertida", "Outro"] as const;
export type QuoteExperience = (typeof QUOTE_EXPERIENCE_OPTIONS)[number];

/** Item montado pela GU na resposta ao orçamento — vira Order.items quando o orçamento é enviado. */
export interface QuoteItem {
  name: string;
  qty: number;
  price: number;
  productId?: string;
}

/** Solicitação de orçamento feita pelo cliente via chat guiado, respondida pela GU com um pedido montado. */
export interface QuoteRequest {
  id: string;
  serviceType: OrderCategoryName;
  expectedDate: string;
  peopleCount: number;
  experience: QuoteExperience;
  wants: string;
  specialDiet: boolean;
  specialDietDetails?: string;
  decorationNotes?: string;
  costCenterCode?: string;
  requestedBy?: string;
  status: QuoteStatus;
  items?: QuoteItem[];
  serviceFeePercent?: number;
  guNotes?: string;
  createdAt: string;
  sentAt?: string;
  /** Preenchido quando a GU envia o orçamento — id do Order criado como fatura para aprovação do cliente. */
  orderId?: string;
}

/** Parâmetros globais da unidade — telas de pedido e aprovação consultam esses valores em vez de terem regras fixas. */
export interface OperatingParameters {
  logoUrl?: string;
  showLogoOnPrint: boolean;
  showAgreementMessage: boolean;
  agreementMessage: string;
  extensionNumber?: string;
  showUnitPriceInOrder: boolean;
  showTotalValueInOrder: boolean;
  showDeliveryLocationField: boolean;
  showInstructionsField: boolean;
}

/** Parâmetros por tipo de pedido (serviço) — SLA, retirada agendada, taxa e centro de custo padrão. */
export interface ServiceParameters {
  category: OrderCategoryName;
  slaPrepMinutes: number;
  requireScheduledPickup: boolean;
  adminFeePercent: number;
  linkedCostCenterCode?: string;
}

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

/** Todas as telas/serviços de pedido onde um produto ou kit pode ser oferecido. */
export const CATALOG_PAGES = [
  "Abastecimento Simples",
  "Coffee Break",
  "Consumo Catraca",
  "Evento Especial",
  "Lanche",
  "Refeição Especial",
  "Refeição Marmitex",
  "Refeição Normal",
  "Reserva de Refeição",
  "Serviços Diversos",
  "Surpreenda",
  "Solicitação de Água",
  "Venda à Vista",
] as const;
export type CatalogPageName = (typeof CATALOG_PAGES)[number];

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
  /** Em quais páginas/serviços de pedido esse produto pode aparecer. */
  pages?: CatalogPageName[];
  /** Centros de custo autorizados a usar este produto (vazio/ausente = todos). */
  allowedCostCenterCodes?: string[];
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

/** As 5 refeições do serviço Consumo Catraca — um kit pode ser oferecido em uma ou mais delas. */
export const MEAL_SERVICES = ["Café da manhã", "Almoço", "Lanche", "Janta", "Ceia"] as const;
export type MealServiceName = (typeof MEAL_SERVICES)[number];

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
  /** Em quais refeições do Consumo Catraca esse kit pode ser oferecido (opcional — só usado por esse serviço). */
  mealServices?: MealServiceName[];
  /** Em quais páginas/serviços de pedido esse kit pode aparecer. */
  pages?: CatalogPageName[];
  /** Centros de custo autorizados a usar este kit (vazio/ausente = todos). */
  allowedCostCenterCodes?: string[];
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
  /** Centros de custo autorizados a usar este serviço (vazio/ausente = todos). */
  allowedCostCenterCodes?: string[];
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
  /** Centros de custo autorizados a usar esta decoração (vazio/ausente = todos). */
  allowedCostCenterCodes?: string[];
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
  { id: "pedido-lanche", label: "Novo Pedido · Lanche", group: "Área do colaborador" },
  { id: "pedido-servicos-diversos", label: "Novo Pedido · Serviços Diversos", group: "Área do colaborador" },
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
  { id: "admin-autocadastro", label: "Pessoas · Autocadastro (atalho)", group: "Painel Administrativo" },
  { id: "admin-faturamento", label: "Financeiro · Faturamento", group: "Painel Administrativo" },
  { id: "admin-centros-custo", label: "Cadastros · Centros de Custo", group: "Painel Administrativo" },
  { id: "admin-contratos", label: "Financeiro · Contratos", group: "Painel Administrativo" },
  { id: "admin-segmentos", label: "Cadastros · Segmentos", group: "Painel Administrativo" },
  { id: "admin-unidades", label: "Cadastros · Unidades", group: "Painel Administrativo" },
  { id: "admin-marcas", label: "Cadastros · Marcas", group: "Painel Administrativo" },
  { id: "admin-empresas", label: "Cadastros · Empresas", group: "Painel Administrativo" },
  { id: "admin-filiais", label: "Cadastros · Filiais", group: "Painel Administrativo" },
  { id: "admin-copas", label: "Cadastros · Copas", group: "Painel Administrativo" },
  { id: "admin-ocorrencias", label: "Ocorrências", group: "Painel Administrativo" },
  { id: "admin-popups", label: "Pop-ups", group: "Painel Administrativo" },
  { id: "admin-parametros", label: "Parâmetros", group: "Painel Administrativo" },
  { id: "admin-servicos-filial", label: "Configurações · Serviços por Filial", group: "Painel Administrativo" },
  { id: "admin-ativos", label: "Gestão de Ativos", group: "Painel Administrativo" },
  { id: "admin-tipos-ativo", label: "Tipos de Ativo", group: "Painel Administrativo" },
  { id: "admin-ativos-checkin", label: "Check-in / Check-out de Ativos", group: "Painel Administrativo" },
  { id: "consumo-catraca", label: "Consumo Catraca", group: "Área do colaborador" },
  { id: "admin-catraca-checkin", label: "Check-in Consumo Catraca (operação)", group: "Painel Administrativo" },
  { id: "solicitar-orcamento", label: "Solicitar Orçamento", group: "Área do colaborador" },
  { id: "admin-orcamentos", label: "Orçamentos", group: "Painel Administrativo" },
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

export const PHONE_COUNTRIES = [
  { code: "+55", label: "Brasil" },
  { code: "+1", label: "Estados Unidos/Canadá" },
  { code: "+351", label: "Portugal" },
  { code: "+54", label: "Argentina" },
  { code: "+595", label: "Paraguai" },
  { code: "+598", label: "Uruguai" },
  { code: "+34", label: "Espanha" },
] as const;

export interface PhoneNumber {
  /** Código do país, ex.: "+55". */
  country: string;
  /** DDD, ex.: "11". */
  ddd: string;
  /** Número, ex.: "91234-5678". */
  number: string;
}

export function formatPhoneNumber(phone?: PhoneNumber): string | undefined {
  if (!phone || !phone.ddd.trim() || !phone.number.trim()) return undefined;
  return `${phone.country} (${phone.ddd}) ${phone.number}`;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  /** Matrícula interna (opcional). */
  matricula?: string;
  /** Celular/WhatsApp, com país e DDD. */
  phone?: PhoneNumber;
  /** Cargo do usuário na empresa. */
  cargo?: string;
  /** Senha (mock — sem hashing, app não tem autenticação real). */
  password?: string;
  profileId?: string;
  /** Empresa associada (perfis Cliente solicitante, Gestor aprovador e Consumidor final). */
  companyId?: string;
  /** Filiais associadas — filtradas pela empresa. */
  branchIds?: string[];
  /** Centros de custo associados — filtrados pelas filiais selecionadas. */
  costCenterCodes?: string[];
  active: boolean;
  createdAt: string;
  lastPasswordResetAt?: string;
}

/** Perfis cujo usuário fica associado a um centro de custo específico. */
export const COST_CENTER_LINKED_PROFILE_IDS = ["prof-cliente", "prof-gestor", "prof-consumidor"] as const;

/** Segmento de mercado atendido (ex.: Corporativo, Educação) — usado no cadastro de Unidade. */
export interface Segment {
  id: string;
  name: string;
  active: boolean;
}

/** Marca operada pela filial (ex.: Sabor Brasil, Modern Receipt) — usada no cadastro de Filial. */
export interface Brand {
  id: string;
  name: string;
  active: boolean;
}

/** Unidade operacional da Direct Eventos, vinculada a um Segmento e a um contrato. */
export interface BusinessUnit {
  id: string;
  segmentId: string;
  /** Nome da unidade Direct Eventos. */
  name: string;
  contract: string;
  attachments?: OrderAttachment[];
  active: boolean;
}

export const COMPANY_TYPES = ["Jurídica", "Física"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export interface Company {
  id: string;
  type: CompanyType;
  name: string;
  tradeName?: string;
  cnpj: string;
  /** Unidade Direct Eventos responsável pelo atendimento desta empresa. */
  unitId: string;
  /** Usuários responsáveis pela conta — precisam estar cadastrados em Usuários. */
  accountManagerIds: string[];
  active: boolean;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  cep: string;
  plantName: string;
  /** Marca operada por esta filial — precisa estar cadastrada em Marcas. */
  brandId: string;
  /** Usuários responsáveis pela filial — precisam estar cadastrados em Usuários. */
  managerIds: string[];
  /** IDs dos serviços (tela Home) habilitados para o Cliente solicitante desta filial — ausente = todos habilitados. */
  enabledServiceIds?: string[];
  active: boolean;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  companyId?: string;
  branchId?: string;
  areaName?: string;
  /** Usuário responsável — precisa ter perfil de Gestor aprovador. */
  managerUserId?: string;
  physicalLocation?: string;
  active: boolean;
}

export const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface CopaOperatingHours {
  weekday: Weekday;
  enabled: boolean;
  start: string;
  end: string;
}

export interface Copa {
  id: string;
  name: string;
  companyId: string;
  branchId: string;
  physicalLocation: string;
  /** Códigos dos centros de custo atendidos por esta copa. */
  costCenterCodes: string[];
  /** Usuários Sodexo responsáveis — precisam estar cadastrados em Usuários. */
  responsibleUserIds: string[];
  /** SLA: quantidade mínima de horas de antecedência para realizar o pedido. */
  slaHours: number;
  operatingHours: CopaOperatingHours[];
  /** Datas (ISO) não úteis e feriados. */
  nonBusinessDays: string[];
  /** Capacidade produtiva: quantos pedidos por cada 30 minutos do período de funcionamento. */
  capacityPer30min: number;
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

export const ASSET_STATUSES = ["Ativo", "Inativo", "Em manutenção", "Extraviado"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export interface AssetUnitOfMeasure {
  id: string;
  qty: number;
  unit: string;
}

/** Tipo de ativo (ex.: Garrafa térmica, Bombona) — define quais unidades de medida um ativo desse tipo pode usar. */
export interface AssetType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  unitsOfMeasure: AssetUnitOfMeasure[];
}

/** Ativo físico individual (patrimônio) rastreado por QR code — garrafas térmicas, bombonas etc. */
export interface Asset {
  id: string;
  name: string;
  description?: string;
  status: AssetStatus;
  assetTypeId: string;
  unitOfMeasureId?: string;
  /** Departamento do ativo — reaproveita o cadastro de Centros de Custo como unidade organizacional. */
  costCenterCode?: string;
  /** Última localização registrada por um check-in/check-out. */
  currentLocation?: string;
  lastMovementKind?: "checkin" | "checkout";
  createdAt: string;
}

export const ASSET_MOVEMENT_KINDS = ["checkin", "checkout"] as const;
export type AssetMovementKind = (typeof ASSET_MOVEMENT_KINDS)[number];

/** Registro de check-in/check-out de um ativo, feito a partir da leitura do QR code colado nele. */
export interface AssetMovement {
  id: string;
  assetId: string;
  kind: AssetMovementKind;
  costCenterCode?: string;
  location?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Status persistido de uma retirada do Consumo Catraca. "Perda" não é persistido —
 * é derivado (ver `catracaEffectiveStatus`) sempre que houve check-in há mais de 1h sem check-out.
 */
export const CATRACA_STATUSES = ["Aguardando retirada", "Check-in realizado", "Check-out realizado"] as const;
export type CatracaStatus = (typeof CATRACA_STATUSES)[number];
export type CatracaEffectiveStatus = CatracaStatus | "Perda";

/** Uma retirada de refeição pelo Consumo Catraca — nasce com QR code, fechada por check-in (operação) + check-out (cliente). */
export interface CatracaRedemption {
  id: string;
  mealService: MealServiceName;
  kitId: string;
  pickupDate: string;
  pickupTime: string;
  costCenterCode?: string;
  requestedBy?: string;
  attachments?: OrderAttachment[];
  status: CatracaStatus;
  checkInAt?: string;
  checkOutAt?: string;
  createdAt: string;
}
