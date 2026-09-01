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

export function orderCreatedMessage(order: Order): string {
  return [
    `Novo pedido ${order.id} — ${order.category}`,
    `Quantidade: ${order.qty}`,
    `Data/Hora: ${order.datetime}`,
    `Status: ${order.status}`,
  ].join("\n");
}

export function orderStatusMessage(order: Order): string {
  return `Atualização do pedido ${order.id} (${order.category}): o status agora é "${order.status}".`;
}
