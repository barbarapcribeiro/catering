import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ChatMessage, Notification, Order, SurveyQuestion } from "../types";

const STORAGE_KEY = "sodexo-eventos-mock-v1";

interface StoredState {
  orders: Order[];
  notifications: Notification[];
  favorites: string[];
  chatMessages: ChatMessage[];
  surveyQuestions: SurveyQuestion[];
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

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return {
    orders: initialOrders,
    notifications: initialNotifications,
    favorites: ["cb", "la", "sa", "rn"],
    chatMessages: initialChat,
    surveyQuestions: initialSurveyQuestions,
    nextOrderNum: 300,
  };
}

interface AppDataValue {
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

  const value = useMemo<AppDataValue>(
    () => ({
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
