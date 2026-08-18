import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../../mock/AppDataContext";
import { STATUS_STYLE } from "../../mock/services";
import { money } from "../../mock/money";
import { Modal } from "../../components/Modal";
import "./Relatorios.css";

// Status styles used only by this report's sample data, not present in the
// shared STATUS_STYLE map (e.g. "Atrasado" / "Pronto para entrega" logistics states).
const LOCAL_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ...STATUS_STYLE,
  "Pronto para entrega": { bg: "#e6f5ec", color: "#1a7a4f" },
  Atrasado: { bg: "#fbe4e0", color: "#c0392b" },
};

const CC_LABELS: Record<string, string> = {
  CC001: "Administrativo",
  CC002: "Comercial",
  CC003: "Operações",
  CC004: "Recursos Humanos",
  CC005: "Industrial",
};

export type ReportDash = "geral" | "faturamento" | "pedidos" | "centros-custo" | "pesquisa-satisfacao" | "pesquisa-aplicacao";

const DASH_TABS: { key: ReportDash; label: string }[] = [
  { key: "geral", label: "Visão Geral" },
  { key: "faturamento", label: "Faturamento" },
  { key: "pedidos", label: "Pedidos" },
  { key: "centros-custo", label: "Centros de Custo" },
  { key: "pesquisa-satisfacao", label: "Pesquisa de Satisfação" },
  { key: "pesquisa-aplicacao", label: "Pesquisa da Aplicação" },
];

const KPIS: { glyph: string; label: string; value: string; trend: string; seed: number; sparkColor: string; dash: ReportDash }[] = [
  { glyph: "💰", label: "Faturamento total", value: money(248750.6), trend: "↑ 18,0% vs período anterior", seed: 1, sparkColor: "#283897", dash: "faturamento" },
  { glyph: "📦", label: "Pedidos realizados", value: "156", trend: "↑ 12,4% vs período anterior", seed: 2, sparkColor: "#1e4fa3", dash: "pedidos" },
  { glyph: "🎟", label: "Ticket médio", value: money(1594.56), trend: "↑ 5,2% vs período anterior", seed: 3, sparkColor: "#1a7a4f", dash: "faturamento" },
  { glyph: "👥", label: "Unidades atendidas", value: "24", trend: "↑ 9,1% vs período anterior", seed: 4, sparkColor: "#b5690f", dash: "centros-custo" },
  { glyph: "⭐", label: "Satisfação (NPS)", value: "59", trend: "↑ 7 pts vs período anterior", seed: 5, sparkColor: "#c99a1f", dash: "pesquisa-satisfacao" },
];

const BAR_VALUES = [24000, 31000, 20000, 38000, 42000, 29000, 45000, 36000];
const BAR_LABELS = ["01/07", "04/07", "08/07", "12/07", "15/07", "19/07", "21/07", "24/07"];

const SERVICE_BREAKDOWN = [
  { label: "Coffee Break", pct: 45, color: "#283897", value: 111938.27, orders: 72, trend: "↑ 18%", up: true },
  { label: "Lanches", pct: 25, color: "#1e4fa3", value: 62187.65, orders: 48, trend: "↑ 8,4%", up: true },
  { label: "Refeições", pct: 20, color: "#1a7a4f", value: 49750.12, orders: 24, trend: "↑ 10,2%", up: true },
  { label: "Eventos", pct: 10, color: "#b5690f", value: 24874.56, orders: 12, trend: "↓ 2,1%", up: false },
];
const SERVICE_TOTAL = 248750.6;

const TOP_COST_CENTERS = [
  { code: "CC001", pct: 100, value: 78540.2 },
  { code: "CC002", pct: 67, value: 52430.1 },
  { code: "CC003", pct: 50, value: 38920.9 },
  { code: "CC004", pct: 37, value: 28850.3 },
  { code: "CC005", pct: 31, value: 24209.1 },
];

