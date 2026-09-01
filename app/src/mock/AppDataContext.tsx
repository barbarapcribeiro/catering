import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  APP_PAGES,
  EMPTY_PAGE_PERMISSION,
  type AppSurveyQuestion,
  type AppUser,
  type Asset,
  type AssetMovement,
  type AssetType,
  type CatracaRedemption,
  type CatracaStatus,
  type ChatMessage,
  type Company,
  type Branch,
  type Brand,
  type BusinessUnit,
  type Contract,
  type Copa,
  type Segment,
  type CostCenter,
  type Decoration,
  type Kit,
  type Notification,
  type Occurrence,
  type Order,
  type OrderCategoryName,
  type OrderStatus,
  type OperatingParameters,
  type PagePermission,
  type Popup,
  type PremiumEvent,
  type Product,
  type Profile,
  type QuoteRequest,
  type ServiceCatalogItem,
  type ServiceParameters,
  type Supplier,
  type SurveyQuestion,
  type SurveyResponse,
  ORDER_CATEGORIES,
  ORDER_STATUS_LIST,
  WEEKDAYS,
} from "../types";
import { computeProductPrice } from "./pricing";

const STORAGE_KEY = "direct-eventos-mock-v3";

interface StoredState {
  orders: Order[];
  notifications: Notification[];
  favorites: string[];
  chatMessages: ChatMessage[];
  surveyQuestions: SurveyQuestion[];
  appSurveyQuestions: AppSurveyQuestion[];
  surveyResponses: SurveyResponse[];
  suppliers: Supplier[];
  products: Product[];
  kits: Kit[];
  serviceCatalog: ServiceCatalogItem[];
  decorations: Decoration[];
  contracts: Contract[];
  premiumEvents: PremiumEvent[];
  profiles: Profile[];
  users: AppUser[];
  segments: Segment[];
  businessUnits: BusinessUnit[];
  brands: Brand[];
  companies: Company[];
  branches: Branch[];
  costCenters: CostCenter[];
  copas: Copa[];
  occurrences: Occurrence[];
  popups: Popup[];
  dismissedPopupIds: string[];
  currentProfileId: string;
  nextOrderNum: number;
  operatingParameters: OperatingParameters;
  serviceParameters: ServiceParameters[];
  statusFlowVisibility: Record<OrderStatus, boolean>;
  assetTypes: AssetType[];
  assets: Asset[];
  assetMovements: AssetMovement[];
  catracaRedemptions: CatracaRedemption[];
  quoteRequests: QuoteRequest[];
}

const initialOrders: Order[] = [];

const initialNotifications: Notification[] = [];

const initialSurveyQuestions: SurveyQuestion[] = [
  // Coffee Break
  { id: "q-cb-1", text: "De 0 a 10, quanto você recomendaria nosso Coffee Break?", type: "NPS", active: true, orderCategory: "Coffee Break" },
  { id: "q-cb-2", text: "Como você avalia a qualidade dos alimentos?", type: "Estrelas", active: true, orderCategory: "Coffee Break" },
  { id: "q-cb-3", text: "Como você avalia a pontualidade da entrega?", type: "Estrelas", active: true, orderCategory: "Coffee Break" },
  { id: "q-cb-4", text: "Como você avalia o atendimento da equipe?", type: "Estrelas", active: true, orderCategory: "Coffee Break" },
  { id: "q-cb-5", text: "Deixe um comentário sobre sua experiência", type: "Texto", active: true, orderCategory: "Coffee Break" },
  // Evento Especial
  { id: "q-evt-1", text: "De 0 a 10, quanto você recomendaria nosso Evento Especial?", type: "NPS", active: true, orderCategory: "Evento Especial" },
  { id: "q-evt-2", text: "Como você avalia a qualidade do buffet e da decoração?", type: "Estrelas", active: true, orderCategory: "Evento Especial" },
  { id: "q-evt-3", text: "Como você avalia a pontualidade da montagem?", type: "Estrelas", active: true, orderCategory: "Evento Especial" },
  { id: "q-evt-4", text: "Como você avalia o atendimento da equipe no evento?", type: "Estrelas", active: true, orderCategory: "Evento Especial" },
  { id: "q-evt-5", text: "Deixe um comentário sobre o evento", type: "Texto", active: true, orderCategory: "Evento Especial" },
  // Solicitação de Água
  { id: "q-agua-1", text: "De 0 a 10, quanto você recomendaria nossa Solicitação de Água?", type: "NPS", active: true, orderCategory: "Solicitação de Água" },
  { id: "q-agua-2", text: "Como você avalia a qualidade das garrafas/galões entregues?", type: "Estrelas", active: true, orderCategory: "Solicitação de Água" },
  { id: "q-agua-3", text: "Como você avalia a pontualidade da entrega?", type: "Estrelas", active: true, orderCategory: "Solicitação de Água" },
  { id: "q-agua-4", text: "Como você avalia o atendimento no momento da entrega?", type: "Estrelas", active: true, orderCategory: "Solicitação de Água" },
  { id: "q-agua-5", text: "Deixe um comentário sobre a entrega de água", type: "Texto", active: true, orderCategory: "Solicitação de Água" },
  // Abastecimento Simples
  { id: "q-ab-1", text: "De 0 a 10, quanto você recomendaria o Abastecimento Simples?", type: "NPS", active: true, orderCategory: "Abastecimento Simples" },
  { id: "q-ab-2", text: "Como você avalia a qualidade dos itens de copa entregues?", type: "Estrelas", active: true, orderCategory: "Abastecimento Simples" },
  { id: "q-ab-3", text: "Como você avalia a pontualidade do abastecimento?", type: "Estrelas", active: true, orderCategory: "Abastecimento Simples" },
  { id: "q-ab-4", text: "Como você avalia o atendimento da equipe?", type: "Estrelas", active: true, orderCategory: "Abastecimento Simples" },
  { id: "q-ab-5", text: "Deixe um comentário sobre o abastecimento", type: "Texto", active: true, orderCategory: "Abastecimento Simples" },
  // Surpreenda
  { id: "q-sp-1", text: "De 0 a 10, quanto você recomendaria o Surpreenda?", type: "NPS", active: true, orderCategory: "Surpreenda" },
  { id: "q-sp-2", text: "Como você avalia a qualidade dos kits recebidos?", type: "Estrelas", active: true, orderCategory: "Surpreenda" },
  { id: "q-sp-3", text: "Como você avalia a pontualidade da entrega?", type: "Estrelas", active: true, orderCategory: "Surpreenda" },
  { id: "q-sp-4", text: "Como você avalia o atendimento da equipe?", type: "Estrelas", active: true, orderCategory: "Surpreenda" },
  { id: "q-sp-5", text: "Deixe um comentário sobre o Surpreenda", type: "Texto", active: true, orderCategory: "Surpreenda" },
];

const initialSurveyResponses: SurveyResponse[] = [];

const initialChat: ChatMessage[] = [];

const initialSuppliers: Supplier[] = [
  { id: "sup1", name: "Distribuidora Boa Mesa Ltda.", category: "Alimentos e Bebidas", cnpj: "12.345.678/0001-90", contactName: "Roberto Alves", phone: "(11) 4002-8922", email: "contato@boamesa.com.br", active: true },
  { id: "sup2", name: "EcoPack Descartáveis", category: "Descartáveis", cnpj: "23.456.789/0001-01", contactName: "Fernanda Lima", phone: "(11) 3333-4455", email: "vendas@ecopack.com.br", active: true },
  { id: "sup3", name: "Higienize Serviços de Limpeza", category: "Limpeza", cnpj: "34.567.890/0001-12", contactName: "Marcos Vinícius", phone: "(11) 2222-1199", email: "marcos@higienize.com.br", active: true },
];

