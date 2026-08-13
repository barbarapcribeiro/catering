import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import { STATUS_STYLE } from "../mock/services";
import { money } from "../mock/money";
import type { Order } from "../types";
import "./HomePersona.css";

function orderCode(order: Order) {
  return order.id.replace(/^#/, "");
}

export function HomeGestor() {
  const navigate = useNavigate();
  const { orders, currentUser, updateOrder, showToast } = useAppData();

  const pendingGestor = orders.filter((o) => o.requiresApproval && o.status === "Aguardando aprovação" && !o.managerApproved);
  const totalPendingValue = pendingGestor.reduce((sum, o) => sum + (o.valueNumber ?? 0), 0);

  const approve = (o: Order) => {
    updateOrder(o.id, { managerApproved: true });
    showToast(`Aprovação confirmada para ${orderCode(o)}.`);
  };
  const reject = (o: Order) => {
    updateOrder(o.id, { managerApproved: false, guApproved: false, status: "Aguardando aprovação" });
    showToast(`Pedido ${orderCode(o)} recusado.`);
  };

  return (
    <Layout>
      <div className="page-container persona-home">
        <div className="persona-home__header">
          <div>
            <h1 className="persona-home__title">Olá, {currentUser?.name ?? "Gestor"}</h1>
            <div className="persona-home__subtitle">Acompanhe e aprove os pedidos do seu centro de custo.</div>
          </div>
        </div>

        <div className="persona-home__kpis">
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Aguardando sua aprovação</div>
            <div className="persona-home__kpi-value">{pendingGestor.length}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Valor pendente</div>
            <div className="persona-home__kpi-value">{money(totalPendingValue)}</div>
          </div>
        </div>

        <div className="card persona-home__panel">
          <div className="persona-home__panel-header">
            <div className="persona-home__panel-title">Pedidos aguardando aprovação</div>
            <a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate("/aprovacoes"); }}>
              Ver todas as aprovações
            </a>
          </div>

          {pendingGestor.length === 0 && <div className="empty-state">Nenhum pedido aguardando sua aprovação no momento.</div>}

          {pendingGestor.length > 0 && (
            <div className="persona-home__list">
              {pendingGestor.map((o) => (
                <div key={o.id} className="persona-home__list-row">
                  <div>
                    <div className="persona-home__list-id">{o.id} · {o.type}</div>
                    <div className="persona-home__list-sub">{o.datetime}</div>
                  </div>
                  <div>
                    <span className="status-pill" style={{ background: STATUS_STYLE[o.status]?.bg, color: STATUS_STYLE[o.status]?.color }}>
                      {o.status}
                    </span>
                  </div>
                  <div className="persona-home__list-value">{o.value}</div>
                  <div className="persona-home__list-actions">
                    <button className="btn btn--primary btn--sm" onClick={() => approve(o)}>
                      Aprovar
                    </button>
                    <button className="btn btn--outline btn--sm" onClick={() => reject(o)}>
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