const STATUS_CARDS: { glyph: string; label: string; value: string; bg: string; border: string; color: string; dash: ReportDash }[] = [
  { glyph: "🕓", label: "Aguardando aprovação", value: "8 pedidos", bg: "#fdf6ea", border: "#f0d49a", color: "#8a5a0f", dash: "pedidos" },
  { glyph: "🔥", label: "Em produção", value: "12 pedidos", bg: "#eef4fc", border: "#c7dcf5", color: "#1e4fa3", dash: "pedidos" },
  { glyph: "📬", label: "Prontos para entrega", value: "5 pedidos", bg: "#eef8f1", border: "#bfe4cc", color: "#1a7a4f", dash: "pedidos" },
  { glyph: "⏰", label: "Atrasados", value: "2 pedidos", bg: "#fdf1ef", border: "#f0c6bd", color: "#c0392b", dash: "pedidos" },
  { glyph: "⚠", label: "Ocorrências abertas", value: "3 ocorrências", bg: "#f6f0fb", border: "#ddc7ee", color: "#5a4a8a", dash: "pedidos" },
];

const RECENT_ORDERS = [
  { id: "#CB-15234", type: "Coffee Break", unidade: "Unidade Matriz", datetime: "24/07 • 09:30", status: "Em preparação" },
  { id: "#LAN-15210", type: "Lanche", unidade: "Unidade Matriz", datetime: "24/07 • 10:00", status: "Pronto para entrega" },
  { id: "#EVT-15188", type: "Evento", unidade: "Unidade RH", datetime: "23/07 • 18:40", status: "Entregue" },
  { id: "#REF-15123", type: "Refeição", unidade: "Unidade Industrial", datetime: "23/07 • 12:30", status: "Entregue" },
  { id: "#CB-15098", type: "Coffee Break", unidade: "Unidade Financeira", datetime: "23/07 • 09:00", status: "Aguardando aprovação" },
];

// Sample order set used both for the "Pedidos" dash table and the CSV export.
const EXPORT_ORDERS = [
  { id: "#CB-15234", type: "Coffee Break", unidade: "Unidade Matriz", datetime: "24/07 • 09:30", people: 20, value: 240, status: "Em preparação" },
  { id: "#LAN-15210", type: "Lanche", unidade: "Unidade Matriz", datetime: "24/07 • 10:00", people: 15, value: 187.5, status: "Pronto para entrega" },
  { id: "#EVT-15188", type: "Evento", unidade: "Unidade RH", datetime: "23/07 • 18:40", people: 30, value: 1250, status: "Entregue" },
  { id: "#REF-15123", type: "Refeição", unidade: "Unidade Industrial", datetime: "23/07 • 12:30", people: 25, value: 550, status: "Entregue" },
  { id: "#CB-15098", type: "Coffee Break", unidade: "Unidade Financeira", datetime: "23/07 • 09:00", people: 18, value: 320, status: "Aguardando aprovação" },
  { id: "#SA-15075", type: "Água", unidade: "Unidade Comercial", datetime: "22/07 • 08:00", people: 12, value: 72, status: "Entregue" },
  { id: "#RM-15040", type: "Refeição Marmitex", unidade: "Unidade Industrial", datetime: "22/07 • 12:00", people: 40, value: 720, status: "Entregue" },
  { id: "#CB-14990", type: "Coffee Break", unidade: "Unidade Matriz", datetime: "21/07 • 15:00", people: 22, value: 275, status: "Atrasado" },
  { id: "#EE-14955", type: "Evento", unidade: "Unidade RH", datetime: "20/07 • 09:00", people: 35, value: 1480, status: "Entregue" },
  { id: "#LAN-14920", type: "Lanche", unidade: "Unidade Financeira", datetime: "19/07 • 10:30", people: 10, value: 125, status: "Entregue" },
];