function product(base: Omit<Product, "price">): Product {
  return { ...base, price: computeProductPrice(base.costPrice, base.marginPercent) };
}

const initialProducts: Product[] = [
  product({ id: "prod1", name: "Coca-Cola lata 350ml", type: "Bebida", unit: "un", costPrice: 6, marginPercent: 67, description: "Refrigerante em lata.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod2", name: "Água Mineral 500ml", type: "Bebida", unit: "un", costPrice: 3.5, marginPercent: 71, description: "Sem gás — individual, para coffee break.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod3", name: "Mini Salgados (100 unidades)", type: "Salgado", unit: "pacote", costPrice: 60, marginPercent: 50, description: "Sortidos, assados.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod4", name: "Copo descartável 200ml", type: "Descartável", unit: "pacote", costPrice: 7, marginPercent: 45, description: "Pacote com 100 unidades.", supplierId: "sup2", pages: ["Coffee Break", "Abastecimento Simples"], active: true }),
  product({ id: "prod5", name: "Suco Natural 300ml", type: "Bebida", unit: "un", costPrice: 5, marginPercent: 60, description: "Sabores variados.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod6", name: "Café Térmico 1L", type: "Bebida", unit: "un", costPrice: 15, marginPercent: 67, description: "Garrafa térmica para coffee break.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod7", name: "Mini Pães (50 unidades)", type: "Pão e Bolo", unit: "pacote", costPrice: 46, marginPercent: 52, description: "Pão de queijo e mini pães sortidos.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod8", name: "Mini Doces (30 unidades)", type: "Doce", unit: "pacote", costPrice: 40, marginPercent: 50, description: "Docinhos sortidos.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod9", name: "Fruta Picada (porção 300g)", type: "Fruta", unit: "un", costPrice: 2.7, marginPercent: 48, description: "Mix de frutas da estação.", supplierId: "sup1", pages: ["Coffee Break"], active: true }),
  product({ id: "prod10", name: "Garrafa de Água 500ml", type: "Bebida", unit: "un", costPrice: 2, marginPercent: 50, description: "Água mineral individual, para abastecimento/entrega em galão ou garrafa.", supplierId: "sup1", pages: ["Solicitação de Água", "Abastecimento Simples"], active: true }),
  product({ id: "prod11", name: "Garrafa de Água 1,5L", type: "Bebida", unit: "un", costPrice: 4, marginPercent: 50, description: "Ideal para mesas de reunião.", supplierId: "sup1", pages: ["Solicitação de Água", "Abastecimento Simples"], active: true }),
  product({ id: "prod12", name: "Galão de Água 5L", type: "Bebida", unit: "un", costPrice: 17, marginPercent: 47, description: "Galão compacto, salas e escritórios.", supplierId: "sup1", pages: ["Solicitação de Água", "Abastecimento Simples"], active: true }),
  product({ id: "prod13", name: "Galão de Água 20L", type: "Bebida", unit: "un", costPrice: 40, marginPercent: 50, description: "Galão com suporte, eventos maiores.", supplierId: "sup1", pages: ["Solicitação de Água", "Abastecimento Simples"], active: true }),
  product({ id: "prod14", name: "Garrafa de Café 500ml", type: "Bebida", unit: "un", costPrice: 5, marginPercent: 60, description: "Térmica, individual.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod15", name: "Garrafa de Café 1L", type: "Bebida", unit: "un", costPrice: 9, marginPercent: 56, description: "Ideal para grupos pequenos.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod16", name: "Garrafa de Café 3L", type: "Bebida", unit: "un", costPrice: 20, marginPercent: 60, description: "Ideal para setores e salas de reunião.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod17", name: "Garrafa de Café 5L", type: "Bebida", unit: "un", costPrice: 30, marginPercent: 60, description: "Ideal para andares e áreas maiores.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod18", name: "Adoçante", type: "Outro", unit: "pacote", costPrice: 3, marginPercent: 67, description: "Sachês individuais.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod19", name: "Açúcar", type: "Outro", unit: "pacote", costPrice: 2.5, marginPercent: 60, description: "Sachês individuais.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod20", name: "Biscoitos Simples", type: "Salgado", unit: "pacote", costPrice: 4, marginPercent: 50, description: "Pacotes individuais, sabores variados.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod21", name: "Balas", type: "Doce", unit: "pacote", costPrice: 4.5, marginPercent: 56, description: "Pacote sortido.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
  product({ id: "prod22", name: "Bombons", type: "Doce", unit: "un", costPrice: 1.2, marginPercent: 67, description: "Unidade, sabores variados.", supplierId: "sup1", pages: ["Abastecimento Simples"], active: true }),
];

const initialKits: Kit[] = [
  { id: "kit1", name: "Combo Reunião Rápida", description: "Água e salgados para reuniões curtas.", items: [{ productId: "prod2", qty: 10 }, { productId: "prod3", qty: 1 }], serviceFeePercent: 10, pages: ["Coffee Break"], active: true },
];

const initialServiceCatalog: ServiceCatalogItem[] = [
  { id: "svc1", name: "Limpeza pós-evento", description: "Limpeza do espaço após o término do evento.", category: "Limpeza", price: 180, active: true },
  { id: "svc2", name: "Retirada de itens", description: "Recolhimento de utensílios e equipamentos.", category: "Logística", price: 120, active: true },
  { id: "svc3", name: "Organização de eventos", description: "Apoio completo na montagem e organização.", category: "Organização de Eventos", price: 450, active: true },
  { id: "svc4", name: "Recepção de convidados", description: "Equipe de recepção na entrada do evento.", category: "Recepção", price: 220, active: true },
];

const initialDecorations: Decoration[] = [
  { id: "dec1", name: "Arranjo de mesa sazonal", description: "Composição floral para mesas de coffee break.", category: "Flores e Arranjos", price: 90, active: true },
  { id: "dec2", name: "Backdrop personalizado", description: "Painel com identidade visual do evento.", category: "Painéis e Backdrop", price: 650, active: true },
  { id: "dec3", name: "Iluminação de ambiente", description: "Kit de iluminação decorativa para o espaço do evento.", category: "Iluminação", price: 380, active: true },
  { id: "dec4", name: "Toalhas e sousplat premium", description: "Ambientação de mesa para eventos especiais.", category: "Mesa e Ambientação", price: 140, active: true },
];

const initialAppSurveyQuestions: AppSurveyQuestion[] = [
  { id: "aq1", text: "De 0 a 10, quanto você recomendaria o Direct Eventos by Spark XP a um colega?", category: "NPS", type: "NPS", active: true },
  { id: "aq2", text: "O quão fácil foi encontrar o que você precisava no sistema?", category: "UX", type: "Estrelas", active: true },
  { id: "aq3", text: "A navegação entre as telas fez sentido para você?", category: "UX", type: "Escala 1-5", active: true },
  { id: "aq4", text: "Como você avalia o atendimento recebido ao usar a plataforma?", category: "CX", type: "Estrelas", active: true },
  { id: "aq5", text: "O que podemos melhorar na sua experiência com o sistema?", category: "CX", type: "Texto", active: true },
];

const initialContracts: Contract[] = [
  {
    id: "ctr1",
    costCenterCode: "CC001",
    pricingMode: "Preço fixo",
    fixedPrice: 18500,
    requiresApprover: true,
    clientFocalPointName: "Carlos Santos",
    clientFocalPointEmail: "carlos.santos@clienteempresa.com",
    clientFocalPointPhone: "(11) 4002-1122",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    paymentTerms: "Boleto, 28 dias",
    annualReadjustmentPercent: 5,
    slaNotes: "Entrega em até 24h para pedidos padrão; 72h para eventos especiais.",
    active: true,
  },
  {
    id: "ctr2",
    costCenterCode: "CC002",
    pricingMode: "Preço variável por consumo",
    requiresApprover: false,
    clientFocalPointName: "Paula Costa",
    clientFocalPointEmail: "paula.costa@clienteempresa.com",
    startDate: "2026-02-01",
    paymentTerms: "Faturamento mensal, 15 dias",
    annualReadjustmentPercent: 4,
    active: true,
  },
];

const initialPremiumEvents: PremiumEvent[] = [];

/** Monta o mapa de permissões de um perfil só para as páginas informadas — as demais ficam sem acesso. */
function perms(entries: Record<string, Partial<PagePermission>>): Record<string, PagePermission> {
  const out: Record<string, PagePermission> = {};
  for (const pageId of Object.keys(entries)) {
    out[pageId] = { ...EMPTY_PAGE_PERMISSION, ...entries[pageId] };
  }
  return out;
}

const FULL_PAGE_PERMISSION: PagePermission = { ver: true, criarEditar: true, aprovar: true, excluir: true };
function fullAccessPerms(): Record<string, PagePermission> {
  const out: Record<string, PagePermission> = {};
  for (const page of APP_PAGES) out[page.id] = FULL_PAGE_PERMISSION;
  return out;
}

const ORDER_PAGES = ["pedido-coffee", "pedido-evento", "pedido-agua", "pedido-abastecimento", "surpreenda", "pedido-lanche", "pedido-servicos-diversos"];

const initialProfiles: Profile[] = [
  {
    id: "prof-cliente",
    name: "Cliente solicitante",
    whoIs: "Colaborador do cliente que pede o coffee.",
    responsibilities: "Cria, ajusta e cancela pedidos; aprova fechamento de faturamento; responde pesquisa de processo.",
    active: true,
    permissions: perms({
      home: { ver: true },
      ...Object.fromEntries(ORDER_PAGES.map((p) => [p, { ver: true, criarEditar: true }])),
      pedidos: { ver: true, criarEditar: true, excluir: true },
      "fique-por-dentro": { ver: true },
      "pesquisa-app": { ver: true, criarEditar: true },
      "consumo-catraca": { ver: true, criarEditar: true },
      "solicitar-orcamento": { ver: true, criarEditar: true },
    }),
  },
  {
    id: "prof-gestor",
    name: "Gestor aprovador",
    whoIs: "Gestor vinculado ao centro de custo (quando o contrato exige).",
    responsibilities: "Aprova pedidos e alterações que aumentem valor.",
    active: true,
    permissions: perms({
      home: { ver: true },
      pedidos: { ver: true, aprovar: true },
      aprovacoes: { ver: true, aprovar: true },
      "pesquisa-app": { ver: true, criarEditar: true },
    }),
  },
  {
    id: "prof-gu",
    name: "GU",
    whoIs: "Gerente de Unidade Direct Eventos.",
    responsibilities: "Confirma pedidos, gerencia a operação, registra status (produção, entrega, finalização), configura regras, conduz o faturamento.",
    active: true,
    permissions: perms({
      home: { ver: true },
      pedidos: { ver: true, criarEditar: true, aprovar: true },
      producao: { ver: true, criarEditar: true, aprovar: true },
      aprovacoes: { ver: true, aprovar: true },
      "eventos-premium": { ver: true, criarEditar: true, aprovar: true, excluir: true },
      "pesquisa-app": { ver: true, criarEditar: true },
      "admin-operacao": { ver: true },
      "admin-relatorios": { ver: true },
      "admin-produtos": { ver: true, criarEditar: true },
      "admin-kits": { ver: true, criarEditar: true },
      "admin-servicos": { ver: true, criarEditar: true },
      "admin-decoracoes": { ver: true, criarEditar: true },
      "admin-popups": { ver: true, criarEditar: true, excluir: true },
      "admin-fornecedores": { ver: true, criarEditar: true },
      "admin-pesquisa": { ver: true, criarEditar: true },
      "admin-pesquisa-app": { ver: true, criarEditar: true },
      "admin-usuarios": { ver: true },
      "admin-permissoes": { ver: true },
      "admin-faturamento": { ver: true, criarEditar: true, aprovar: true },
      "admin-segmentos": { ver: true },
      "admin-unidades": { ver: true },
      "admin-marcas": { ver: true },
      "admin-empresas": { ver: true },
      "admin-filiais": { ver: true },
      "admin-centros-custo": { ver: true },
      "admin-copas": { ver: true, criarEditar: true },
      "admin-contratos": { ver: true, criarEditar: true },
      "admin-ocorrencias": { ver: true, criarEditar: true },
      "admin-parametros": { ver: true, criarEditar: true },
      "admin-servicos-filial": { ver: true, criarEditar: true },
      "admin-ativos": { ver: true, criarEditar: true, excluir: true },
      "admin-tipos-ativo": { ver: true, criarEditar: true, excluir: true },
      "admin-ativos-checkin": { ver: true, criarEditar: true },
      "admin-catraca-checkin": { ver: true, criarEditar: true },
      "admin-orcamentos": { ver: true, criarEditar: true, aprovar: true },
    }),
  },
  {
    id: "prof-producao",
    name: "Cozinha / Produção",
    whoIs: "Responsável/Equipe de produção da unidade.",
    responsibilities: "Recebe e produz.",
    active: true,
    permissions: perms({
      producao: { ver: true, criarEditar: true },
      "pesquisa-app": { ver: true, criarEditar: true },
      "admin-catraca-checkin": { ver: true, criarEditar: true },
    }),
  },
  {
    id: "prof-copeira",
    name: "Copeira",
    whoIs: "Responsável pela copa da unidade.",
    responsibilities: "Entrega os pedidos prontos e recolhe os utensílios após o consumo.",
    active: true,
    permissions: perms({
      home: { ver: true },
      producao: { ver: true, criarEditar: true },
      "pesquisa-app": { ver: true, criarEditar: true },
    }),
  },
  {
    id: "prof-faturamento",
    name: "Faturamento / Backoffice",
    whoIs: "Apoio Administrativo; Ponto Focal Direct Eventos; GU; outros.",
    responsibilities: "Realiza o fechamento, aprova com cliente e carrega no ERP para geração do faturamento.",
    active: true,
    permissions: perms({
      "admin-faturamento": { ver: true, criarEditar: true, aprovar: true },
      "admin-relatorios": { ver: true },
      "admin-centros-custo": { ver: true },
      "admin-contratos": { ver: true, criarEditar: true },
      "pesquisa-app": { ver: true, criarEditar: true },
    }),
  },
  {
    id: "prof-consumidor",
    name: "Consumidor final",
    whoIs: "Quem consome o coffee (não necessariamente quem pediu).",
    responsibilities: "Avalia via QR code na entrega — não acessa o sistema.",
    active: true,
    permissions: perms({}),
  },
  {
    id: "prof-admin",
    name: "Administrador",
    whoIs: "Equipe de TI/suporte responsável pela plataforma.",
    responsibilities: "Acesso total: gerencia todos os cadastros, usuários, perfis, permissões e configurações do sistema.",
    active: true,
    permissions: fullAccessPerms(),
  },
];

const initialUsers: AppUser[] = [
  { id: "user1", name: "Bárbara C. Ribeiro", email: "barbara.ribeiro@sparkxp.com", profileId: "prof-gu", companyId: "comp1", branchIds: ["branch1"], active: true, createdAt: "2026-01-12T09:00:00Z" },
  { id: "user2", name: "Marina Silva", email: "marina.silva@sparkxp.com", profileId: "prof-gu", companyId: "comp1", branchIds: ["branch1"], active: true, createdAt: "2026-02-03T09:00:00Z" },
  { id: "user3", name: "Carlos Santos", email: "carlos.santos@clienteempresa.com", profileId: "prof-gestor", companyId: "comp1", branchIds: ["branch1"], costCenterCodes: ["CC001"], active: true, createdAt: "2026-02-10T09:00:00Z" },
  { id: "user4", name: "Paula Costa", email: "paula.costa@clienteempresa.com", profileId: "prof-gestor", companyId: "comp1", branchIds: ["branch1"], costCenterCodes: ["CC002"], active: true, createdAt: "2026-02-10T09:00:00Z" },
  { id: "user5", name: "Ana Beatriz Lima", email: "ana.lima@clienteempresa.com", profileId: "prof-cliente", companyId: "comp1", branchIds: ["branch1", "branch2"], costCenterCodes: ["CC001", "CC003"], active: true, createdAt: "2026-03-01T09:00:00Z" },
  { id: "user6", name: "João Pedro Nunes", email: "joao.nunes@sparkxp.com", profileId: "prof-producao", companyId: "comp1", branchIds: ["branch2"], active: true, createdAt: "2026-03-05T09:00:00Z" },
  { id: "user7", name: "Fernanda Costa", email: "fernanda.costa@sparkxp.com", profileId: "prof-faturamento", companyId: "comp1", branchIds: ["branch1"], active: true, createdAt: "2026-03-08T09:00:00Z" },
  { id: "user8", name: "Administrador do Sistema", email: "admin@sparkxp.com", profileId: "prof-admin", companyId: "comp1", branchIds: ["branch1", "branch2"], active: true, createdAt: "2026-01-01T09:00:00Z" },
  { id: "user9", name: "Rosana Alves", email: "rosana.alves@sparkxp.com", profileId: "prof-copeira", companyId: "comp1", branchIds: ["branch1"], active: true, createdAt: "2026-03-10T09:00:00Z" },
];

const initialSegments: Segment[] = [
  { id: "seg1", name: "Corporativo", active: true },
  { id: "seg2", name: "Educação", active: true },
  { id: "seg3", name: "Energia e Recursos", active: true },
  { id: "seg4", name: "Saúde", active: true },
];

const initialBusinessUnits: BusinessUnit[] = [
  { id: "unit1", segmentId: "seg1", name: "Unidade SP Corporativo", contract: "CT-2026-001", active: true },
];

const initialBrands: Brand[] = [
  { id: "brand1", name: "Sabor Brasil", active: true },
  { id: "brand2", name: "Sabor Brasil Premium", active: true },
  { id: "brand3", name: "Modern Receipt", active: true },
  { id: "brand4", name: "No Ponto", active: true },
];

const initialCompanies: Company[] = [
  { id: "comp1", type: "Jurídica", name: "Cliente Empresa Ltda.", tradeName: "Cliente Empresa", cnpj: "12.345.678/0001-90", unitId: "unit1", accountManagerIds: ["user3", "user4"], active: true },
];

const initialBranches: Branch[] = [
  { id: "branch1", companyId: "comp1", name: "Matriz São Paulo", cep: "01310-100", plantName: "Planta SP-1", brandId: "brand1", managerIds: ["user3"], active: true },
  { id: "branch2", companyId: "comp1", name: "Filial Campinas", cep: "13015-904", plantName: "Planta CPS-1", brandId: "brand1", managerIds: ["user4"], active: true },
];

const initialCostCenters: CostCenter[] = [
  { id: "cc1", code: "CC001", name: "Administrativo", companyId: "comp1", branchId: "branch1", areaName: "Administração", managerUserId: "user3", physicalLocation: "Torre A, 5º andar", active: true },
  { id: "cc2", code: "CC002", name: "Comercial", companyId: "comp1", branchId: "branch1", areaName: "Comercial", managerUserId: "user4", physicalLocation: "Torre A, 3º andar", active: true },
  { id: "cc3", code: "CC003", name: "Operações", companyId: "comp1", branchId: "branch2", areaName: "Operações", physicalLocation: "Galpão 2", active: true },
];

const initialCopas: Copa[] = [
  {
    id: "copa1",
    name: "Copa Matriz SP",
    companyId: "comp1",
    branchId: "branch1",
    physicalLocation: "Térreo, ala leste",
    costCenterCodes: ["CC001", "CC002"],
    responsibleUserIds: ["user1", "user2", "user9"],
    slaHours: 2,
    operatingHours: WEEKDAYS.map((weekday) => ({ weekday, enabled: !["Sábado", "Domingo"].includes(weekday), start: "07:00", end: "19:00" })),
    nonBusinessDays: [],
    capacityPer30min: 20,
    active: true,
  },
];

const initialOccurrences: Occurrence[] = [];

const initialPopups: Popup[] = [];

const initialOperatingParameters: OperatingParameters = {
  logoUrl: undefined,
  showLogoOnPrint: true,
  showAgreementMessage: true,
  agreementMessage: 'Pedido(s) com "De Acordo" pendente(s).',
  extensionNumber: "9090",
  showUnitPriceInOrder: true,
  showTotalValueInOrder: true,
  showDeliveryLocationField: true,
  showInstructionsField: true,
};

const SLA_DEFAULTS: Record<OrderCategoryName, number> = {
  "Coffee Break": 120,
  "Evento Especial": 180,
  "Solicitação de Água": 30,
  "Abastecimento Simples": 60,
  Surpreenda: 90,
};

const initialServiceParameters: ServiceParameters[] = ORDER_CATEGORIES.map((category) => ({
  category,
  slaPrepMinutes: SLA_DEFAULTS[category],
  requireScheduledPickup: category === "Coffee Break" || category === "Evento Especial",
  adminFeePercent: 10,
  linkedCostCenterCode: undefined,
}));

const initialStatusFlowVisibility: Record<OrderStatus, boolean> = Object.fromEntries(
  ORDER_STATUS_LIST.map((s) => [s, true]),
) as Record<OrderStatus, boolean>;

const initialAssetTypes: AssetType[] = [];
const initialAssets: Asset[] = [];
const initialAssetMovements: AssetMovement[] = [];
const initialCatracaRedemptions: CatracaRedemption[] = [];
const initialQuoteRequests: QuoteRequest[] = [];

const defaultState: StoredState = {
  orders: initialOrders,
  notifications: initialNotifications,
  favorites: [],
  chatMessages: initialChat,
  surveyQuestions: initialSurveyQuestions,
  appSurveyQuestions: initialAppSurveyQuestions,
  surveyResponses: initialSurveyResponses,
  suppliers: initialSuppliers,
  products: initialProducts,
  kits: initialKits,
  serviceCatalog: initialServiceCatalog,
  decorations: initialDecorations,
  contracts: initialContracts,
  premiumEvents: initialPremiumEvents,
  profiles: initialProfiles,
  users: initialUsers,
  segments: initialSegments,
  businessUnits: initialBusinessUnits,
  brands: initialBrands,
  companies: initialCompanies,
  branches: initialBranches,
  costCenters: initialCostCenters,
  copas: initialCopas,
  occurrences: initialOccurrences,
  popups: initialPopups,
  dismissedPopupIds: [],
  currentProfileId: "prof-cliente",
  nextOrderNum: 0,
  operatingParameters: initialOperatingParameters,
  serviceParameters: initialServiceParameters,
  statusFlowVisibility: initialStatusFlowVisibility,
  assetTypes: initialAssetTypes,
  assets: initialAssets,
  assetMovements: initialAssetMovements,
  catracaRedemptions: initialCatracaRedemptions,
  quoteRequests: initialQuoteRequests,
};

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Merge over defaults so fields added after a user's browser already
    // saved state (e.g. suppliers/products) don't come back undefined.
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt storage
  }
  return defaultState;
}

