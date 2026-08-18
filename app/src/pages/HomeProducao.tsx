import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { OpenOrdersCard, PromosSection, RecentOrdersCard } from "../components/HomeWidgets";
import { useAppData } from "../mock/AppDataContext";
import "./HomePersona.css";

export function HomeProducao() {
  const navigate = useNavigate();
  const { orders, currentUser, updateOrder, showToast } = useAppData();

  const inPreparation = orders.filter((o) => o.status === "Em preparação");
  const readyForDelivery = orders.filter((o) => o.status === "Pronto para entrega");

  const markReady = (id: string) => {
    updateOrder(id, { status: "Pronto para entrega" });
    showToast("Pedido marcado como pronto para entrega.");
  };

  return (
    <Layout>
      <div className="page-container persona-home">
        <div className="persona-home__header">
          <div>
            <h1 className="persona-home__title">Olá, {currentUser?.name ?? "Equipe de Produção"}</h1>
            <div className="persona-home__subtitle">Fila de preparo da unidade.</div>
          </div>
        </div>

        <RecentOrdersCard orders={orders} />
        <OpenOrdersCard orders={orders} />
        <PromosSection />

        <div className="persona-home__kpis">
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Em preparação</div>
            <div className="persona-home__kpi-value">{inPreparation.length}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Prontos para entrega</div>
            <div className="persona-home__kpi-value">{readyForDelivery.length}</div>
          </div>
        </div>

        <div className="card persona-home__panel">
          <div className="persona-home__panel-header">
            <div className="persona-home__panel-title">Pedidos em preparação</div>
            <a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate("/producao"); }}>
              Ver painel completo de produção
            </a>
          </div>

          {inPreparation.length === 0 && <div className="empty-state">Nenhum pedido em preparação no momento.</div>}

          {inPreparation.length > 0 && (
            <div className="persona-home__list">
              {inPreparation.map((o) => (
                <div key={o.id} className="persona-home__list-row persona-home__list-row--3">
                  <div>
                    <div className="persona-home__list-id">{o.id} · {o.type}</div>
                    <div className="persona-home__list-sub">{o.qty} · {o.datetime}</div>
                  </div>
                  <div className="persona-home__list-value">{o.value}</div>
                  <div className="persona-home__list-actions">
                    <button className="btn btn--primary btn--sm" onClick={() => markReady(o.id)}>
                      Marcar como pronto
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
