import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import "./HomePersona.css";

const SHORTCUTS = [
  { label: "Painel Operacional", to: "/admin", glyph: "📊", desc: "KPIs, pedidos do dia e status geral." },
  { label: "Gestão de pedidos", to: "/pedidos", glyph: "📋", desc: "Acompanhe todos os pedidos em andamento." },
  { label: "Produção", to: "/producao", glyph: "🔥", desc: "Fila de preparo da unidade." },
  { label: "Ocorrências", to: "/admin/ocorrencias", glyph: "⚠", desc: "Problemas reportados em pedidos." },
  { label: "Faturamento", to: "/admin/faturamento", glyph: "💳", desc: "Feche pedidos e envie ao ERP." },
  { label: "Relatórios", to: "/admin/relatorios", glyph: "📈", desc: "Indicadores e análises da operação." },
];

export function HomeGU() {
  const navigate = useNavigate();
  const { orders, occurrences, currentUser } = useAppData();

  const openOrders = orders.filter((o) => o.status !== "Cancelado" && o.status !== "Finalizado");
  const awaitingApproval = orders.filter((o) => o.status === "Aguardando aprovação").length;
  const inPreparation = orders.filter((o) => o.status === "Em preparação").length;
  const openOccurrences = occurrences.filter((o) => o.status === "Aberta" || o.status === "Em análise").length;
  const pendingBilling = orders.filter((o) => o.status !== "Cancelado" && (o.billingStatus ?? "Pendente") === "Pendente").length;

  return (
    <Layout>
      <div className="page-container persona-home">
        <div className="persona-home__header">
          <div>
            <h1 className="persona-home__title">Olá, {currentUser?.name ?? "Gerente de Unidade"}</h1>
            <div className="persona-home__subtitle">Visão geral da operação da sua unidade.</div>
          </div>
        </div>

        <div className="persona-home__kpis persona-home__kpis--4">
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Pedidos em aberto</div>
            <div className="persona-home__kpi-value">{openOrders.length}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Aguardando aprovação</div>
            <div className="persona-home__kpi-value">{awaitingApproval}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Em preparação</div>
            <div className="persona-home__kpi-value">{inPreparation}</div>
          </div>
          <div className="card persona-home__kpi">
            <div className="persona-home__kpi-label">Ocorrências abertas</div>
            <div className="persona-home__kpi-value">{openOccurrences}</div>
          </div>
        </div>

        {pendingBilling > 0 && (
          <div className="persona-home__banner">
            <span>🏷</span>
            <div>
              <strong>{pendingBilling} pedido(s)</strong> aguardando fechamento de faturamento.
            </div>
            <button className="btn btn--outline btn--sm" onClick={() => navigate("/admin/faturamento")}>
              Ver faturamento
            </button>
          </div>
        )}

        <div className="persona-home__shortcuts">
          {SHORTCUTS.map((s) => (
            <div key={s.to} className="card persona-home__shortcut" onClick={() => navigate(s.to)}>
              <div className="persona-home__shortcut-glyph">{s.glyph}</div>
              <div>
                <div className="persona-home__shortcut-label">{s.label}</div>
                <div className="persona-home__shortcut-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
