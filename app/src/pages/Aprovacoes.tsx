import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { formatSize } from "../components/AttachmentsField";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { useAppData } from "../mock/AppDataContext";
import { STATUS_STYLE } from "../mock/services";
import { money } from "../mock/money";
import { gestorApprovalMessage, guApprovalMessage } from "../mock/whatsapp";
import type { Order } from "../types";
import "./OrderFlow.css";
import "./Aprovacoes.css";

interface DisplayItem {
  key: string;
  name: string;
  qty: number;
  unit: number;
  total: number;
}

// Mirrors GerenciarPedidos' item display: real order flows store a granular items[]
// (qty/price pre-tax); orders that predate that only carry a final value, so a single
// line item is synthesized from it, backing the pre-tax price out of the total.
function getDisplayItems(o: Order): DisplayItem[] {
  if (o.items && o.items.length > 0) {
    return o.items.map((it, i) => ({ key: `${it.name}-${i}`, name: it.name, qty: it.qty, unit: it.price, total: it.qty * it.price }));
  }
  const total = o.valueNumber ?? 0;
  const unit = total / 1.1;
  return [{ key: "single", name: o.type, qty: 1, unit, total: unit }];
}

// The prototype's mock orders each carry a fixed "gestor" (client manager) name.
// The shared Order model has no such field yet, so approver names are derived
// from the order category as a reasonable mock stand-in; GU (production unit)
// approval always goes through the same production reviewer.
const GESTOR_BY_CATEGORY: Record<string, string> = {
  "Coffee Break": "Carlos Santos",
  "Evento Especial": "Paula Costa",
  Evento: "Paula Costa",
  Lanche: "Ana Beatriz Lima",
};
const DEFAULT_GESTOR = "Ana Beatriz Lima";
const GU_NAME = "Marina Silva";

function gestorNameFor(order: Order) {
  return GESTOR_BY_CATEGORY[order.category] ?? DEFAULT_GESTOR;
}

