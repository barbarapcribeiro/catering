import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import type { BillingStatus } from "../types";
import "./HomePersona.css";

function billingStatusOf(status?: BillingStatus): BillingStatus {
  return status ?? "Pendente";
}

export function HomeFaturamento() {
  const navigate = useNavigate();
  const { orders, currentUser, updateOrder, showToast } = useAppData();

  const billable = orders.filter((o) => o.status !== "Cancelado");
  const pending = billable.filter((o) => billingStatusOf(o.billingStatus) === "Pendente");
  const pendingValue = pending.reduce((sum, o) => sum + (o.valueNumber ?? 0), 0);
  const closedCount = billable.filter((o) => billingStatusOf(o.billingStatus) === "Fechado").length;

  const closeOrder = (id: string) => {
    updateOrder(id, { billingStatus: "Fechado" });
    showToast("Pedido marcado como fechado.");
  };

  return (
    <Layout>
      <div className="page-container persona-home">
        <div className="persona-home__header">
          <div>
            <h1 className="persona-home__title">Olá, {currentUser?.name ?? "Faturamento"}</h1>
            <div className="persona-home__subtitle">Pendências de fechamento e faturamento.</div>
          </div>
        </div>

        <div className="persona-home__kpis">
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Pendentes de fechamento</div>
            <div className="persona-home__kpi-value">{pending.length}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Valor pendente</div>
            <div className="persona-home__kpi-value">{money(pendingValue)}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Fechados (aguardando ERP)</div>
            <div className="persona-home__kpi-value">{closedCount}</div>
          </div>
        </div>

        <div className="card persona-home__panel">
          <div className="persona-home__panel-header">
            <div className="persona-home__panel-title">Pedidos pendentes de fechamento</div>
            <a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate("/admin/faturamento"); }}>
              Ver tela de faturamento
            </a>
          </div>

          {pending.length === 0 && <div className="empty-state">Nenhum pedido pendente de fechamento.</div>}

          {pending.length > 0 && (
            <div className="persona-home__list">
              {pending.slice(0, 8).map((o) => (
                <div key={o.id} className="persona-home__list-row persona-home__list-row--3">
                  <div>
                    <div className="persona-home__list-id">{o.id} · {o.type}</div>
                    <div className="persona-home__list-sub">{o.datetime}</div>
                  </div>
                  <div className="persona-home__list-value">{o.value}</div>
                  <div className="persona-home__list-actions">
                    <button className="btn btn--primary btn--sm" onClick={() => closeOrder(o.id)}>
                      Fechar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="persona-home__shortcuts">
          <div className="card persona-home__shortcut" onClick={() => navigate("/admin/centros-custo")}>
            <div className="persona-home__shortcut-glyph">🏷</div>
            <div>
              <div className="persona-home__shortcut-label">Centros de Custo</div>
              <div className="persona-home__shortcut-desc">Gerencie os centros de custo disponíveis.</div>
            </div>
          </div>
          <div className="card persona-home__shortcut" onClick={() => navigate("/admin/relatorios")}>
            <div className="persona-home__shortcut-glyph">📈</div>
            <div>
              <div className="persona-home__shortcut-label">Relatórios</div>
              <div className="persona-home__shortcut-desc">Indicadores de faturamento e operação.</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
