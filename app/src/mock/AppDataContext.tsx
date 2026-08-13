import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  EMPTY_PAGE_PERMISSION,
  type AppUser,
  type ChatMessage,
  type CostCenter,
  type Kit,
  type Notification,
  type Occurrence,
  type Order,
  type PagePermission,
  type Product,
  type Profile,
  type ServiceCatalogItem,
  type Supplier,
  type SurveyQuestion,
} from "../types";
import { computeProductPrice } from "./pricing";

const STORAGE_KEY = "sodexo-eventos-mock-v1";

interface StoredState {
  orders: Order[];
  notifications: Notification[];
  favorites: string[];
  chatMessages: ChatMessage[];
  surveyQuestions: SurveyQuestion[];
  suppliers: Supplier[];
  products: Product[];
  kits: Kit[];
  serviceCatalog: ServiceCatalogItem[];
  profiles: Profile[];
  users: AppUser[];
  costCenters: CostCenter[];
  occurrences: Occurrence[];
  currentProfileId: string;
  nextOrderNum: number;
}

const initialOrders: Order[] = [
  {
    id: "#CB-15234",
    category: "Coffee Break",
    type: "Coffee Break Executivo",
    mono: "CB",
    qty: "20 pessoas",
    peopleCount: 20,
    datetime: "24/07/2026 14:00",
    status: "Aguardando aprovação",
    value: "R$ 240,00",
    valueNumber: 240,
    location: "Sala 1",
    eventTime: "14:00",
    createdAt: "2026-07-20T10:00:00Z",
    requiresApproval: true,
    history: [
      { label: "Pedido criado", time: "20/07/2026 09:12" },
      { label: "Aguardando aprovação do gestor", time: "20/07/2026 09:12" },
    ],
  },
  {
    id: "#LAN-15210",
    category: "Lanche",
    type: "Lanche Individual",
    mono: "LA",
    qty: "15 unidades",
    peopleCount: 15,
    datetime: "25/07/2026 12:30",
    status: "Em preparação",
    value: "R$ 187,50",
    valueNumber: 187.5,
    createdAt: "2026-07-19T15:00:00Z",
    history: [
      { label: "Pedido criado", time: "19/07/2026 15:00" },
      { label: "Em preparação", time: "24/07/2026 08:00" },
    ],
  },
  {
    id: "#EVT-15188",
    category: "Evento",
    type: "Evento Especial",
    mono: "EE",
    qty: "30 pessoas",
    peopleCount: 30,
    datetime: "28/07/2026 09:00",
    status: "Solicitado",
    value: "R$ 1.250,00",
    valueNumber: 1250,
    createdAt: "2026-07-18T11:00:00Z",
    history: [{ label: "Pedido criado", time: "18/07/2026 11:00" }],
  },
  {
    id: "#CB-15150",
    category: "Coffee Break",
    type: "Coffee Break Executivo",
    mono: "CB",
    qty: "25 pessoas",
    peopleCount: 25,
    datetime: "10/07/2026 09:00",
    status: "Finalizado",
    value: "R$ 300,00",
    valueNumber: 300,
    createdAt: "2026-07-05T10:00:00Z",
    costCenters: [{ code: "CC001", percent: 100 }],
    billingStatus: "Fechado",
    history: [{ label: "Pedido criado", time: "05/07/2026 10:00" }, { label: "Finalizado", time: "10/07/2026 10:30" }],
  },
  {
    id: "#AG-15142",
    category: "Água",
    type: "Água Mineral",
    mono: "AG",
    qty: "40 unidades",
    peopleCount: 40,
    datetime: "08/07/2026 08:00",
    status: "Entregue",
    value: "R$ 140,00",
    valueNumber: 140,
    createdAt: "2026-07-03T09:00:00Z",
    costCenters: [{ code: "CC003", percent: 100 }],
    billingStatus: "Pendente",
    history: [{ label: "Pedido criado", time: "03/07/2026 09:00" }, { label: "Entregue", time: "08/07/2026 08:20" }],
  },
  {
    id: "#AB-15095",
    category: "Abastecimento",
    type: "Abastecimento Simples",
    mono: "AB",
    qty: "1 lote",
    datetime: "01/07/2026 08:00",
    status: "Finalizado",
    value: "R$ 420,00",
    valueNumber: 420,
    createdAt: "2026-06-28T09:00:00Z",
    costCenters: [{ code: "CC002", percent: 60 }, { code: "CC001", percent: 40 }],
    billingStatus: "Enviado ao ERP",
    history: [{ label: "Pedido criado", time: "28/06/2026 09:00" }, { label: "Finalizado", time: "01/07/2026 08:30" }],
  },
];

