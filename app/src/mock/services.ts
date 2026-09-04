import type { Order, Service } from "../types";

export const SERVICES: Service[] = [
  {
    id: "as",
    name: "Abastecimento Simples",
    desc: "Solicite abastecimentos simples.",
    mono: "AS",
    iconPath: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    route: "/pedido/abastecimento-simples",
  },
  {
    id: "cb",
    name: "Coffee Break",
    desc: "Solicite coffee break para eventos e reuniões.",
    mono: "CB",
    iconPath:
      "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3",
    route: "/pedido/coffee-break",
  },
  {
    id: "cc",
    name: "Consumo Catraca",
    desc: "Escolha sua refeição e o horário de retirada no restaurante.",
    mono: "CC",
    iconPath: "M22 12h-4l-3 9L9 3l-3 9H2",
    route: "/consumo-catraca",
  },
  {
    id: "or",
    name: "Solicitar Orçamento",
    desc: "Conte o que você precisa e receba um orçamento personalizado da nossa equipe.",
    mono: "OR",
    iconPath: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h11",
    route: "/solicitar-orcamento",
  },
  {
    id: "ee",
    name: "Evento Especial",
    desc: "Solicite eventos especiais.",
    mono: "EE",
    iconPath:
      "M3 10h18M16 2v4M8 2v4M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    route: "/pedido/evento-especial",
  },
  {
    id: "la",
    name: "Lanche",
    desc: "Kits de lanche prontos para retirada, com pagamento na hora.",
    mono: "LA",
    iconPath:
      "M3 10h18v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3zM3 10a9 6 0 0118 0M7 15v2M12 15v2M17 15v2",
    route: "/pedido/lanche",
  },
  {
    id: "rr",
    name: "Reserva de Refeição",
    desc: "Reserve refeições normais ou marmitex, com pagamento pelo centro de custo ou na hora.",
    mono: "RR",
    iconPath: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 3",
    route: "/reserva-refeicao",
  },
  {
    id: "sd",
    name: "Serviços Diversos",
    desc: "Solicite os serviços cadastrados no catálogo, como limpeza, recepção e logística.",
    mono: "SD",
    iconPath: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    route: "/pedido/servicos-diversos",
  },
  {
    id: "sp",
    name: "Surpreenda",
    desc: "Kits prontos: café da manhã, tarde, hora extra e aniversariante.",
    mono: "SP",
    iconPath:
      "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
    route: "/surpreenda",
  },
  {
    id: "sa",
    name: "Solicitação de Água",
    desc: "Solicite água para eventos.",
    mono: "SA",
    iconPath: "M8 2h8l-1 9a4 4 0 01-3 3.9V21h3v2H9v-2h3v-6.1a4 4 0 01-3-3.9L8 2z",
    route: "/pedido/agua",
  },
  {
    id: "vv",
    name: "Venda à Vista",
    desc: "Solicite vendas à vista.",
    mono: "VV",
    iconPath: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  },
];

export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  "Aguardando aprovação": { bg: "#fdedd3", color: "#8a5a0f" },
  "Em preparação": { bg: "#dfeaff", color: "#1e4fa3" },
  Solicitado: { bg: "#e9e5f4", color: "#5a4a8a" },
  "Pronto para entrega": { bg: "#e6f5ec", color: "#1a7a4f" },
  Entregue: { bg: "#e6f5ec", color: "#1a7a4f" },
  Finalizado: { bg: "#e6f5ec", color: "#1a7a4f" },
  Cancelado: { bg: "#fbe4e0", color: "#c0392b" },
  Recebido: { bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  "Orçamento enviado": { bg: "#fdedd3", color: "#8a5a0f" },
};

/** Um pedido é considerado "em aberto" enquanto não chega a um estado final (entregue, finalizado ou cancelado). */
export function isOpenOrder(order: Order): boolean {
  return order.status !== "Entregue" && order.status !== "Finalizado" && order.status !== "Cancelado";
}
