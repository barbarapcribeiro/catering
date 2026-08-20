import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAppData } from "../../mock/AppDataContext";
import { STATUS_STYLE } from "../../mock/services";
import { PathIcon } from "../../components/Icon";
import "./AdminOperacao.css";

const COFFEE_PATH =
  "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v4M10 2v4M14 2v4";

function formatDatePt(d: Date) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function AdminOperacao() {
  const { orders, occurrences, costCenters, currentUser } = useAppData();
  const navigate = useNavigate();

  const pedidosHoje = orders.filter((o) => isToday(o.createdAt)).length;
  const aguardandoAprovacao = orders.filter((o) => o.status === "Aguardando aprovação").length;
  const emPreparacao = orders.filter((o) => o.status === "Em preparação").length;
  const entregues = orders.filter((o) => o.status === "Entregue" || o.status === "Finalizado").length;

  const kpis = [
    { glyph: "📦", iconBg: "var(--color-primary-soft)", iconColor: "var(--color-primary)", label: "Pedidos hoje", value: String(pedidosHoje), to: "/pedidos" },
    { glyph: "🕓", iconBg: "var(--color-warning-soft)", iconColor: "var(--color-warning-dark)", label: "Aguardando aprovação", value: String(aguardandoAprovacao), to: "/aprovacoes" },
    { glyph: "🔥", iconBg: "var(--color-info-soft)", iconColor: "var(--color-info)", label: "Em preparação", value: String(emPreparacao), to: "/producao" },
    { glyph: "✓", iconBg: "var(--color-success-soft)", iconColor: "var(--color-success)", label: "Entregues", value: String(entregues), to: "/pedidos" },
  ];

  const statusBreakdown = useMemo(() => {
    const total = orders.length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return [
      { label: "Aguardando aprovação", pct: pct(orders.filter((o) => o.status === "Aguardando aprovação").length), color: "#e0a83a" },
      { label: "Em preparação", pct: pct(orders.filter((o) => o.status === "Em preparação").length), color: "#1e4fa3" },
      { label: "Pronto para entrega", pct: pct(orders.filter((o) => o.status === "Pronto para entrega").length), color: "var(--color-primary)" },
      { label: "Entregues", pct: pct(orders.filter((o) => o.status === "Entregue" || o.status === "Finalizado").length), color: "#1a7a4f" },
      { label: "Cancelados", pct: pct(orders.filter((o) => o.status === "Cancelado").length), color: "#c0392b" },
    ];
  }, [orders]);

  const chartData = useMemo(() => {
    const map = new Map<string, { label: string; value: number }>();
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const cur = map.get(key) ?? { label, value: 0 };
      cur.value += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, v]) => ({ day: v.label, value: v.value }));
  }, [orders]);

  const inProgressOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "Cancelado" && o.status !== "Finalizado" && o.status !== "Entregue")
        .slice(0, 5),
    [orders],
  );

  const pendingBilling = orders.filter((o) => o.status !== "Cancelado" && (o.billingStatus ?? "Pendente") === "Pendente").length;
  const blockedCostCenters = costCenters.filter((c) => !c.active).length;
  const openOccurrences = occurrences.filter((o) => o.status === "Aberta" || o.status === "Em análise").length;

  const pendencias = [
    { glyph: "🕓", bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)", text: "Pedidos aguardando aprovação", count: aguardandoAprovacao, to: "/aprovacoes" },
    { glyph: "💳", bg: "var(--color-info-soft)", color: "var(--color-info)", text: "Pedidos pendentes de faturamento", count: pendingBilling, to: "/admin/faturamento" },
    { glyph: "⚠", bg: "var(--color-danger-soft-2)", color: "var(--color-danger)", text: "Ocorrências abertas", count: openOccurrences, to: "/admin/ocorrencias" },
    { glyph: "🏷", bg: "#f1eef9", color: "var(--color-purple-status)", text: "Centros de custo bloqueados", count: blockedCostCenters, to: "/admin/centros-custo" },
  ];
  const pendenciasCount = pendencias.reduce((s, p) => s + p.count, 0);

  return (
    <div className="operacao-page">
      <div className="operacao-header">
        <div>
          <h1 className="operacao-title">Olá, {currentUser?.name ?? "Gestor de Unidade"} 👋</h1>
          <div className="operacao-subtitle">Aqui está o resumo da operação de hoje.</div>
        </div>
        <div className="operacao-date">{formatDatePt(new Date())}</div>
      </div>

      <div className="operacao-kpis">
        {kpis.map((k) => (
          <button className="card operacao-kpi" key={k.label} onClick={() => navigate(k.to)}>
            <div className="operacao-kpi__head">
              <div className="operacao-kpi__icon" style={{ background: k.iconBg, color: k.iconColor }}>
                {k.glyph}
              </div>
              <div className="operacao-kpi__label">{k.label}</div>
            </div>
            <div className="operacao-kpi__value">{k.value}</div>
          </button>
        ))}
      </div>

      <div className="operacao-row-1">
        <div className="card operacao-chart">
          <div className="operacao-card-head">
            <div className="operacao-card-title">Pedidos por período</div>
            <div className="operacao-card-hint">Dias com pedidos</div>
          </div>
          <div className="operacao-chart__canvas">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edf1f7" />
                  <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "#7d8798" }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [v, "Pedidos"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8f0" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Nenhum pedido registrado ainda.</div>
            )}
          </div>
        </div>

        <div className="card operacao-status">
          <div className="operacao-card-title" style={{ marginBottom: 14 }}>
            Pedidos por status
          </div>
          <div className="operacao-status__list">
            {statusBreakdown.map((sb) => (
              <div key={sb.label}>
                <div className="operacao-status__row">
                  <span className="operacao-status__label">{sb.label}</span>
                  <span className="operacao-status__pct">{sb.pct}%</span>
                </div>
                <div className="operacao-status__bar">
                  <div className="operacao-status__bar-fill" style={{ width: `${sb.pct}%`, background: sb.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="operacao-status__total">
            <span>Total de pedidos</span>
            <span className="operacao-status__total-value">{orders.length}</span>
          </div>
        </div>
      </div>

      <div className="operacao-row-2">
        <div className="card operacao-orders">
          <div className="operacao-card-head">
            <div className="operacao-card-title">Pedidos em andamento</div>
            <Link to="/pedidos" className="link">
              Ver todos
            </Link>
          </div>
          <div className="operacao-orders__head">
            <div>Pedido</div>
            <div>Data/Hora</div>
            <div>Status</div>
          </div>
          {inProgressOrders.map((o) => {
            const st = STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
            return (
              <div className="operacao-orders__row" key={o.id}>
                <div className="operacao-orders__left">
                  <div className="operacao-orders__avatar">
                    {o.mono === "CB" ? <PathIcon path={COFFEE_PATH} color="var(--color-primary)" size={15} /> : o.mono}
                  </div>
                  <div className="operacao-orders__id-wrap">
                    <div className="operacao-orders__name">{o.type}</div>
                    <div className="operacao-orders__unidade">{o.location || o.id}</div>
                  </div>
                </div>
                <div className="operacao-orders__datetime">{o.datetime}</div>
                <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                  {o.status}
                </span>
              </div>
            );
          })}
          {inProgressOrders.length === 0 && <div className="empty-state">Nenhum pedido em andamento no momento.</div>}
        </div>

        <div className="card operacao-pendencias">
          <div className="operacao-card-head">
            <div className="operacao-card-title">Pendências</div>
            <span className="operacao-pendencias__count">{pendenciasCount}</span>
          </div>
          <div className="operacao-pendencias__list">
            {pendencias.map((p) => (
              <button
                key={p.text}
                className="operacao-pendencias__item"
                onClick={() => navigate(p.to)}
              >
                <span className="operacao-pendencias__icon" style={{ background: p.bg, color: p.color }}>
                  {p.glyph}
                </span>
                <span className="operacao-pendencias__text">{p.text}</span>
                <span className="operacao-pendencias__num">{p.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
