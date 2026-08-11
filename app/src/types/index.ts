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