const initialNotifications: Notification[] = [
  { id: "n1", title: "Pedido #CB-15234 aguardando aprovação", time: "há 2 horas", read: false },
  { id: "n2", title: "Evento Especial confirmado para 28/07", time: "há 5 horas", read: false },
  { id: "n3", title: "Novo catálogo de refeições disponível", time: "ontem", read: false },
];

const initialSurveyQuestions: SurveyQuestion[] = [
  { id: "q1", text: "De 0 a 10, quanto você recomendaria nosso serviço?", type: "NPS", active: true },
  { id: "q2", text: "Como você avalia a qualidade dos alimentos?", type: "Estrelas", active: true },
  { id: "q3", text: "Como você avalia a pontualidade da entrega?", type: "Estrelas", active: true },
  { id: "q4", text: "Como você avalia o atendimento da equipe?", type: "Estrelas", active: true },
  { id: "q5", text: "Deixe um comentário sobre sua experiência", type: "Texto", active: true },
];

const initialChat: ChatMessage[] = [
  { id: "c1", from: "them", text: "Oi, eu sou a responsável Sodexo da sua unidade, em que posso ajudar?" },
];

const initialSuppliers: Supplier[] = [
  { id: "sup1", name: "Distribuidora Boa Mesa Ltda.", category: "Alimentos e Bebidas", cnpj: "12.345.678/0001-90", contactName: "Roberto Alves", phone: "(11) 4002-8922", email: "contato@boamesa.com.br", active: true },
  { id: "sup2", name: "EcoPack Descartáveis", category: "Descartáveis", cnpj: "23.456.789/0001-01", contactName: "Fernanda Lima", phone: "(11) 3333-4455", email: "vendas@ecopack.com.br", active: true },
  { id: "sup3", name: "Higienize Serviços de Limpeza", category: "Limpeza", cnpj: "34.567.890/0001-12", contactName: "Marcos Vinícius", phone: "(11) 2222-1199", email: "marcos@higienize.com.br", active: true },
];

function product(base: Omit<Product, "price">): Product {
  return { ...base, price: computeProductPrice(base.costPrice, base.marginPercent) };
}

const initialProducts: Product[] = [
  product({ id: "prod1", name: "Coca-Cola lata 350ml", type: "Bebida", unit: "un", costPrice: 6, marginPercent: 40, description: "Refrigerante em lata.", supplierId: "sup1", active: true }),
  product({ id: "prod2", name: "Água Mineral 500ml", type: "Bebida", unit: "un", costPrice: 3.5, marginPercent: 50, description: "Sem gás.", supplierId: "sup1", active: true }),
  product({ id: "prod3", name: "Mini Salgados (100 unidades)", type: "Salgado", unit: "pacote", costPrice: 60, marginPercent: 40, description: "Sortidos, assados.", supplierId: "sup1", active: true }),
  product({ id: "prod4", name: "Copo descartável 200ml", type: "Descartável", unit: "pacote", costPrice: 7, marginPercent: 45, description: "Pacote com 100 unidades.", supplierId: "sup2", active: true }),
];

const initialKits: Kit[] = [
  { id: "kit1", name: "Combo Reunião Rápida", description: "Água e salgados para reuniões curtas.", items: [{ productId: "prod2", qty: 10 }, { productId: "prod3", qty: 1 }], serviceFeePercent: 10, active: true },
];

const initialServiceCatalog: ServiceCatalogItem[] = [
  { id: "svc1", name: "Limpeza pós-evento", description: "Limpeza do espaço após o término do evento.", category: "Limpeza", active: true },
  { id: "svc2", name: "Retirada de itens", description: "Recolhimento de utensílios e equipamentos.", category: "Logística", active: true },
  { id: "svc3", name: "Organização de eventos", description: "Apoio completo na montagem e organização.", category: "Organização de Eventos", active: true },
  { id: "svc4", name: "Recepção de convidados", description: "Equipe de recepção na entrada do evento.", category: "Recepção", active: true },
];

