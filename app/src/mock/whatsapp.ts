import type { Order, PhoneNumber } from "../types";

/** Monta um link wa.me com a mensagem pré-preenchida. Sem telefone, o wa.me deixa a pessoa
 * escolher o contato dentro do próprio WhatsApp — por isso o telefone é opcional aqui. */
export function buildWhatsAppUrl(message: string, phone?: PhoneNumber): string {
  const text = encodeURIComponent(message);
  if (phone && phone.ddd.trim() && phone.number.trim()) {
    const digits = `${phone.country}${phone.ddd}${phone.number}`.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

const HEADER = "🍽️ Direct Eventos — Sodexo";

const CATEGORY_EMOJI: Record<string, string> = {
  "Coffee Break": "☕",
  "Evento Especial": "🎉",
  "Solicitação de Água": "💧",
  "Abastecimento Simples": "🧺",
  Surpreenda: "🎁",
  Lanche: "🥪",
  "Serviços Diversos": "🧹",
  "Consumo Catraca": "🍽️",
  "Reserva de Refeição": "🍱",
};
const DEFAULT_CATEGORY_EMOJI = "🍽️";

interface StatusMeta {
  emoji: string;
  headline: string;
  /** Completa a frase "Seu pedido {id} ({categoria}) {body}". */
  body: string;
  footer: string;
}

const STATUS_META: Record<Order["status"], StatusMeta> = {
  Solicitado: { emoji: "🟡", headline: "Recebemos! 📝", body: "já entrou na nossa fila.", footer: "A gente já tá vendo isso aqui!" },
  "Aguardando aprovação": { emoji: "🟠", headline: "Quase lá! 🙏", body: "tá aguardando aprovação.", footer: "Assim que aprovar, já colocamos pra produzir!" },
  "Em preparação": { emoji: "🟠", headline: "Boa notícia! 🚀", body: "tá saindo do forno agora!", footer: "Falta pouco! ⏱️" },
  "Pronto para entrega": { emoji: "🟢", headline: "Prontinho! 🎉", body: "tá pronto e a caminho até você.", footer: "Já já chega aí!" },
  Entregue: { emoji: "✅", headline: "Chegou! 📬", body: "foi entregue.", footer: "Bom apetite! 😋" },
  Finalizado: { emoji: "🏁", headline: "Terminou! 🎉", body: "foi finalizado.", footer: "Conta pra gente como foi? Responde a pesquisa de satisfação rapidinho! ⭐" },
  Cancelado: { emoji: "🔴", headline: "Aviso 😕", body: "foi cancelado.", footer: "Qualquer dúvida, é só chamar a gente." },
  Recebido: { emoji: "📥", headline: "Recebido! 📥", body: "chegou por aqui.", footer: "Já vamos dar sequência." },
  "Orçamento enviado": { emoji: "🧾", headline: "Orçamento pronto! 🧾", body: "já tem um orçamento esperando por você.", footer: "Dá uma olhada e nos diga o que achou!" },
};

/** "2026-09-04 14:00" -> "04/09 às 14h" (omite os minutos quando são :00; sem data válida, devolve o texto original). */
function formatShortDateTime(datetime: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/.exec(datetime.trim());
  if (!match) return datetime || "—";
  const [, , month, day, hour, minute] = match;
  const dateLabel = `${day}/${month}`;
  if (!hour) return dateLabel;
  const timeLabel = minute !== "00" ? `${hour}h${minute}` : `${hour}h`;
  return `${dateLabel} às ${timeLabel}`;
}

export function orderCreatedMessage(order: Order): string {
  const categoryEmoji = CATEGORY_EMOJI[order.category] ?? DEFAULT_CATEGORY_EMOJI;
  const status = STATUS_META[order.status];
  return [
    HEADER,
    "",
    `Boa! ${categoryEmoji} Seu pedido ${order.id} (${order.category}) tá confirmado!`,
    "",
    `${order.qty} | ${formatShortDateTime(order.datetime)}`,
    `Total: ${order.value}`,
    "",
    `Status: ${status.emoji} ${order.status}`,
    "",
    "A gente já tá vendo isso aqui!",
  ].join("\n");
}

export function orderStatusMessage(order: Order): string {
  const status = STATUS_META[order.status];
  return [
    HEADER,
    "",
    status.headline,
    `Seu pedido ${order.id} (${order.category}) ${status.body}`,
    "",
    `Status: ${status.emoji} ${order.status}`,
    "",
    status.footer,
  ].join("\n");
}

export function gestorApprovalMessage(order: Order, gestorName: string): string {
  const firstName = gestorName.split(" ")[0];
  return [
    HEADER,
    "",
    `Oi ${firstName}! 👋`,
    "",
    "Só falta a sua canetada aqui:",
    "",
    `📦 Pedido: ${order.id} (${order.category})`,
    `💰 Total: ${order.value}`,
    `⏰ Entrega: ${formatShortDateTime(order.datetime)}`,
    "",
    "Aprova aí? 👇",
  ].join("\n");
}

export function guApprovalMessage(order: Order, guName: string): string {
  const firstName = guName.split(" ")[0];
  return [
    HEADER,
    "",
    `Oi ${firstName}! 👀`,
    "",
    "Seu turno chegou! Pedido tá prontinho na sua fila:",
    "",
    `📦 Pedido: ${order.id} (${order.category})`,
    `💰 Total: ${order.value}`,
    "🔍 Precisa validação GU",
    "",
    "Libera pra gente? ✅",
  ].join("\n");
}
