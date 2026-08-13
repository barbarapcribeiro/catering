import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAppData } from "../../mock/AppDataContext";
import { STATUS_STYLE } from "../../mock/services";
import { PathIcon } from "../../components/Icon";
import type { Order } from "../../types";
import "./AdminOperacao.css";

const COFFEE_PATH =
  "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v4M10 2v4M14 2v4";

const KPIS = [
  { glyph: "📦", iconBg: "var(--color-primary-soft)", iconColor: "var(--color-primary)", label: "Pedidos hoje", value: "124", trend: "↑ 12% vs ontem", trendColor: "var(--color-success)" },
  { glyph: "🕓", iconBg: "var(--color-warning-soft)", iconColor: "var(--color-warning-dark)", label: "Aguardando aprovação", value: "8", trend: "↑ 2 novos", trendColor: "var(--color-warning)" },
  { glyph: "🔥", iconBg: "var(--color-info-soft)", iconColor: "var(--color-info)", label: "Em preparação", value: "15", trend: "↑ 3 novos", trendColor: "var(--color-info)" },
  { glyph: "✓", iconBg: "var(--color-success-soft)", iconColor: "var(--color-success)", label: "Entregues hoje", value: "86", trend: "↑ 9% vs ontem", trendColor: "var(--color-success)" },
];

const STATUS_BREAKDOWN = [
  { label: "Aguardando aprovação", pct: 8, color: "#e0a83a" },
  { label: "Em preparação", pct: 15, color: "#1e4fa3" },
  { label: "Em entrega", pct: 22, color: "#283897" },
  { label: "Entregues", pct: 49, color: "#1a7a4f" },
  { label: "Cancelados", pct: 6, color: "#c0392b" },
];
const TOTAL_ORDERS = 231;

const FALLBACK_ROWS: { mono: string; name: string; unidade: string; datetime: string; status: Order["status"] }[] = [
  { mono: "RN", name: "Refeição Normal Financeiro", unidade: "Unidade Financeira", datetime: "23/07 • 12:00", status: "Entregue" },
  { mono: "SA", name: "Água Mineral Treinamento", unidade: "Unidade Matriz", datetime: "23/07 • 09:00", status: "Entregue" },
];

const PENDENCIAS = [
  { glyph: "🚚", bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)", text: "Fornecedores aguardando aprovação", count: 2 },
  { glyph: "⚠", bg: "var(--color-danger-soft-2)", color: "var(--color-danger)", text: "Produtos com preço desatualizado", count: 5 },
  { glyph: "🏷", bg: "#f1eef9", color: "var(--color-purple-status)", text: "Centros de custo bloqueados", count: 1 },
  { glyph: "👤", bg: "var(--color-info-soft)", color: "var(--color-info)", text: "Usuários com acesso pendente", count: 4 },
];
const PENDENCIAS_COUNT = 12;

const CHART_VALUES = [62, 78, 70, 88, 95, 82, 100];

const WEEKDAY_GREETING = "Bom dia, Bárbara 👋";

function formatDatePt(d: Date) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function lastNDaysLabels(n: number) {
  const labels: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
  }
  return labels;
}

export function AdminOperacao() {
  const { orders, showToast } = useAppData();

  const chartData = useMemo(() => {
    const labels = lastNDaysLabels(CHART_VALUES.length);
    return CHART_VALUES.map((v, i) => ({ day: labels[i], value: v }));
  }, []);

  const inProgressOrders = useMemo(() => {
    const real = orders
      .filter((o) => o.status !== "Cancelado" && o.status !== "Finalizado")
      .map((o) => ({
        mono: o.mono,
        name: o.type,
        unidade: o.location || "Unidade Matriz",
        datetime: o.datetime,
        status: o.status,
      }));
    const combined = [...real, ...FALLBACK_ROWS];
    return combined.slice(0, 5);
  }, [orders]);

  return (
    <div className="operacao-page">
      <div className="operacao-header">
        <div>
          <h1 className="operacao-title">{WEEKDAY_GREETING}</h1>
          <div className="operacao-subtitle">Aqui está o resumo da operação de hoje.</div>
        </div>
        <div className="operacao-date">{formatDatePt(new Date())}</div>
      </div>

      <div className="operacao-kpis">
        {KPIS.map((k) => (
          <div className="card operacao-kpi" key={k.label}>
            <div className="operacao-kpi__head">
              <div className="operacao-kpi__icon" style={{ background: k.iconBg, color: k.iconColor }}>
                {k.glyph}
              </div>
              <div className="operacao-kpi__label">{k.label}</div>
            </div>
            <div className="operacao-kpi__value">{k.value}</div>
            <div className="operacao-kpi__trend" style={{ color: k.trendColor }}>
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="operacao-row-1">
        <div className="card operacao-chart">
          <div className="operacao-card-head">
            <div className="operacao-card-title">Pedidos por período</div>
            <div className="operacao-card-hint">Últimos 7 dias</div>
          </div>
          <div className="operacao-chart__canvas">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#edf1f7" />
                <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "#7d8798" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
                <Tooltip
                  formatter={(v) => [v, "Pedidos"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8f0" }}
                />
                <Line type="monotone" dataKey="value" stroke="#283897" strokeWidth={2.5} dot={{ r: 3, fill: "#283897" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card operacao-status">
          <div className="operacao-card-title" style={{ marginBottom: 14 }}>
            Pedidos por status
          </div>
          <div className="operacao-status__list">
            {STATUS_BREAKDOWN.map((sb) => (
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
            <span className="operacao-status__total-value">{TOTAL_ORDERS}</span>
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
          {inProgressOrders.map((o, i) => {
            const st = STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
            return (
              <div className="operacao-orders__row" key={`${o.mono}-${i}`}>
                <div className="operacao-orders__left">
                  <div className="operacao-orders__avatar">
                    {o.mono === "CB" ? <PathIcon path={COFFEE_PATH} color="#283897" size={15} /> : o.mono}
                  </div>
                  <div className="operacao-orders__id-wrap">
                    <div className="operacao-orders__name">{o.name}</div>
                    <div className="operacao-orders__unidade">{o.unidade}</div>
                  </div>
                </div>
                <div className="operacao-orders__datetime">{o.datetime}</div>
                <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                  {o.status}
                </span>
              </div>
            );
          })}
        </div>

        <div className="card operacao-pendencias">
          <div className="operacao-card-head">
            <div className="operacao-card-title">Pendências</div>
            <span className="operacao-pendencias__count">{PENDENCIAS_COUNT}</span>
          </div>
          <div className="operacao-pendencias__list">
            {PENDENCIAS.map((p) => (
              <button
                key={p.text}
                className="operacao-pendencias__item"
                onClick={() => showToast(`Abrindo "${p.text}"...`)}
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