/** Monta o mapa de permissões de um perfil só para as páginas informadas — as demais ficam sem acesso. */
function perms(entries: Record<string, Partial<PagePermission>>): Record<string, PagePermission> {
  const out: Record<string, PagePermission> = {};
  for (const pageId of Object.keys(entries)) {
    out[pageId] = { ...EMPTY_PAGE_PERMISSION, ...entries[pageId] };
  }
  return out;
}

const ORDER_PAGES = ["pedido-coffee", "pedido-evento", "pedido-agua", "pedido-abastecimento", "surpreenda"];

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
    }),
  },
  {
    id: "prof-gu",
    name: "GU",
    whoIs: "Gerente de Unidade Sodexo.",
    responsibilities: "Confirma pedidos, gerencia a operação, registra status (produção, entrega, finalização), configura regras, conduz o faturamento.",
    active: true,
    permissions: perms({
      home: { ver: true },
      pedidos: { ver: true, criarEditar: true, aprovar: true },
      producao: { ver: true, criarEditar: true, aprovar: true },
      aprovacoes: { ver: true, aprovar: true },
      "admin-operacao": { ver: true },
      "admin-relatorios": { ver: true },
      "admin-produtos": { ver: true, criarEditar: true },
      "admin-kits": { ver: true, criarEditar: true },
      "admin-servicos": { ver: true, criarEditar: true },
      "admin-fornecedores": { ver: true, criarEditar: true },
      "admin-pesquisa": { ver: true, criarEditar: true },
      "admin-usuarios": { ver: true },
      "admin-permissoes": { ver: true },
      "admin-faturamento": { ver: true, criarEditar: true, aprovar: true },
      "admin-centros-custo": { ver: true },
      "admin-ocorrencias": { ver: true, criarEditar: true },
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
    }),
  },
  {
    id: "prof-faturamento",
    name: "Faturamento / Backoffice",
    whoIs: "Apoio Administrativo; Ponto Focal Sodexo; GU; outros.",
    responsibilities: "Realiza o fechamento, aprova com cliente e carrega no ERP para geração do faturamento.",
    active: true,
    permissions: perms({
      "admin-faturamento": { ver: true, criarEditar: true, aprovar: true },
      "admin-relatorios": { ver: true },
      "admin-centros-custo": { ver: true },
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
];

const initialUsers: AppUser[] = [
  { id: "user1", name: "Bárbara C. Ribeiro", email: "barbara.ribeiro@sodexo.com", profileId: "prof-gu", active: true, createdAt: "2026-01-12T09:00:00Z" },
  { id: "user2", name: "Marina Silva", email: "marina.silva@sodexo.com", profileId: "prof-gu", active: true, createdAt: "2026-02-03T09:00:00Z" },
  { id: "user3", name: "Carlos Santos", email: "carlos.santos@clienteempresa.com", profileId: "prof-gestor", active: true, createdAt: "2026-02-10T09:00:00Z" },
  { id: "user4", name: "Paula Costa", email: "paula.costa@clienteempresa.com", profileId: "prof-gestor", active: true, createdAt: "2026-02-10T09:00:00Z" },
  { id: "user5", name: "Ana Beatriz Lima", email: "ana.lima@clienteempresa.com", profileId: "prof-cliente", active: true, createdAt: "2026-03-01T09:00:00Z" },
  { id: "user6", name: "João Pedro Nunes", email: "joao.nunes@sodexo.com", profileId: "prof-producao", active: true, createdAt: "2026-03-05T09:00:00Z" },
  { id: "user7", name: "Fernanda Costa", email: "fernanda.costa@sodexo.com", profileId: "prof-faturamento", active: true, createdAt: "2026-03-08T09:00:00Z" },
];

const initialCostCenters: CostCenter[] = [
  { id: "cc1", code: "CC001", name: "Administrativo", manager: "Carlos Santos", active: true },
  { id: "cc2", code: "CC002", name: "Comercial", manager: "Paula Costa", active: true },
  { id: "cc3", code: "CC003", name: "Operações", manager: "Marina Silva", active: true },
];

const initialOccurrences: Occurrence[] = [
  {
    id: "occ1",
    orderId: "#LAN-15210",
    type: "Atraso na entrega",
    severity: "Média",
    status: "Em análise",
    description: "Entrega chegou 40 minutos após o horário combinado.",
    reportedBy: "Ana Beatriz Lima",
    createdAt: "2026-07-24T09:30:00Z",
  },
  {
    id: "occ2",
    orderId: "#CB-15234",
    type: "Item incorreto ou faltando",
    severity: "Baixa",
    status: "Aberta",
    description: "Faltaram guardanapos no kit entregue.",
    reportedBy: "Carlos Santos",
    createdAt: "2026-07-25T08:10:00Z",
  },
  {
    id: "occ3",
    orderId: "#EVT-15188",
    type: "Qualidade do produto",
    severity: "Alta",
    status: "Resolvida",
    description: "Salgados chegaram frios; equipe de produção foi orientada sobre o transporte.",
    reportedBy: "João Pedro Nunes",
    createdAt: "2026-07-18T14:00:00Z",
    resolutionNotes: "Troca de embalagem térmica para o fornecedor a partir do próximo evento.",
    resolvedAt: "2026-07-19T11:00:00Z",
  },
];

const defaultState: StoredState = {
  orders: initialOrders,
  notifications: initialNotifications,
  favorites: ["cb", "la", "sa", "rn"],
  chatMessages: initialChat,
  surveyQuestions: initialSurveyQuestions,
  suppliers: initialSuppliers,
  products: initialProducts,
  kits: initialKits,
  serviceCatalog: initialServiceCatalog,
  profiles: initialProfiles,
  users: initialUsers,
  costCenters: initialCostCenters,
  occurrences: initialOccurrences,
  currentProfileId: "prof-cliente",
  nextOrderNum: 300,
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

  favorites: Set<string>;
  toggleFavorite: (id: string) => void;

  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;

  surveyQuestions: SurveyQuestion[];
  addSurveyQuestion: (text: string, type: SurveyQuestion["type"]) => void;
  updateSurveyQuestion: (id: string, patch: Partial<SurveyQuestion>) => void;
  removeSurveyQuestion: (id: string) => void;
  reorderSurveyQuestion: (id: string, dir: -1 | 1) => void;

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

  costCenters: CostCenter[];
  addCostCenter: (costCenter: Omit<CostCenter, "id">) => void;
  updateCostCenter: (id: string, patch: Partial<CostCenter>) => void;
  removeCostCenter: (id: string) => void;

  occurrences: Occurrence[];
  addOccurrence: (occurrence: Omit<Occurrence, "id" | "createdAt">) => void;
  updateOccurrence: (id: string, patch: Partial<Occurrence>) => void;
  removeOccurrence: (id: string) => void;

  toast: string | null;
  showToast: (msg: string) => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(loadState);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 2600);
  };

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
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  const cancelOrder = (id: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: "Cancelado" as const } : o)),
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

  const addSurveyQuestion = (text: string, type: SurveyQuestion["type"]) => {
    setState((s) => ({
      ...s,
      surveyQuestions: [...s.surveyQuestions, { id: `q${Date.now()}`, text, type, active: true }],
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
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= list.length) return s;
      [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
      return { ...s, surveyQuestions: list };
    });
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

  const addCostCenter: AppDataValue["addCostCenter"] = (costCenter) => {
    setState((s) => ({ ...s, costCenters: [{ ...costCenter, id: `cc${Date.now()}` }, ...s.costCenters] }));
  };
  const updateCostCenter: AppDataValue["updateCostCenter"] = (id, patch) => {
    setState((s) => ({ ...s, costCenters: s.costCenters.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };
  const removeCostCenter = (id: string) => {
    setState((s) => ({ ...s, costCenters: s.costCenters.filter((c) => c.id !== id) }));
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
      favorites: new Set(state.favorites),
      toggleFavorite,
      chatMessages: state.chatMessages,
      sendChatMessage,
      surveyQuestions: state.surveyQuestions,
      addSurveyQuestion,
      updateSurveyQuestion,
      removeSurveyQuestion,
      reorderSurveyQuestion,
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
      costCenters: state.costCenters,
      addCostCenter,
      updateCostCenter,
      removeCostCenter,
      occurrences: state.occurrences,
      addOccurrence,
      updateOccurrence,
      removeOccurrence,
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
