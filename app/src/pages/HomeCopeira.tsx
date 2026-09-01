import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { OpenOrdersCard, PromosSection, RecentOrdersCard } from "../components/HomeWidgets";
import { useAppData } from "../mock/AppDataContext";
import "./HomePersona.css";

export function HomeCopeira() {
  const navigate = useNavigate();
  const { orders, currentUser, updateOrder, showToast } = useAppData();

  const readyForDelivery = orders.filter((o) => o.status === "Pronto para entrega");
  const pendingUtensils = orders.filter((o) => o.pickupDate && !o.utensilsRetrieved && (o.status === "Entregue" || o.status === "Finalizado"));

  const markDelivered = (id: string) => {
    updateOrder(id, { status: "Entregue" });
    showToast("Pedido marcado como entregue.");
  };

  const markUtensilsRetrieved = (id: string) => {
    updateOrder(id, { utensilsRetrieved: true });
    showToast("Utensílios marcados como recolhidos.");
  };

  return (
    <Layout>
      <div className="page-container persona-home">
        <div className="persona-home__header">
          <div>
            <h1 className="persona-home__title">Olá, {currentUser?.name ?? "Copeira"}</h1>
            <div className="persona-home__subtitle">Entregas e recolhimento de utensílios da unidade.</div>
          </div>
        </div>

        <RecentOrdersCard orders={orders} />
        <OpenOrdersCard orders={orders} />
        <PromosSection />

        <div className="persona-home__kpis">
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Prontos para entrega</div>
            <div className="persona-home__kpi-value">{readyForDelivery.length}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Recolhimento de utensílios pendente</div>
            <div className="persona-home__kpi-value">{pendingUtensils.length}</div>
          </div>
        </div>

        <div className="card persona-home__panel">
          <div className="persona-home__panel-header">
            <div className="persona-home__panel-title">Pedidos prontos para entrega</div>
            <a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate("/producao"); }}>
              Ver painel completo de produção
            </a>
          </div>

          {readyForDelivery.length === 0 && <div className="empty-state">Nenhum pedido pronto para entrega no momento.</div>}

          {readyForDelivery.length > 0 && (
            <div className="persona-home__list">
              {readyForDelivery.map((o) => (
                <div key={o.id} className="persona-home__list-row persona-home__list-row--3">
                  <div>
                    <div className="persona-home__list-id">{o.id} · {o.type}</div>
                    <div className="persona-home__list-sub">{o.qty} · {o.datetime}</div>
                  </div>
                  <div className="persona-home__list-value">{o.value}</div>
                  <div className="persona-home__list-actions">
                    <button className="btn btn--primary btn--sm" onClick={() => markDelivered(o.id)}>
                      Marcar como entregue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card persona-home__panel">
          <div className="persona-home__panel-header">
            <div className="persona-home__panel-title">Recolhimento de utensílios</div>
          </div>

          {pendingUtensils.length === 0 && <div className="empty-state">Nenhum recolhimento de utensílios pendente.</div>}

          {pendingUtensils.length > 0 && (
            <div className="persona-home__list">
              {pendingUtensils.map((o) => (
                <div key={o.id} className="persona-home__list-row persona-home__list-row--3">
                  <div>
                    <div className="persona-home__list-id">{o.id} · {o.type}</div>
                    <div className="persona-home__list-sub">Recolhimento: {o.pickupDate} {o.pickupTime}</div>
                  </div>
                  <div />
                  <div className="persona-home__list-actions">
                    <button className="btn btn--outline btn--sm" onClick={() => markUtensilsRetrieved(o.id)}>
                      Marcar utensílios recolhidos
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
