import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { STATUS_STYLE } from "../../mock/services";
import { money } from "../../mock/money";
import { BILLING_STATUSES, type BillingStatus } from "../../types";
import "./Faturamento.css";

const BILLING_STYLE: Record<BillingStatus, { bg: string; color: string }> = {
  Pendente: { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  Fechado: { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  "Enviado ao ERP": { bg: "var(--color-success-soft)", color: "var(--color-success)" },
};

function formatDate(datetime: string) {
  return datetime.split(" ")[0] || datetime;
}

export function Faturamento() {
  const { orders, costCenters, updateOrder, showToast } = useAppData();
  const [filter, setFilter] = useState<"todos" | BillingStatus>("todos");

  const billable = orders.filter((o) => o.status !== "Cancelado");
  const billingStatusOf = (status?: BillingStatus) => status ?? "Pendente";

  const filtered = filter === "todos" ? billable : billable.filter((o) => billingStatusOf(o.billingStatus) === filter);

  const totals = BILLING_STATUSES.reduce<Record<BillingStatus, number>>(
    (acc, s) => {
      acc[s] = billable.filter((o) => billingStatusOf(o.billingStatus) === s).reduce((sum, o) => sum + (o.valueNumber ?? 0), 0);
      return acc;
    },
    { Pendente: 0, Fechado: 0, "Enviado ao ERP": 0 },
  );

  const costCenterLabel = (code: string) => {
    const cc = costCenters.find((c) => c.code === code);
    return cc ? `${cc.code} · ${cc.name}` : code;
  };

  const setBillingStatus = (orderId: string, status: BillingStatus) => {
    updateOrder(orderId, { billingStatus: status });
    showToast(
      status === "Fechado" ? "Pedido marcado como fechado." : status === "Enviado ao ERP" ? "Pedido enviado ao ERP." : "Pedido reaberto.",
    );
  };

  return (
    <div className="faturamento-page">
      <div className="faturamento-header">
        <div>
          <h1 className="faturamento-title">Faturamento</h1>
          <div className="faturamento-subtitle">Feche pedidos por centro de custo e envie para geração do faturamento no ERP.</div>
        </div>
      </div>

      <div className="faturamento-summary">
        {BILLING_STATUSES.map((s) => (
          <div key={s} className="card faturamento-summary__tile">
            <div className="faturamento-summary__label">
              <span className="status-pill" style={{ background: BILLING_STYLE[s].bg, color: BILLING_STYLE[s].color }}>
                {s}
              </span>
            </div>
            <div className="faturamento-summary__value">{money(totals[s])}</div>
            <div className="faturamento-summary__count">{billable.filter((o) => billingStatusOf(o.billingStatus) === s).length} pedidos</div>
          </div>
        ))}
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={filter === "todos" ? "is-active" : ""} onClick={() => setFilter("todos")}>
          Todos
        </button>
        {BILLING_STATUSES.map((s) => (
          <button key={s} className={filter === s ? "is-active" : ""} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="card faturamento-table-card">
        <div className="faturamento-table">
          <div className="faturamento-table__head">
            <div>Pedido</div>
            <div>Centro de custo</div>
            <div>Data</div>
            <div>Valor</div>
            <div>Status do pedido</div>
            <div>Faturamento</div>
            <div>Ações</div>
          </div>
          {filtered.map((o) => {
            const bStatus = billingStatusOf(o.billingStatus);
            return (
              <div key={o.id} className="faturamento-table__row">
                <div>
                  <div className="faturamento-table__id">{o.id}</div>
                  <div className="faturamento-table__type">{o.type}</div>
                </div>
                <div className="faturamento-table__muted">
                  {o.costCenters && o.costCenters.length > 0 ? o.costCenters.map((cc) => `${costCenterLabel(cc.code)} (${cc.percent}%)`).join(", ") : "—"}
                </div>
                <div className="faturamento-table__muted">{formatDate(o.datetime)}</div>
                <div className="faturamento-table__value">{o.value}</div>
                <div>
                  <span className="status-pill" style={{ background: STATUS_STYLE[o.status]?.bg, color: STATUS_STYLE[o.status]?.color }}>
                    {o.status}
                  </span>
                </div>
                <div>
                  <span className="status-pill" style={{ background: BILLING_STYLE[bStatus].bg, color: BILLING_STYLE[bStatus].color }}>
                    {bStatus}
                  </span>
                </div>
                <div className="faturamento-table__actions">
                  {bStatus === "Pendente" && (
                    <button className="link" onClick={() => setBillingStatus(o.id, "Fechado")}>
                      Fechar
                    </button>
                  )}
                  {bStatus === "Fechado" && (
                    <>
                      <button className="link" onClick={() => setBillingStatus(o.id, "Enviado ao ERP")}>
                        Enviar ao ERP
                      </button>
                      <button className="link" onClick={() => setBillingStatus(o.id, "Pendente")}>
                        Reabrir
                      </button>
                    </>
                  )}
                  {bStatus === "Enviado ao ERP" && <span className="faturamento-table__done">Concluído</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty-state">Nenhum pedido encontrado para esse filtro.</div>}
        </div>
      </div>
    </div>
  );
}
