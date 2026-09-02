import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { OpenOrdersCard, PromosSection, RecentOrdersCard } from "../components/HomeWidgets";
import { useAppData } from "../mock/AppDataContext";
import { STATUS_STYLE } from "../mock/services";
import { money } from "../mock/money";
import type { Order } from "../types";
import "./HomePersona.css";

function orderCode(order: Order) {
  return order.id.replace(/^#/, "");
}

function makeSpark(seed: number): string {
  const pts: number[] = [];
  let v = 14;
  for (let i = 0; i < 10; i++) {
    v += Math.sin(seed + i) * 6;
    pts.push(Math.max(2, Math.min(26, 14 + v * 0.4)));
  }
  return pts.map((y, i) => `${((i * 100) / 9).toFixed(1)},${(28 - y).toFixed(1)}`).join(" ");
}

function Sparkline({ seed, color }: { seed: number; color: string }) {
  const points = useMemo(() => makeSpark(seed), [seed]);
  return (
    <svg viewBox="0 0 100 28" className="persona-home__spark">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeGestor() {
  const navigate = useNavigate();
  const { orders, costCenters, currentUser, updateOrder, showToast } = useAppData();

  const pendingGestor = orders.filter((o) => o.requiresApproval && o.status === "Aguardando aprovação" && !o.managerApproved);
  const totalPendingValue = pendingGestor.reduce((sum, o) => sum + (o.valueNumber ?? 0), 0);

  const costCenterCodes = currentUser?.costCenterCodes ?? [];
  const userCostCenters = costCenters.filter((c) => costCenterCodes.includes(c.code));
  const ccOrders =
    costCenterCodes.length > 0
      ? orders.filter((o) => o.status !== "Cancelado" && o.costCenters?.some((a) => costCenterCodes.includes(a.code)))
      : [];
  const ccRevenue = ccOrders.reduce((sum, o) => {
    const matchedPercent = (o.costCenters ?? []).filter((a) => costCenterCodes.includes(a.code)).reduce((p, a) => p + (a.percent ?? 0), 0);
    return sum + (o.valueNumber ?? 0) * (matchedPercent / 100);
  }, 0);
  const ccAvgTicket = ccOrders.length > 0 ? ccRevenue / ccOrders.length : 0;
  const ccPeople = ccOrders.reduce((sum, o) => sum + (o.peopleCount ?? 0), 0);

  const ccKpis = [
    { glyph: "💰", label: "Faturamento total", value: money(ccRevenue), seed: 1, sparkColor: "var(--color-primary)" },
    { glyph: "📦", label: "Pedidos realizados", value: String(ccOrders.length), seed: 2, sparkColor: "#1e4fa3" },
    { glyph: "🎟", label: "Ticket médio", value: money(ccAvgTicket), seed: 3, sparkColor: "#1a7a4f" },
    { glyph: "👥", label: "Unidades atendidas", value: String(ccPeople), seed: 4, sparkColor: "#b5690f" },
    { glyph: "⭐", label: "Satisfação (NPS)", value: "62", seed: 5, sparkColor: "#c99a1f" },
  ];

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

        <RecentOrdersCard orders={orders} />
        <OpenOrdersCard orders={orders} />
        <PromosSection />

        <div className="persona-home__panel">
          <div className="persona-home__panel-header">
            <div className="persona-home__panel-title">Resumo do centro de custo</div>
            {userCostCenters.length > 0 && (
              <div className="persona-home__panel-caption">{userCostCenters.map((c) => `${c.code} · ${c.name}`).join(" · ")}</div>
            )}
          </div>

          {costCenterCodes.length === 0 && (
            <div className="empty-state">Nenhum centro de custo associado ao seu usuário. Peça para o administrador configurar em Usuários.</div>
          )}

          {costCenterCodes.length > 0 && (
            <div className="persona-home__cc-kpis">
              {ccKpis.map((k) => (
                <div className="card persona-home__cc-kpi" key={k.label}>
                  <div className="persona-home__cc-kpi-head">
                    <div className="persona-home__cc-kpi-label">{k.label}</div>
                    <span>{k.glyph}</span>
                  </div>
                  <div className="persona-home__cc-kpi-value">{k.value}</div>
                  <Sparkline seed={k.seed} color={k.sparkColor} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