const EXPORT_FIELD_DEFS = [
  { key: "id", label: "Pedido" },
  { key: "type", label: "Tipo" },
  { key: "unidade", label: "Unidade" },
  { key: "datetime", label: "Data/Hora" },
  { key: "people", label: "Pessoas" },
  { key: "value", label: "Valor" },
  { key: "status", label: "Status" },
] as const;
type ExportFieldKey = (typeof EXPORT_FIELD_DEFS)[number]["key"];

const APP_SURVEY_CATEGORY_COLOR: Record<string, string> = { CX: "#1e4fa3", UX: "#283897", NPS: "#c99a1f" };

/** Respostas numéricas de uma pergunta específica, dentre as respostas de um dos dois formulários. */
function numericAnswers(responses: { answers: { questionId: string; value: number | string }[] }[], questionId: string): number[] {
  return responses.flatMap((r) => r.answers.filter((a) => a.questionId === questionId && typeof a.value === "number").map((a) => a.value as number));
}
function textAnswers(responses: { answers: { questionId: string; value: number | string }[] }[], questionId: string): string[] {
  return responses.flatMap((r) => r.answers.filter((a) => a.questionId === questionId && typeof a.value === "string" && a.value).map((a) => a.value as string));
}

interface NpsStats {
  score: number;
  avg: number;
  promoter: number;
  neutral: number;
  detractor: number;
  count: number;
}
/** Calcula NPS real a partir das respostas; usa o "fallback" ilustrativo enquanto não há respostas suficientes. */
function npsStats(values: number[], fallback: NpsStats): NpsStats {
  if (values.length === 0) return fallback;
  const promoter = Math.round((values.filter((v) => v >= 9).length / values.length) * 100);
  const detractor = Math.round((values.filter((v) => v <= 6).length / values.length) * 100);
  const neutral = 100 - promoter - detractor;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return { score: promoter - detractor, avg, promoter, neutral, detractor, count: values.length };
}
function avgOf(values: number[], fallback: number): { avg: number; count: number } {
  if (values.length === 0) return { avg: fallback, count: 0 };
  return { avg: values.reduce((s, v) => s + v, 0) / values.length, count: values.length };
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
    <svg viewBox="0 0 100 28" className="relatorios-spark">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Relatorios() {
  const { showToast, costCenters, surveyQuestions, appSurveyQuestions, surveyResponses } = useAppData();
  const navigate = useNavigate();
  const params = useParams<{ dash?: string }>();
  const dash: ReportDash = (DASH_TABS.some((t) => t.key === params.dash) ? params.dash : "geral") as ReportDash;

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFields, setExportFields] = useState<Record<ExportFieldKey, boolean>>({
    id: true,
    type: true,
    unidade: true,
    datetime: true,
    people: true,
    value: true,
    status: true,
  });

  const barData = useMemo(() => BAR_VALUES.map((v, i) => ({ day: BAR_LABELS[i], value: v })), []);

  const activeFieldDefs = EXPORT_FIELD_DEFS.filter((f) => exportFields[f.key]);
  const noFieldsSelected = activeFieldDefs.length === 0;

  const toggleField = (key: ExportFieldKey) => setExportFields((s) => ({ ...s, [key]: !s[key] }));

  const doExport = () => {
    if (noFieldsSelected) return;
    const rows = [activeFieldDefs.map((f) => f.label).join(";")];
    EXPORT_ORDERS.forEach((o) => {
      rows.push(
        activeFieldDefs
          .map((f) => (f.key === "value" ? money(o.value) : String(o[f.key as keyof typeof o])))
          .join(";"),
      );
    });
    const csv = "﻿" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-pedidos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
    showToast("Exportação gerada com sucesso!");
  };

  const goDash = (d: ReportDash) => navigate(d === "geral" ? "/admin/relatorios" : `/admin/relatorios/${d}`);

  const pedidoResponses = useMemo(() => surveyResponses.filter((r) => r.kind === "pedido"), [surveyResponses]);
  const aplicacaoResponses = useMemo(() => surveyResponses.filter((r) => r.kind === "aplicacao"), [surveyResponses]);

  const npsQuestion = surveyQuestions.find((q) => q.type === "NPS" && q.active);
  const pedidoNps = npsStats(npsQuestion ? numericAnswers(pedidoResponses, npsQuestion.id) : [], {
    score: 59, avg: 8.1, promoter: 68, neutral: 22, detractor: 10, count: 0,
  });
  const starQuestions = surveyQuestions.filter((q) => q.type === "Estrelas" && q.active);
  const textQuestions = surveyQuestions.filter((q) => q.type === "Texto" && q.active);

  const appNpsQuestion = appSurveyQuestions.find((q) => q.type === "NPS" && q.active);
  const appNps = npsStats(appNpsQuestion ? numericAnswers(aplicacaoResponses, appNpsQuestion.id) : [], {
    score: 42, avg: 7.2, promoter: 55, neutral: 32, detractor: 13, count: 0,
  });
  const appRatedQuestions = appSurveyQuestions.filter((q) => q.active && (q.type === "Estrelas" || q.type === "Escala 1-5"));
  const appTextQuestions = appSurveyQuestions.filter((q) => q.active && q.type === "Texto");

  return (
    <div className="relatorios-page">
      <div className="relatorios-header">
        <div>
          <h1 className="relatorios-title">Relatórios</h1>
          <div className="relatorios-subtitle">Acompanhe indicadores, análise de pedidos e faturamento da sua operação.</div>
        </div>
        <div className="relatorios-header__actions">
          <div className="relatorios-period">📅 01/07/2026 — 24/07/2026</div>
          <button className="btn btn--outline">Comparar período</button>
          <button className="btn btn--primary" onClick={() => setExportOpen(true)}>
            ⭳ Exportar Excel
          </button>
        </div>
      </div>

      <div className="tab-row relatorios-tabs">
        {DASH_TABS.map((t) => (
          <button key={t.key} className={dash === t.key ? "is-active" : ""} onClick={() => goDash(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {dash === "geral" && (
        <>
          <div className="relatorios-kpis">
            {KPIS.map((k) => (
              <button className="card relatorios-kpi relatorios-kpi--clickable" key={k.label} onClick={() => goDash(k.dash)}>
                <div className="relatorios-kpi__head">
                  <div className="relatorios-kpi__label">{k.label}</div>
                  <span>{k.glyph}</span>
                </div>
                <div className="relatorios-kpi__value">{k.value}</div>
                <div className="relatorios-kpi__trend">{k.trend}</div>
                <Sparkline seed={k.seed} color={k.sparkColor} />
              </button>
            ))}
          </div>

          <div className="relatorios-row-1">
            <div className="card relatorios-panel">
              <div className="relatorios-panel-title">Faturamento por dia</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edf1f7" />
                  <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: "#7d8798" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v) => [money(Number(v)), "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8f0" }} />
                  <Bar dataKey="value" fill="#283897" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Faturamento por tipo de serviço</div>
                <button className="link" onClick={() => goDash("faturamento")}>Ver mais &rsaquo;</button>
              </div>
              <div className="relatorios-service-list">
                {SERVICE_BREAKDOWN.map((sb) => (
                  <div key={sb.label}>
                    <div className="relatorios-service-row">
                      <span className="relatorios-service-label">
                        <span className="relatorios-dot" style={{ background: sb.color }} />
                        {sb.label}
                      </span>
                      <span className="relatorios-muted">{sb.pct}%</span>
                    </div>
                    <div className="relatorios-bar-track">
                      <div className="relatorios-bar-fill" style={{ width: `${sb.pct}%`, background: sb.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="relatorios-panel-total">
                <span>Total</span>
                <span className="relatorios-panel-total__value">{money(SERVICE_TOTAL)}</span>
              </div>
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Top 5 Centros de custo</div>
                <button className="link" onClick={() => goDash("centros-custo")}>Ver mais &rsaquo;</button>
              </div>
              <div className="relatorios-topunits">
                {TOP_COST_CENTERS.map((u, i) => (
                  <button className="relatorios-topunit relatorios-topunit--clickable" key={u.code} onClick={() => goDash("centros-custo")}>
                    <div className="relatorios-topunit__rank">{i + 1}</div>
                    <div className="relatorios-topunit__body">
                      <div className="relatorios-topunit__name">
                        {u.code} • {CC_LABELS[u.code]}
                      </div>
                      <div className="relatorios-bar-track relatorios-bar-track--sm">
                        <div className="relatorios-bar-fill" style={{ width: `${u.pct}%`, background: "#283897" }} />
                      </div>
                    </div>
                    <div className="relatorios-topunit__value">{money(u.value)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relatorios-status-row">
            {STATUS_CARDS.map((s) => (
              <button
                key={s.label}
                className="relatorios-status-card"
                style={{ background: s.bg, borderColor: s.border }}
                onClick={() => goDash(s.dash)}
              >
                <div className="relatorios-status-card__head">
                  <span>{s.glyph}</span>
                  <span style={{ color: s.color }}>{s.label}</span>
                </div>
                <div className="relatorios-status-card__value">{s.value}</div>
                <div className="relatorios-status-card__link" style={{ color: s.color }}>
                  Ver pedidos &rsaquo;
                </div>
              </button>
            ))}
          </div>

          <div className="relatorios-row-2">
            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Resumo de faturamento</div>
                <button className="link" onClick={() => goDash("faturamento")}>
                  Ver relatório completo
                </button>
              </div>
              <div className="relatorios-summary__head">
                <div>Tipo</div>
                <div>Fat.</div>
                <div>%</div>
                <div>Pedidos</div>
                <div>vs período</div>
              </div>
              {SERVICE_BREAKDOWN.map((sb) => (
                <div className="relatorios-summary__row" key={sb.label}>
                  <div className="relatorios-summary__type">
                    <span className="relatorios-dot" style={{ background: sb.color }} />
                    {sb.label}
                  </div>
                  <div className="relatorios-summary__value">{money(sb.value)}</div>
                  <div className="relatorios-muted">{sb.pct}%</div>
                  <div>{sb.orders}</div>
                  <div className={`relatorios-trend ${sb.up ? "is-up" : "is-down"}`}>{sb.trend}</div>
                </div>
              ))}
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Últimos pedidos</div>
                <Link to="/pedidos" className="link">
                  Ver todos
                </Link>
              </div>
              <div className="relatorios-orders__head">
                <div>Pedido</div>
                <div>Unidade</div>
                <div>Data/Hora</div>
                <div>Status</div>
              </div>
              {RECENT_ORDERS.map((o) => {
                const st = LOCAL_STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
                return (
                  <div className="relatorios-orders__row" key={o.id}>
                    <div className="relatorios-orders__id-wrap">
                      <div className="relatorios-orders__id">{o.id}</div>
                      <div className="relatorios-muted-sm">{o.type}</div>
                    </div>
                    <div className="relatorios-orders__unidade">{o.unidade}</div>
                    <div className="relatorios-orders__datetime">{o.datetime}</div>
                    <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                      {o.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {dash === "faturamento" && (
        <>
          <div className="relatorios-kpis">
            {KPIS.filter((k) => k.dash === "faturamento").map((k) => (
              <div className="card relatorios-kpi" key={k.label}>
                <div className="relatorios-kpi__head">
                  <div className="relatorios-kpi__label">{k.label}</div>
                  <span>{k.glyph}</span>
                </div>
                <div className="relatorios-kpi__value">{k.value}</div>
                <div className="relatorios-kpi__trend">{k.trend}</div>
                <Sparkline seed={k.seed} color={k.sparkColor} />
              </div>
            ))}
          </div>
          <div className="relatorios-row-1">
            <div className="card relatorios-panel" style={{ gridColumn: "span 2" }}>
              <div className="relatorios-panel-title">Faturamento por dia</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edf1f7" />
                  <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: "#7d8798" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v) => [money(Number(v)), "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8f0" }} />
                  <Bar dataKey="value" fill="#283897" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card relatorios-panel">
              <div className="relatorios-panel-title">Faturamento por tipo</div>
              <div className="relatorios-service-list">
                {SERVICE_BREAKDOWN.map((sb) => (
                  <div key={sb.label}>
                    <div className="relatorios-service-row">
                      <span className="relatorios-service-label">
                        <span className="relatorios-dot" style={{ background: sb.color }} />
                        {sb.label}
                      </span>
                      <span className="relatorios-muted">{sb.pct}%</span>
                    </div>
                    <div className="relatorios-bar-track">
                      <div className="relatorios-bar-fill" style={{ width: `${sb.pct}%`, background: sb.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="relatorios-panel-total">
                <span>Total</span>
                <span className="relatorios-panel-total__value">{money(SERVICE_TOTAL)}</span>
              </div>
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Resumo de faturamento por tipo de serviço</div>
              <Link to="/admin/faturamento" className="link">
                Ver fechamentos e faturas &rsaquo;
              </Link>
            </div>
            <div className="relatorios-summary__head">
              <div>Tipo</div>
              <div>Fat.</div>
              <div>%</div>
              <div>Pedidos</div>
              <div>vs período</div>
            </div>
            {SERVICE_BREAKDOWN.map((sb) => (
              <div className="relatorios-summary__row" key={sb.label}>
                <div className="relatorios-summary__type">
                  <span className="relatorios-dot" style={{ background: sb.color }} />
                  {sb.label}
                </div>
                <div className="relatorios-summary__value">{money(sb.value)}</div>
                <div className="relatorios-muted">{sb.pct}%</div>
                <div>{sb.orders}</div>
                <div className={`relatorios-trend ${sb.up ? "is-up" : "is-down"}`}>{sb.trend}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {dash === "pedidos" && (
        <>
          <div className="relatorios-status-row">
            {STATUS_CARDS.map((s) => (
              <div key={s.label} className="relatorios-status-card" style={{ background: s.bg, borderColor: s.border, cursor: "default" }}>
                <div className="relatorios-status-card__head">
                  <span>{s.glyph}</span>
                  <span style={{ color: s.color }}>{s.label}</span>
                </div>
                <div className="relatorios-status-card__value">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Pedidos do período</div>
              <Link to="/pedidos" className="link">
                Ver Gestão de pedidos &rsaquo;
              </Link>
            </div>
            <div className="relatorios-orders__head">
              <div>Pedido</div>
              <div>Unidade</div>
              <div>Data/Hora</div>
              <div>Status</div>
            </div>
            {EXPORT_ORDERS.map((o) => {
              const st = LOCAL_STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
              return (
                <div className="relatorios-orders__row" key={o.id}>
                  <div className="relatorios-orders__id-wrap">
                    <div className="relatorios-orders__id">{o.id}</div>
                    <div className="relatorios-muted-sm">{o.type} • {o.people} pessoas</div>
                  </div>
                  <div className="relatorios-orders__unidade">{o.unidade}</div>
                  <div className="relatorios-orders__datetime">{o.datetime}</div>
                  <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                    {o.status}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {dash === "centros-custo" && (
        <div className="relatorios-row-2">
          <div className="card relatorios-panel">
            <div className="relatorios-panel-title">Faturamento por centro de custo</div>
            <div className="relatorios-topunits">
              {TOP_COST_CENTERS.map((u, i) => (
                <div className="relatorios-topunit" key={u.code}>
                  <div className="relatorios-topunit__rank">{i + 1}</div>
                  <div className="relatorios-topunit__body">
                    <div className="relatorios-topunit__name">
                      {u.code} • {CC_LABELS[u.code]}
                    </div>
                    <div className="relatorios-bar-track relatorios-bar-track--sm">
                      <div className="relatorios-bar-fill" style={{ width: `${u.pct}%`, background: "#283897" }} />
                    </div>
                  </div>
                  <div className="relatorios-topunit__value">{money(u.value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Centros de custo cadastrados</div>
              <Link to="/admin/centros-custo" className="link">
                Gerenciar &rsaquo;
              </Link>
            </div>
            <div className="relatorios-summary__head" style={{ gridTemplateColumns: "1fr 1fr 0.8fr" }}>
              <div>Código</div>
              <div>Nome</div>
              <div>Status</div>
            </div>
            {costCenters.map((c) => (
              <div className="relatorios-summary__row" key={c.id} style={{ gridTemplateColumns: "1fr 1fr 0.8fr" }}>
                <div className="relatorios-summary__type">{c.code}</div>
                <div className="relatorios-muted">{c.name}</div>
                <span className="status-pill" style={{ background: c.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: c.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {c.active ? "Ativo" : "Bloqueado"}
                </span>
              </div>
            ))}
            {costCenters.length === 0 && <div className="empty-state">Nenhum centro de custo cadastrado.</div>}
          </div>
        </div>
      )}

      {dash === "pesquisa-satisfacao" && (
        <div className="relatorios-row-2">
          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>NPS geral do pedido</div>
              <Link to="/admin/pesquisa-satisfacao" className="link">
                Configurar perguntas &rsaquo;
              </Link>
            </div>
            <div className="relatorios-kpi__value" style={{ fontSize: 32, marginTop: 10, marginBottom: 4 }}>{pedidoNps.score}</div>
            <div className="relatorios-muted-sm" style={{ marginBottom: 14 }}>
              {pedidoNps.count > 0 ? `Calculado a partir de ${pedidoNps.count} resposta(s) reais` : "Exemplo ilustrativo — nenhuma resposta recebida ainda"}
            </div>
            <div className="relatorios-service-list">
              {[
                { label: "Promotores (9-10)", pct: pedidoNps.promoter, color: "#1a7a4f" },
                { label: "Neutros (7-8)", pct: pedidoNps.neutral, color: "#c99a1f" },
                { label: "Detratores (0-6)", pct: pedidoNps.detractor, color: "#c0392b" },
              ].map((n) => (
                <div key={n.label}>
                  <div className="relatorios-service-row">
                    <span className="relatorios-service-label">
                      <span className="relatorios-dot" style={{ background: n.color }} />
                      {n.label}
                    </span>
                    <span className="relatorios-muted">{n.pct}%</span>
                  </div>
                  <div className="relatorios-bar-track">
                    <div className="relatorios-bar-fill" style={{ width: `${n.pct}%`, background: n.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-title">Avaliações por pergunta</div>
            <div className="relatorios-service-list">
              {starQuestions.map((q) => {
                const { avg, count } = avgOf(numericAnswers(pedidoResponses, q.id), 4.3);
                return (
                  <div key={q.id} className="relatorios-service-row" style={{ marginBottom: 8 }}>
                    <span className="relatorios-service-label">{q.text}</span>
                    <span className="relatorios-muted">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))} {count === 0 && "(exemplo)"}</span>
                  </div>
                );
              })}
              {starQuestions.length === 0 && <div className="relatorios-muted-sm">Nenhuma pergunta de estrelas configurada.</div>}
            </div>
            <div className="relatorios-panel-total" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
              <span>Comentários recentes</span>
              {textQuestions.flatMap((q) => textAnswers(pedidoResponses, q.id)).slice(0, 3).map((t, i) => (
                <div key={i} className="relatorios-muted-sm">“{t}”</div>
              ))}
              {textQuestions.flatMap((q) => textAnswers(pedidoResponses, q.id)).length === 0 && (
                <div className="relatorios-muted-sm">Nenhum comentário recebido ainda.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {dash === "pesquisa-aplicacao" && (
        <div className="relatorios-row-2">
          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>NPS geral da plataforma</div>
              <Link to="/admin/pesquisa-aplicacao" className="link">
                Configurar perguntas &rsaquo;
              </Link>
            </div>
            <div className="relatorios-kpi__value" style={{ fontSize: 32, marginTop: 10, marginBottom: 4 }}>{appNps.score}</div>
            <div className="relatorios-muted-sm" style={{ marginBottom: 14 }}>
              {appNps.count > 0 ? `Calculado a partir de ${appNps.count} resposta(s) reais` : "Exemplo ilustrativo — nenhuma resposta recebida ainda"}
            </div>
            <div className="relatorios-service-list">
              {[
                { label: "Promotores (9-10)", pct: appNps.promoter, color: "#1a7a4f" },
                { label: "Neutros (7-8)", pct: appNps.neutral, color: "#c99a1f" },
                { label: "Detratores (0-6)", pct: appNps.detractor, color: "#c0392b" },
              ].map((n) => (
                <div key={n.label}>
                  <div className="relatorios-service-row">
                    <span className="relatorios-service-label">
                      <span className="relatorios-dot" style={{ background: n.color }} />
                      {n.label}
                    </span>
                    <span className="relatorios-muted">{n.pct}%</span>
                  </div>
                  <div className="relatorios-bar-track">
                    <div className="relatorios-bar-fill" style={{ width: `${n.pct}%`, background: n.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-title">CX &amp; UX por pergunta</div>
            <div className="relatorios-service-list">
              {appRatedQuestions.map((q) => {
                const { avg, count } = avgOf(numericAnswers(aplicacaoResponses, q.id), 4.0);
                return (
                  <div key={q.id} className="relatorios-service-row" style={{ marginBottom: 8 }}>
                    <span className="relatorios-service-label">
                      <span className="relatorios-dot" style={{ background: APP_SURVEY_CATEGORY_COLOR[q.category] }} />
                      {q.text}
                    </span>
                    <span className="relatorios-muted">{avg.toFixed(1)}/5 {count === 0 && "(exemplo)"}</span>
                  </div>
                );
              })}
              {appRatedQuestions.length === 0 && <div className="relatorios-muted-sm">Nenhuma pergunta de avaliação configurada.</div>}
            </div>
            <div className="relatorios-panel-total" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
              <span>Comentários recentes</span>
              {appTextQuestions.flatMap((q) => textAnswers(aplicacaoResponses, q.id)).slice(0, 3).map((t, i) => (
                <div key={i} className="relatorios-muted-sm">“{t}”</div>
              ))}
              {appTextQuestions.flatMap((q) => textAnswers(aplicacaoResponses, q.id)).length === 0 && (
                <div className="relatorios-muted-sm">Nenhum comentário recebido ainda.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {exportOpen && (
        <Modal onClose={() => setExportOpen(false)} width={420}>
          <div className="modal-title">Exportar para Excel</div>
          <div className="modal-subtitle" style={{ marginBottom: 18 }}>
            Selecione os campos que devem ser incluídos na exportação (dados de "Pedidos").
          </div>
          <div className="relatorios-export-fields">
            {EXPORT_FIELD_DEFS.map((f) => (
              <label className="relatorios-export-field" key={f.key}>
                <input type="checkbox" checked={exportFields[f.key]} onChange={() => toggleField(f.key)} />
                {f.label}
              </label>
            ))}
          </div>
          <div className="relatorios-export-count">
            {activeFieldDefs.length} campo(s) selecionado(s) &bull; {EXPORT_ORDERS.length} pedidos no período
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setExportOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={noFieldsSelected} onClick={doExport} style={{ flex: 2 }}>
              ⭳ Exportar Excel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
