import type { Promo } from "../types";

export type PromoItem = Promo & {
  discount?: string;
  route?: string;
};

export const PROMOS: PromoItem[] = [
  {
    id: "combo",
    tag: "NOVIDADE",
    color: "var(--color-primary)",
    bg: "var(--color-primary-soft)",
    title: "Combo Reunião",
    desc: "Um novo combo pensado para reuniões produtivas: coffee break completo com opções quentes e frias, montado em até 2h úteis.",
    fullDesc: "Um novo combo pensado para reuniões produtivas: coffee break completo com opções quentes e frias, montado em até 2h úteis.",
    terms: "Disponível para pedidos com no mínimo 10 pessoas. Sujeito à disponibilidade da unidade de atendimento.",
    validity: "15/08/2026",
    ctaLabel: "Conhecer opções",
    route: "/pedido/coffee-break",
  },
  {
    id: "coffee",
    tag: "PROMOÇÃO",
    color: "#1a7a4f",
    bg: "#e6f5ec",
    title: "Desconto no Coffee Break",
    desc: "Peça para grupos acima de 20 pessoas e ganhe 10% de desconto automático no valor total do pedido.",
    fullDesc: "Peça para grupos acima de 20 pessoas e ganhe 10% de desconto automático no valor total do pedido.",
    terms: "Desconto aplicado automaticamente no carrinho ao atingir 20 pessoas ou mais. Válido para todos os kits de Coffee Break.",
    validity: "31/07/2026",
    discount: "10% OFF",
    ctaLabel: "Aproveitar agora",
    route: "/pedido/coffee-break",
  },
  {
    id: "lanche",
    tag: "NOVIDADE",
    color: "#b5690f",
    bg: "#faf0e3",
    title: "Lanche Saudável",
    desc: "Novas opções de lanches saudáveis chegaram ao cardápio: frutas frescas, mix de castanhas e barrinhas integrais.",
    fullDesc: "Novas opções de lanches saudáveis chegaram ao cardápio: frutas frescas, mix de castanhas e barrinhas integrais.",
    terms: "Novos itens já disponíveis na categoria Lanche ao montar seu próximo pedido.",
    validity: "sem data limite",
    ctaLabel: "Ver opções",
  },
];