function orderCode(order: Order) {
  return order.id.replace(/^#/, "");
}

function eventDateOf(order: Order) {
  const [datePart] = order.datetime.split(" ");
  return datePart || "A definir";
}

export function Aprovacoes() {
  const navigate = useNavigate();
  const { orders, updateOrder, showToast, operatingParameters, serviceParameters } = useAppData();
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // "Pendente" here means the order still needs approval — once the GU step is
  // granted the status moves away from "Aguardando aprovação" and the order
  // naturally drops off this list, matching the "Aprovações Pendentes" title.
  const pendingOrders = orders.filter((o) => o.requiresApproval && o.status === "Aguardando aprovação");

  const pendingGestor = pendingOrders.filter((o) => !o.managerApproved).length;
  const pendingGU = pendingOrders.filter((o) => o.managerApproved && !o.guApproved).length;
  const totalPending = pendingGestor + pendingGU;

  const approveGestor = (o: Order) => {
    updateOrder(o.id, { managerApproved: true });
    showToast(`Aprovação do gestor confirmada para ${orderCode(o)}.`);
  };
  const rejectGestor = (o: Order) => {
    updateOrder(o.id, { managerApproved: false, guApproved: false, status: "Aguardando aprovação" });
    showToast(`Aprovação do gestor removida para ${orderCode(o)}.`);
  };
  const approveGU = (o: Order) => {
    updateOrder(o.id, { guApproved: true, status: "Em preparação" });
    showToast(`Pedido ${orderCode(o)} aprovado e liberado para produção!`);
  };
  const rejectGU = (o: Order) => {
    updateOrder(o.id, { guApproved: false, status: "Aguardando aprovação" });
    showToast(`Aprovação do GU removida para ${orderCode(o)}.`);
  };

  return (
    <Layout>
      <div className="page-container">
        <button className="apr-back-link" onClick={() => navigate("/pedidos")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para pedidos
        </button>

        <h1 className="apr-title">Aprovações Pendentes</h1>

        {operatingParameters.showAgreementMessage && totalPending > 0 && (
          <div className="apr-agreement-banner">⚠ {operatingParameters.agreementMessage}</div>
        )}

        <div className="apr-grid">
          <div className="apr-list">
            {pendingOrders.map((o) => {
              const st = STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
              return (
                <div key={o.id} className="apr-card">
                  <div className="apr-card__header">
                    <div className="apr-card__identity">
                      <div className="avatar-circle">{o.mono}</div>
                      <div>
                        <div className="apr-card__name">{o.eventName || o.type}</div>
                        <div className="apr-card__code">Pedido #{orderCode(o)}</div>
                      </div>
                    </div>
                    <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                      {o.status}
                    </span>
                  </div>

                  <div className="apr-card__summary">
                    <div className="apr-card__summary-title">Resumo do pedido</div>
                    <div className="apr-card__summary-grid">
                      <div>
                        <div className="apr-card__summary-label">Data do evento</div>
                        <div className="apr-card__summary-value">{eventDateOf(o)}</div>
                      </div>
                      <div>
                        <div className="apr-card__summary-label">Local</div>
                        <div className="apr-card__summary-value">{o.location || "A definir"}</div>
                      </div>
                      <div>
                        <div className="apr-card__summary-label">Pessoas</div>
                        <div className="apr-card__summary-value">{o.peopleCount ?? "—"} pessoas</div>
                      </div>
                      <div>
                        <div className="apr-card__summary-label">Horário</div>
                        <div className="apr-card__summary-value">{o.eventTime || "A definir"}</div>
                      </div>
                    </div>
                    <div className="apr-card__summary-row">
                      <div className="apr-card__summary-label">Itens selecionados</div>
                      <div className="apr-card__summary-value">{o.items?.length ?? 0} itens</div>
                    </div>
                    {(o.attachments ?? []).length > 0 && (
                      <div className="apr-card__summary-row">
                        <div className="apr-card__summary-label">Anexos</div>
                        <div className="apr-card__summary-value">
                          {o.attachments!.map((att) => (
                            <div key={att.id}>
                              <a href={att.dataUrl} download={att.name}>
                                {att.name}
                              </a>{" "}
                              <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({formatSize(att.size)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="apr-card__summary-row apr-card__summary-row--total">
                      <div className="apr-card__summary-label">Total</div>
                      <div className="apr-card__total">{o.value}</div>
                    </div>
                  </div>

                  <button className="btn btn--outline btn--full" style={{ marginBottom: 16 }} onClick={() => setViewOrder(o)}>
                    👁 Ver pedido
                  </button>

                  <div className="apr-card__approvals">
                    <div className="apr-card__approvals-title">Aprovações</div>

                    <div className="apr-approval-row">
                      <div className="apr-approval-row__info">
                        <div className="apr-approval-row__label">Aprovação do Gestor</div>
                        <div className="apr-approval-row__name">{gestorNameFor(o)}</div>
                      </div>
                      <div className="apr-approval-row__actions">
                        {!o.managerApproved && (
                          <WhatsAppButton message={gestorApprovalMessage(o, gestorNameFor(o))} label="Cutucar" />
                        )}
                        <button
                          className={`apr-approve-btn ${o.managerApproved ? "is-approved" : ""}`}
                          onClick={() => approveGestor(o)}
                        >
                          {o.managerApproved ? "✓ Aprovado" : "Aprovar"}
                        </button>
                        <button className="apr-reject-btn" onClick={() => rejectGestor(o)}>
                          Rejeitar
                        </button>
                      </div>
                    </div>

                    {o.managerApproved && (
                      <div className="apr-approval-row">
                        <div className="apr-approval-row__info">
                          <div className="apr-approval-row__label">Aprovação GU Produção</div>
                          <div className="apr-approval-row__name">{GU_NAME}</div>
                        </div>
                        <div className="apr-approval-row__actions">
                          {!o.guApproved && (
                            <WhatsAppButton message={guApprovalMessage(o, GU_NAME)} label="Cutucar" />
                          )}
                          <button
                            className={`apr-approve-btn ${o.guApproved ? "is-approved" : ""}`}
                            onClick={() => approveGU(o)}
                          >
                            {o.guApproved ? "✓ Aprovado" : "Aprovar"}
                          </button>
                          <button className="apr-reject-btn" onClick={() => rejectGU(o)}>
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {pendingOrders.length === 0 && (
              <div className="apr-empty">
                <div className="apr-empty__title">Nenhuma aprovação pendente</div>
                <div className="apr-empty__subtitle">Todos os pedidos já foram aprovados.</div>
              </div>
            )}
          </div>

          <div className="apr-side">
            <div className="apr-side__card">
              <div className="apr-side__title">Resumo de pendências</div>
              <div className="apr-side__rows">
                <div className="apr-side__row">
                  <span>Aguardando Gestor</span>
                  <span className="apr-side__value">{pendingGestor}</span>
                </div>
                <div className="apr-side__row">
                  <span>Aguardando GU</span>
                  <span className="apr-side__value">{pendingGU}</span>
                </div>
                <div className="apr-side__row apr-side__row--total">
                  <span>Total pendente</span>
                  <span className="apr-side__total">{totalPending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewOrder &&
        (() => {
          const items = getDisplayItems(viewOrder);
          const subtotal = items.reduce((sum, it) => sum + it.total, 0);
          const feePercent = serviceParameters.find((sp) => sp.category === viewOrder.category)?.adminFeePercent ?? 10;
          const fee = subtotal * (feePercent / 100);
          const total = subtotal + fee;
          return (
            <Modal onClose={() => setViewOrder(null)} width={560}>
              <div className="invoice-card" style={{ margin: 0, border: "none", padding: 0 }}>
                <div className="invoice-header">
                  <div>
                    <div className="invoice-header-title">{viewOrder.eventName || viewOrder.type}</div>
                    <div className="invoice-header-id">Pedido #{orderCode(viewOrder)}</div>
                  </div>
                  <div className="invoice-header-date">
                    {eventDateOf(viewOrder)}
                    <br />
                    <strong style={{ color: "var(--color-text)" }}>{viewOrder.eventTime || "—"}</strong>
                  </div>
                </div>

                <div className="event-summary-grid" style={{ borderBottom: "1px solid var(--color-border-soft)", paddingBottom: 14, marginBottom: 14 }}>
                  <div>
                    <div className="event-summary-item-label">Local</div>
                    <div className="event-summary-item-value">{viewOrder.location || "A definir"}</div>
                  </div>
                  <div>
                    <div className="event-summary-item-label">Pessoas</div>
                    <div className="event-summary-item-value">{viewOrder.peopleCount ?? "—"} pessoas</div>
                  </div>
                  <div>
                    <div className="event-summary-item-label">Centro de custo</div>
                    <div className="event-summary-item-value">{(viewOrder.costCenters ?? []).map((c) => c.code).join(", ") || "—"}</div>
                  </div>
                </div>

                <div className="invoice-table-head">
                  <div>Item</div>
                  <div>Qtd.</div>
                  <div>Unit.</div>
                  <div>Total</div>
                </div>
                {items.map((it) => (
                  <div key={it.key} className="invoice-row">
                    <div className="invoice-row__name">{it.name}</div>
                    <div className="invoice-row__muted">{it.qty}</div>
                    <div className="invoice-row__muted">{money(it.unit)}</div>
                    <div className="invoice-row__total">{money(it.total)}</div>
                  </div>
                ))}

                <div className="invoice-totals">
                  <div className="invoice-totals__row">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="invoice-totals__row">
                    <span>Taxa de serviço ({feePercent}%)</span>
                    <span>{money(fee)}</span>
                  </div>
                  <div className="invoice-totals__final">
                    <span>Total</span>
                    <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
                  </div>
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button className="btn btn--outline" onClick={() => setViewOrder(null)}>
                  Fechar
                </button>
              </div>
            </Modal>
          );
        })()}
    </Layout>
  );
}
