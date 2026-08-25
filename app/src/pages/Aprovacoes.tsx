import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import { STATUS_STYLE } from "../mock/services";
import type { Order } from "../types";
import "./Aprovacoes.css";

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
  const { orders, updateOrder, showToast, operatingParameters } = useAppData();

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
                    <div className="apr-card__summary-row apr-card__summary-row--total">
                      <div className="apr-card__summary-label">Total</div>
                      <div className="apr-card__total">{o.value}</div>
                    </div>
                  </div>

                  <div className="apr-card__approvals">
                    <div className="apr-card__approvals-title">Aprovações</div>

                    <div className="apr-approval-row">
                      <div className="apr-approval-row__info">
                        <div className="apr-approval-row__label">Aprovação do Gestor</div>
                        <div className="apr-approval-row__name">{gestorNameFor(o)}</div>
                      </div>
                      <div className="apr-approval-row__actions">
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
    </Layout>
  );
}