interface AppDataValue {
  currentProfileId: string;
  setCurrentProfileId: (id: string) => void;
  currentProfile: Profile | null;
  currentUser: AppUser | null;
  hasPageAccess: (pageId: string, action?: keyof PagePermission) => boolean;

  orders: Order[];
  addOrder: (order: Partial<Order> & { category: string; type: string; mono: string }) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  cancelOrder: (id: string) => void;
  duplicateOrder: (id: string) => void;

  notifications: Notification[];
  markAllNotificationsRead: () => void;
  addNotification: (title: string) => void;

  favorites: Set<string>;
  toggleFavorite: (id: string) => void;

  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;

  surveyQuestions: SurveyQuestion[];
  addSurveyQuestion: (text: string, type: SurveyQuestion["type"], orderCategory: SurveyQuestion["orderCategory"]) => void;
  updateSurveyQuestion: (id: string, patch: Partial<SurveyQuestion>) => void;
  removeSurveyQuestion: (id: string) => void;
  reorderSurveyQuestion: (id: string, dir: -1 | 1) => void;

  surveyResponses: SurveyResponse[];
  addSurveyResponse: (response: Omit<SurveyResponse, "id" | "createdAt">) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, "id" | "price">) => void;
  updateProduct: (id: string, patch: Partial<Omit<Product, "price">>) => void;
  removeProduct: (id: string) => void;

  kits: Kit[];
  addKit: (kit: Omit<Kit, "id">) => void;
  updateKit: (id: string, patch: Partial<Kit>) => void;
  removeKit: (id: string) => void;

  serviceCatalog: ServiceCatalogItem[];
  addServiceCatalogItem: (item: Omit<ServiceCatalogItem, "id">) => void;
  updateServiceCatalogItem: (id: string, patch: Partial<ServiceCatalogItem>) => void;
  removeServiceCatalogItem: (id: string) => void;

  decorations: Decoration[];
  addDecoration: (item: Omit<Decoration, "id">) => void;
  updateDecoration: (id: string, patch: Partial<Decoration>) => void;
  removeDecoration: (id: string) => void;

  popups: Popup[];
  addPopup: (popup: Omit<Popup, "id" | "createdAt">) => void;
  updatePopup: (id: string, patch: Partial<Popup>) => void;
  removePopup: (id: string) => void;
  dismissedPopupIds: Set<string>;
  dismissPopup: (id: string) => void;

  contracts: Contract[];
  addContract: (contract: Omit<Contract, "id">) => void;
  updateContract: (id: string, patch: Partial<Contract>) => void;
  removeContract: (id: string) => void;

  appSurveyQuestions: AppSurveyQuestion[];
  addAppSurveyQuestion: (question: Omit<AppSurveyQuestion, "id">) => void;
  updateAppSurveyQuestion: (id: string, patch: Partial<AppSurveyQuestion>) => void;
  removeAppSurveyQuestion: (id: string) => void;

  premiumEvents: PremiumEvent[];
  addPremiumEvent: (event: Omit<PremiumEvent, "id" | "createdAt">) => void;
  updatePremiumEvent: (id: string, patch: Partial<PremiumEvent>) => void;
  removePremiumEvent: (id: string) => void;

  profiles: Profile[];
  addProfile: (profile: Omit<Profile, "id">) => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  removeProfile: (id: string) => void;
  setProfilePagePermission: (profileId: string, pageId: string, patch: Partial<PagePermission>) => void;

  users: AppUser[];
  addUser: (user: Omit<AppUser, "id" | "createdAt">) => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  resetUserPassword: (id: string) => void;

  segments: Segment[];
  addSegment: (segment: Omit<Segment, "id">) => void;
  updateSegment: (id: string, patch: Partial<Segment>) => void;
  removeSegment: (id: string) => void;

  businessUnits: BusinessUnit[];
  addBusinessUnit: (unit: Omit<BusinessUnit, "id">) => void;
  updateBusinessUnit: (id: string, patch: Partial<BusinessUnit>) => void;
  removeBusinessUnit: (id: string) => void;

  brands: Brand[];
  addBrand: (brand: Omit<Brand, "id">) => void;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  removeBrand: (id: string) => void;

  companies: Company[];
  addCompany: (company: Omit<Company, "id">) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  removeCompany: (id: string) => void;

  branches: Branch[];
  addBranch: (branch: Omit<Branch, "id">) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  removeBranch: (id: string) => void;

  costCenters: CostCenter[];
  addCostCenter: (costCenter: Omit<CostCenter, "id">) => void;
  updateCostCenter: (id: string, patch: Partial<CostCenter>) => void;
  removeCostCenter: (id: string) => void;

  copas: Copa[];
  addCopa: (copa: Omit<Copa, "id">) => void;
  updateCopa: (id: string, patch: Partial<Copa>) => void;
  removeCopa: (id: string) => void;

  occurrences: Occurrence[];
  addOccurrence: (occurrence: Omit<Occurrence, "id" | "createdAt">) => void;
  updateOccurrence: (id: string, patch: Partial<Occurrence>) => void;
  removeOccurrence: (id: string) => void;

  operatingParameters: OperatingParameters;
  updateOperatingParameters: (patch: Partial<OperatingParameters>) => void;

  serviceParameters: ServiceParameters[];
  updateServiceParameters: (category: OrderCategoryName, patch: Partial<ServiceParameters>) => void;

  statusFlowVisibility: Record<OrderStatus, boolean>;
  toggleStatusFlowVisibility: (status: OrderStatus) => void;

  assetTypes: AssetType[];
  addAssetType: (assetType: Omit<AssetType, "id">) => void;
  updateAssetType: (id: string, patch: Partial<AssetType>) => void;
  removeAssetType: (id: string) => void;

  assets: Asset[];
  addAsset: (asset: Omit<Asset, "id" | "createdAt">) => Asset;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  assetMovements: AssetMovement[];
  addAssetMovement: (movement: Omit<AssetMovement, "id" | "createdAt">) => void;

  catracaRedemptions: CatracaRedemption[];
  addCatracaRedemption: (redemption: Omit<CatracaRedemption, "id" | "createdAt" | "status" | "checkInAt" | "checkOutAt">) => CatracaRedemption;
  checkInCatraca: (id: string) => void;
  checkOutCatraca: (id: string) => void;

  quoteRequests: QuoteRequest[];
  addQuoteRequest: (quote: Omit<QuoteRequest, "id" | "createdAt" | "status">) => QuoteRequest;
  updateQuoteRequest: (id: string, patch: Partial<QuoteRequest>) => void;

  toast: string | null;
  showToast: (msg: string) => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(loadState);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Falha ao salvar o estado no localStorage", err);
      showToast("Não foi possível salvar: armazenamento local cheio. Tente remover uma foto grande.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId) ?? null;
  const currentUser = state.users.find((u) => u.profileId === state.currentProfileId && u.active) ?? null;

  const setCurrentProfileId = (id: string) => {
    setState((s) => ({ ...s, currentProfileId: id }));
  };

  const hasPageAccess: AppDataValue["hasPageAccess"] = (pageId, action = "ver") => {
    const perm = currentProfile?.permissions[pageId];
    return !!perm?.[action];
  };

  const addOrder: AppDataValue["addOrder"] = (order) => {
    let created!: Order;
    setState((s) => {
      const num = s.nextOrderNum + 1;
      const id = order.id ?? `#NEW-${15000 + num}`;
      created = {
        status: "Solicitado",
        qty: "—",
        datetime: "A definir",
        value: "—",
        createdAt: new Date().toISOString(),
        history: [{ label: "Pedido criado", time: new Date().toLocaleString("pt-BR") }],
        ...order,
        id,
      } as Order;
      return { ...s, orders: [created, ...s.orders], nextOrderNum: num };
    });
    return created;
  };

  const updateOrder: AppDataValue["updateOrder"] = (id, patch) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== id) return o;
        const next = { ...o, ...patch };
        if (patch.status && patch.status !== o.status) {
          next.history = [...(o.history ?? []), { label: `Status alterado para "${patch.status}"`, time: new Date().toLocaleString("pt-BR") }];
        }
        return next;
      }),
    }));
  };

  const cancelOrder = (id: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === id
          ? { ...o, status: "Cancelado" as const, history: [...(o.history ?? []), { label: "Pedido cancelado", time: new Date().toLocaleString("pt-BR") }] }
          : o,
      ),
    }));
    showToast("Pedido cancelado.");
  };

  const duplicateOrder = (id: string) => {
    setState((s) => {
      const original = s.orders.find((o) => o.id === id);
      if (!original) return s;
      const num = s.nextOrderNum + 1;
      const copy: Order = {
        ...original,
        id: `#DUP-${15000 + num}`,
        status: "Solicitado",
        createdAt: new Date().toISOString(),
        history: [{ label: "Pedido duplicado", time: new Date().toLocaleString("pt-BR") }],
      };
      return { ...s, orders: [copy, ...s.orders], nextOrderNum: num };
    });
    showToast("Pedido duplicado.");
  };

  const addNotification: AppDataValue["addNotification"] = (title) => {
    setState((s) => ({
      ...s,
      notifications: [{ id: `notif${Date.now()}`, title, time: new Date().toLocaleString("pt-BR"), read: false }, ...s.notifications],
    }));
  };

  const markAllNotificationsRead = () => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const toggleFavorite = (id: string) => {
    setState((s) => {
      const favs = new Set(s.favorites);
      favs.has(id) ? favs.delete(id) : favs.add(id);
      return { ...s, favorites: Array.from(favs) };
    });
  };

  const dismissPopup = (id: string) => {
    setState((s) => (s.dismissedPopupIds.includes(id) ? s : { ...s, dismissedPopupIds: [...s.dismissedPopupIds, id] }));
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const mine: ChatMessage = { id: `m${Date.now()}`, from: "me", text };
    setState((s) => ({ ...s, chatMessages: [...s.chatMessages, mine] }));
    setTimeout(() => {
      setState((s) => ({
        ...s,
        chatMessages: [
          ...s.chatMessages,
          { id: `m${Date.now()}`, from: "them", text: "Recebido! Já te retorno por aqui." },
        ],
      }));
    }, 900);
  };

  const addSurveyQuestion: AppDataValue["addSurveyQuestion"] = (text, type, orderCategory) => {
    setState((s) => ({
      ...s,
      surveyQuestions: [...s.surveyQuestions, { id: `q${Date.now()}`, text, type, active: true, orderCategory }],
    }));
  };

  const updateSurveyQuestion = (id: string, patch: Partial<SurveyQuestion>) => {
    setState((s) => ({
      ...s,
      surveyQuestions: s.surveyQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  const removeSurveyQuestion = (id: string) => {
    setState((s) => ({ ...s, surveyQuestions: s.surveyQuestions.filter((q) => q.id !== id) }));
  };

  const reorderSurveyQuestion = (id: string, dir: -1 | 1) => {
    setState((s) => {
      const list = [...s.surveyQuestions];
      const idx = list.findIndex((q) => q.id === id);
      if (idx < 0) return s;
      const category = list[idx].orderCategory;
      let swapIdx = idx + dir;
      while (swapIdx >= 0 && swapIdx < list.length && list[swapIdx].orderCategory !== category) swapIdx += dir;
      if (swapIdx < 0 || swapIdx >= list.length) return s;
      [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
      return { ...s, surveyQuestions: list };
    });
  };

  const addSurveyResponse: AppDataValue["addSurveyResponse"] = (response) => {
    setState((s) => ({
      ...s,
      surveyResponses: [{ ...response, id: `resp${Date.now()}`, createdAt: new Date().toISOString() }, ...s.surveyResponses],
    }));
  };

  const addSupplier: AppDataValue["addSupplier"] = (supplier) => {
    setState((s) => ({ ...s, suppliers: [{ ...supplier, id: `sup${Date.now()}` }, ...s.suppliers] }));
  };
  const updateSupplier: AppDataValue["updateSupplier"] = (id, patch) => {
    setState((s) => ({ ...s, suppliers: s.suppliers.map((sup) => (sup.id === id ? { ...sup, ...patch } : sup)) }));
  };
  const removeSupplier = (id: string) => {
    setState((s) => ({ ...s, suppliers: s.suppliers.filter((sup) => sup.id !== id) }));
  };

  const addProduct: AppDataValue["addProduct"] = (product) => {
    const price = computeProductPrice(product.costPrice, product.marginPercent);
    setState((s) => ({ ...s, products: [{ ...product, price, id: `prod${Date.now()}` }, ...s.products] }));
  };
  const updateProduct: AppDataValue["updateProduct"] = (id, patch) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...patch };
        return { ...merged, price: computeProductPrice(merged.costPrice, merged.marginPercent) };
      }),
    }));
  };
  const removeProduct = (id: string) => {
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  };

  const addKit: AppDataValue["addKit"] = (kit) => {
    setState((s) => ({ ...s, kits: [{ ...kit, id: `kit${Date.now()}` }, ...s.kits] }));
  };
  const updateKit: AppDataValue["updateKit"] = (id, patch) => {
    setState((s) => ({ ...s, kits: s.kits.map((k) => (k.id === id ? { ...k, ...patch } : k)) }));
  };
  const removeKit = (id: string) => {
    setState((s) => ({ ...s, kits: s.kits.filter((k) => k.id !== id) }));
  };

  const addServiceCatalogItem: AppDataValue["addServiceCatalogItem"] = (item) => {
    setState((s) => ({ ...s, serviceCatalog: [{ ...item, id: `svc${Date.now()}` }, ...s.serviceCatalog] }));
  };
  const updateServiceCatalogItem: AppDataValue["updateServiceCatalogItem"] = (id, patch) => {
    setState((s) => ({ ...s, serviceCatalog: s.serviceCatalog.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  };
  const removeServiceCatalogItem = (id: string) => {
    setState((s) => ({ ...s, serviceCatalog: s.serviceCatalog.filter((it) => it.id !== id) }));
  };

  const addDecoration: AppDataValue["addDecoration"] = (item) => {
    setState((s) => ({ ...s, decorations: [{ ...item, id: `dec${Date.now()}` }, ...s.decorations] }));
  };
  const updateDecoration: AppDataValue["updateDecoration"] = (id, patch) => {
    setState((s) => ({ ...s, decorations: s.decorations.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  };
  const removeDecoration = (id: string) => {
    setState((s) => ({ ...s, decorations: s.decorations.filter((it) => it.id !== id) }));
  };

  const addPopup: AppDataValue["addPopup"] = (popup) => {
    setState((s) => ({ ...s, popups: [{ ...popup, id: `pop${Date.now()}`, createdAt: new Date().toISOString() }, ...s.popups] }));
  };
  const updatePopup: AppDataValue["updatePopup"] = (id, patch) => {
    setState((s) => ({ ...s, popups: s.popups.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  };
  const removePopup = (id: string) => {
    setState((s) => ({ ...s, popups: s.popups.filter((p) => p.id !== id) }));
  };

  const addContract: AppDataValue["addContract"] = (contract) => {
    setState((s) => ({ ...s, contracts: [{ ...contract, id: `ctr${Date.now()}` }, ...s.contracts] }));
  };
  const updateContract: AppDataValue["updateContract"] = (id, patch) => {
    setState((s) => ({ ...s, contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };
  const removeContract = (id: string) => {
    setState((s) => ({ ...s, contracts: s.contracts.filter((c) => c.id !== id) }));
  };

  const addAppSurveyQuestion: AppDataValue["addAppSurveyQuestion"] = (question) => {
    setState((s) => ({ ...s, appSurveyQuestions: [...s.appSurveyQuestions, { ...question, id: `aq${Date.now()}` }] }));
  };
  const updateAppSurveyQuestion: AppDataValue["updateAppSurveyQuestion"] = (id, patch) => {
    setState((s) => ({ ...s, appSurveyQuestions: s.appSurveyQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  };
  const removeAppSurveyQuestion = (id: string) => {
    setState((s) => ({ ...s, appSurveyQuestions: s.appSurveyQuestions.filter((q) => q.id !== id) }));
  };

  const addPremiumEvent: AppDataValue["addPremiumEvent"] = (event) => {
    setState((s) => ({
      ...s,
      premiumEvents: [{ ...event, id: `pev${Date.now()}`, createdAt: new Date().toISOString() }, ...s.premiumEvents],
    }));
  };
  const updatePremiumEvent: AppDataValue["updatePremiumEvent"] = (id, patch) => {
    setState((s) => ({ ...s, premiumEvents: s.premiumEvents.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  };
  const removePremiumEvent = (id: string) => {
    setState((s) => ({ ...s, premiumEvents: s.premiumEvents.filter((e) => e.id !== id) }));
  };

  const addProfile: AppDataValue["addProfile"] = (profile) => {
    setState((s) => ({ ...s, profiles: [{ ...profile, id: `prof${Date.now()}` }, ...s.profiles] }));
  };
  const updateProfile: AppDataValue["updateProfile"] = (id, patch) => {
    setState((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  };
  const removeProfile = (id: string) => {
    setState((s) => ({ ...s, profiles: s.profiles.filter((p) => p.id !== id) }));
  };
  const setProfilePagePermission: AppDataValue["setProfilePagePermission"] = (profileId, pageId, patch) => {
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => {
        if (p.id !== profileId) return p;
        const current = p.permissions[pageId] ?? EMPTY_PAGE_PERMISSION;
        const nextPerm = { ...current, ...patch };
        return { ...p, permissions: { ...p.permissions, [pageId]: nextPerm } };
      }),
    }));
  };

  const addUser: AppDataValue["addUser"] = (user) => {
    setState((s) => ({ ...s, users: [{ ...user, id: `user${Date.now()}`, createdAt: new Date().toISOString() }, ...s.users] }));
  };
  const updateUser: AppDataValue["updateUser"] = (id, patch) => {
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  };
  const removeUser = (id: string) => {
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  };
  const resetUserPassword = (id: string) => {
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, lastPasswordResetAt: new Date().toISOString() } : u)) }));
    showToast("Senha redefinida. Um e-mail com instruções foi enviado ao usuário.");
  };

  const addSegment: AppDataValue["addSegment"] = (segment) => {
    setState((s) => ({ ...s, segments: [{ ...segment, id: `seg${Date.now()}` }, ...s.segments] }));
  };
  const updateSegment: AppDataValue["updateSegment"] = (id, patch) => {
    setState((s) => ({ ...s, segments: s.segments.map((seg) => (seg.id === id ? { ...seg, ...patch } : seg)) }));
  };
  const removeSegment = (id: string) => {
    setState((s) => ({ ...s, segments: s.segments.filter((seg) => seg.id !== id) }));
  };

  const addBusinessUnit: AppDataValue["addBusinessUnit"] = (unit) => {
    setState((s) => ({ ...s, businessUnits: [{ ...unit, id: `unit${Date.now()}` }, ...s.businessUnits] }));
  };
  const updateBusinessUnit: AppDataValue["updateBusinessUnit"] = (id, patch) => {
    setState((s) => ({ ...s, businessUnits: s.businessUnits.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  };
  const removeBusinessUnit = (id: string) => {
    setState((s) => ({ ...s, businessUnits: s.businessUnits.filter((u) => u.id !== id) }));
  };

  const addBrand: AppDataValue["addBrand"] = (brand) => {
    setState((s) => ({ ...s, brands: [{ ...brand, id: `brand${Date.now()}` }, ...s.brands] }));
  };
  const updateBrand: AppDataValue["updateBrand"] = (id, patch) => {
    setState((s) => ({ ...s, brands: s.brands.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  };
  const removeBrand = (id: string) => {
    setState((s) => ({ ...s, brands: s.brands.filter((b) => b.id !== id) }));
  };

  const addCompany: AppDataValue["addCompany"] = (company) => {
    setState((s) => ({ ...s, companies: [{ ...company, id: `comp${Date.now()}` }, ...s.companies] }));
  };
  const updateCompany: AppDataValue["updateCompany"] = (id, patch) => {
    setState((s) => ({ ...s, companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };
  const removeCompany = (id: string) => {
    setState((s) => ({ ...s, companies: s.companies.filter((c) => c.id !== id) }));
  };

  const addBranch: AppDataValue["addBranch"] = (branch) => {
    setState((s) => ({ ...s, branches: [{ ...branch, id: `branch${Date.now()}` }, ...s.branches] }));
  };
  const updateBranch: AppDataValue["updateBranch"] = (id, patch) => {
    setState((s) => ({ ...s, branches: s.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  };
  const removeBranch = (id: string) => {
    setState((s) => ({ ...s, branches: s.branches.filter((b) => b.id !== id) }));
  };

  const addCostCenter: AppDataValue["addCostCenter"] = (costCenter) => {
    setState((s) => ({ ...s, costCenters: [{ ...costCenter, id: `cc${Date.now()}` }, ...s.costCenters] }));
  };
  const updateCostCenter: AppDataValue["updateCostCenter"] = (id, patch) => {
    setState((s) => ({ ...s, costCenters: s.costCenters.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };
  const removeCostCenter = (id: string) => {
    setState((s) => ({ ...s, costCenters: s.costCenters.filter((c) => c.id !== id) }));
  };

  const addCopa: AppDataValue["addCopa"] = (copa) => {
    setState((s) => ({ ...s, copas: [{ ...copa, id: `copa${Date.now()}` }, ...s.copas] }));
  };
  const updateCopa: AppDataValue["updateCopa"] = (id, patch) => {
    setState((s) => ({ ...s, copas: s.copas.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };
  const removeCopa = (id: string) => {
    setState((s) => ({ ...s, copas: s.copas.filter((c) => c.id !== id) }));
  };

  const addOccurrence: AppDataValue["addOccurrence"] = (occurrence) => {
    setState((s) => ({
      ...s,
      occurrences: [{ ...occurrence, id: `occ${Date.now()}`, createdAt: new Date().toISOString() }, ...s.occurrences],
    }));
  };
  const updateOccurrence: AppDataValue["updateOccurrence"] = (id, patch) => {
    setState((s) => ({ ...s, occurrences: s.occurrences.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  };
  const removeOccurrence = (id: string) => {
    setState((s) => ({ ...s, occurrences: s.occurrences.filter((o) => o.id !== id) }));
  };

  const addAssetType: AppDataValue["addAssetType"] = (assetType) => {
    setState((s) => ({ ...s, assetTypes: [{ ...assetType, id: `atype${Date.now()}` }, ...s.assetTypes] }));
  };
  const updateAssetType: AppDataValue["updateAssetType"] = (id, patch) => {
    setState((s) => ({ ...s, assetTypes: s.assetTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  };
  const removeAssetType = (id: string) => {
    setState((s) => ({ ...s, assetTypes: s.assetTypes.filter((t) => t.id !== id) }));
  };

  const addAsset: AppDataValue["addAsset"] = (asset) => {
    let created!: Asset;
    setState((s) => {
      created = { ...asset, id: `asset${Date.now()}`, createdAt: new Date().toISOString() };
      return { ...s, assets: [created, ...s.assets] };
    });
    return created;
  };
  const updateAsset: AppDataValue["updateAsset"] = (id, patch) => {
    setState((s) => ({ ...s, assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  };
  const removeAsset = (id: string) => {
    setState((s) => ({ ...s, assets: s.assets.filter((a) => a.id !== id) }));
  };

  const addAssetMovement: AppDataValue["addAssetMovement"] = (movement) => {
    setState((s) => {
      const record: AssetMovement = { ...movement, id: `amove${Date.now()}`, createdAt: new Date().toISOString() };
      return {
        ...s,
        assetMovements: [record, ...s.assetMovements],
        assets: s.assets.map((a) =>
          a.id === movement.assetId
            ? { ...a, lastMovementKind: movement.kind, currentLocation: movement.location ?? a.currentLocation, costCenterCode: movement.costCenterCode ?? a.costCenterCode }
            : a,
        ),
      };
    });
  };

  const addCatracaRedemption: AppDataValue["addCatracaRedemption"] = (redemption) => {
    let created!: CatracaRedemption;
    setState((s) => {
      created = { ...redemption, id: `catraca${Date.now()}`, status: "Aguardando retirada", createdAt: new Date().toISOString() };
      return { ...s, catracaRedemptions: [created, ...s.catracaRedemptions] };
    });
    return created;
  };
  const checkInCatraca = (id: string) => {
    setState((s) => ({
      ...s,
      catracaRedemptions: s.catracaRedemptions.map((r) =>
        r.id === id && r.status === "Aguardando retirada" ? { ...r, status: "Check-in realizado" as CatracaStatus, checkInAt: new Date().toISOString() } : r,
      ),
    }));
  };
  const checkOutCatraca = (id: string) => {
    setState((s) => ({
      ...s,
      catracaRedemptions: s.catracaRedemptions.map((r) =>
        r.id === id && r.status === "Check-in realizado" ? { ...r, status: "Check-out realizado" as CatracaStatus, checkOutAt: new Date().toISOString() } : r,
      ),
    }));
  };

  const addQuoteRequest: AppDataValue["addQuoteRequest"] = (quote) => {
    let created!: QuoteRequest;
    setState((s) => {
      created = { ...quote, id: `quote${Date.now()}`, status: "Solicitado", createdAt: new Date().toISOString() };
      return { ...s, quoteRequests: [created, ...s.quoteRequests] };
    });
    return created;
  };
  const updateQuoteRequest: AppDataValue["updateQuoteRequest"] = (id, patch) => {
    setState((s) => ({ ...s, quoteRequests: s.quoteRequests.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  };

  const updateOperatingParameters: AppDataValue["updateOperatingParameters"] = (patch) => {
    setState((s) => ({ ...s, operatingParameters: { ...s.operatingParameters, ...patch } }));
  };

  const updateServiceParameters: AppDataValue["updateServiceParameters"] = (category, patch) => {
    setState((s) => ({
      ...s,
      serviceParameters: s.serviceParameters.map((sp) => (sp.category === category ? { ...sp, ...patch } : sp)),
    }));
  };

  const toggleStatusFlowVisibility: AppDataValue["toggleStatusFlowVisibility"] = (status) => {
    setState((s) => ({ ...s, statusFlowVisibility: { ...s.statusFlowVisibility, [status]: !s.statusFlowVisibility[status] } }));
  };

  const value = useMemo<AppDataValue>(
    () => ({
      currentProfileId: state.currentProfileId,
      setCurrentProfileId,
      currentProfile,
      currentUser,
      hasPageAccess,
      orders: state.orders,
      addOrder,
      updateOrder,
      cancelOrder,
      duplicateOrder,
      notifications: state.notifications,
      markAllNotificationsRead,
      addNotification,
      favorites: new Set(state.favorites),
      toggleFavorite,
      chatMessages: state.chatMessages,
      sendChatMessage,
      surveyQuestions: state.surveyQuestions,
      addSurveyQuestion,
      updateSurveyQuestion,
      removeSurveyQuestion,
      reorderSurveyQuestion,
      surveyResponses: state.surveyResponses,
      addSurveyResponse,
      suppliers: state.suppliers,
      addSupplier,
      updateSupplier,
      removeSupplier,
      products: state.products,
      addProduct,
      updateProduct,
      removeProduct,
      kits: state.kits,
      addKit,
      updateKit,
      removeKit,
      serviceCatalog: state.serviceCatalog,
      addServiceCatalogItem,
      updateServiceCatalogItem,
      removeServiceCatalogItem,
      decorations: state.decorations,
      addDecoration,
      updateDecoration,
      removeDecoration,
      popups: state.popups,
      addPopup,
      updatePopup,
      removePopup,
      dismissedPopupIds: new Set(state.dismissedPopupIds),
      dismissPopup,
      contracts: state.contracts,
      addContract,
      updateContract,
      removeContract,
      appSurveyQuestions: state.appSurveyQuestions,
      addAppSurveyQuestion,
      updateAppSurveyQuestion,
      removeAppSurveyQuestion,
      premiumEvents: state.premiumEvents,
      addPremiumEvent,
      updatePremiumEvent,
      removePremiumEvent,
      profiles: state.profiles,
      addProfile,
      updateProfile,
      removeProfile,
      setProfilePagePermission,
      users: state.users,
      addUser,
      updateUser,
      removeUser,
      resetUserPassword,
      segments: state.segments,
      addSegment,
      updateSegment,
      removeSegment,
      businessUnits: state.businessUnits,
      addBusinessUnit,
      updateBusinessUnit,
      removeBusinessUnit,
      brands: state.brands,
      addBrand,
      updateBrand,
      removeBrand,
      companies: state.companies,
      addCompany,
      updateCompany,
      removeCompany,
      branches: state.branches,
      addBranch,
      updateBranch,
      removeBranch,
      costCenters: state.costCenters,
      addCostCenter,
      updateCostCenter,
      removeCostCenter,
      copas: state.copas,
      addCopa,
      updateCopa,
      removeCopa,
      occurrences: state.occurrences,
      addOccurrence,
      updateOccurrence,
      removeOccurrence,
      operatingParameters: state.operatingParameters,
      updateOperatingParameters,
      serviceParameters: state.serviceParameters,
      updateServiceParameters,
      statusFlowVisibility: state.statusFlowVisibility,
      toggleStatusFlowVisibility,
      assetTypes: state.assetTypes,
      addAssetType,
      updateAssetType,
      removeAssetType,
      assets: state.assets,
      addAsset,
      updateAsset,
      removeAsset,
      assetMovements: state.assetMovements,
      addAssetMovement,
      catracaRedemptions: state.catracaRedemptions,
      addCatracaRedemption,
      checkInCatraca,
      checkOutCatraca,
      quoteRequests: state.quoteRequests,
      addQuoteRequest,
      updateQuoteRequest,
      toast,
      showToast,
    }),
    [state, toast],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
