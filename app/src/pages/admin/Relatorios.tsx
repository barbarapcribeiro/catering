import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../../mock/AppDataContext";
import { STATUS_STYLE } from "../../mock/services";
import { money } from "../../mock/money";
import { Modal } from "../../components/Modal";
import { ASSET_STATUSES, MEAL_SERVICES, ORDER_CATEGORIES, type AssetStatus, type CatracaEffectiveStatus, type CostCenter, type Order, type QuoteStatus } from "../../types";
import { catracaEffectiveStatus } from "../../mock/catraca";
import "./Relatorios.css";

const PALETTE = ["var(--color-primary)", "#1e4fa3", "#1a7a4f", "#b5690f", "#5a4a8a", "#c99a1f", "#c0392b"];

export type ReportDash = "geral" | "faturamento" | "pedidos" | "centros-custo" | "lucro-produto" | "ativos" | "catraca" | "orcamentos" | "pesquisa-satisfacao" | "pesquisa-aplicacao";

const DASH_TABS: { key: ReportDash; label: string }[] = [
  { key: "geral", label: "Visão Geral" },
  { key: "faturamento", label: "Faturamento" },
  { key: "pedidos", label: "Pedidos" },
  { key: "centros-custo", label: "Centros de Custo" },
  { key: "lucro-produto", label: "Lucro por Produto" },
  { key: "ativos", label: "Ativos" },
  { key: "catraca", label: "Consumo Catraca" },
  { key: "orcamentos", label: "Orçamentos" },
  { key: "pesquisa-satisfacao", label: "Pesquisa de Satisfação" },
  { key: "pesquisa-aplicacao", label: "Pesquisa da Aplicação" },
];

const QUOTE_STATUS_STYLE: Record<QuoteStatus, { bg: string; color: string }> = {
  Solicitado: { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  "Em elaboração": { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  Editado: { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  "Enviado para aprovação": { bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  Aprovado: { bg: "var(--color-success-soft)", color: "var(--color-success)" },
  Rejeitado: { bg: "var(--color-danger-soft, #fbe4e4)", color: "var(--color-danger)" },
  Cancelado: { bg: "var(--color-danger-soft, #fbe4e4)", color: "var(--color-danger)" },
};

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

const APP_SURVEY_CATEGORY_COLOR: Record<string, string> = { CX: "#1e4fa3", UX: "var(--color-primary)", NPS: "#c99a1f" };

function orderUnitLabel(o: Order, costCenters: CostCenter[]): string {
  const primary = o.costCenters?.[0];
  if (primary) {
    const cc = costCenters.find((c) => c.code === primary.code);
    return cc ? `${cc.code} · ${cc.name}` : primary.code;
  }
  return o.location || "—";
}

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
function npsStats(values: number[]): NpsStats {
  if (values.length === 0) return { score: 0, avg: 0, promoter: 0, neutral: 0, detractor: 0, count: 0 };
  const promoter = Math.round((values.filter((v) => v >= 9).length / values.length) * 100);
  const detractor = Math.round((values.filter((v) => v <= 6).length / values.length) * 100);
  const neutral = 100 - promoter - detractor;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return { score: promoter - detractor, avg, promoter, neutral, detractor, count: values.length };
}
function avgOf(values: number[]): { avg: number; count: number } {
  if (values.length === 0) return { avg: 0, count: 0 };
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
  const { orders, costCenters, occurrences, showToast, surveyQuestions, appSurveyQuestions, surveyResponses, products, assets, assetTypes, assetMovements, catracaRedemptions, kits, quoteRequests } = useAppData();
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

  // ---- real data, computed from orders/centros de custo/ocorrências ----
  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "Cancelado"), [orders]);
  const ordersByDateDesc = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  const totalFaturamento = activeOrders.reduce((s, o) => s + (o.valueNumber ?? 0), 0);
  const totalPedidos = activeOrders.length;
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
  const unidadesAtendidas = useMemo(() => {
    const set = new Set<string>();
    activeOrders.forEach((o) => o.costCenters?.forEach((cc) => set.add(cc.code)));
    return set.size;
  }, [activeOrders]);

  const barData = useMemo(() => {
    const map = new Map<string, { label: string; value: number }>();
    activeOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const cur = map.get(key) ?? { label, value: 0 };
      cur.value += o.valueNumber ?? 0;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([, v]) => ({ day: v.label, value: v.value }));
  }, [activeOrders]);

  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, { value: number; orders: number }>();
    activeOrders.forEach((o) => {
      const cur = map.get(o.category) ?? { value: 0, orders: 0 };
      cur.value += o.valueNumber ?? 0;
      cur.orders += 1;
      map.set(o.category, cur);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v.value, 0);
    return Array.from(map.entries())
      .map(([label, v], i) => ({ label, value: v.value, orders: v.orders, pct: total > 0 ? Math.round((v.value / total) * 100) : 0, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [activeOrders]);
  const serviceTotal = serviceBreakdown.reduce((s, sb) => s + sb.value, 0);

  const topCostCenters = useMemo(() => {
    const withValue = costCenters
      .map((cc) => {
        const value = activeOrders.reduce((sum, o) => {
          const alloc = o.costCenters?.find((a) => a.code === cc.code);
          return sum + (alloc ? (o.valueNumber ?? 0) * (alloc.percent / 100) : 0);
        }, 0);
        return { code: cc.code, name: cc.name, value };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const max = withValue[0]?.value || 1;
    return withValue.map((c) => ({ ...c, pct: Math.round((c.value / max) * 100) }));
  }, [activeOrders, costCenters]);

  // ---- Lucro por Produto: margem cadastrada (todo produto) + lucro realizado (produtos com vendas reais rastreadas) ----
  const productProfit = useMemo(() => {
    const soldById = new Map<string, { unitsSold: number; revenue: number }>();
    activeOrders.forEach((o) => {
      (o.items ?? []).forEach((it) => {
        if (!it.productId) return;
        const cur = soldById.get(it.productId) ?? { unitsSold: 0, revenue: 0 };
        cur.unitsSold += it.qty;
        cur.revenue += it.qty * it.price;
        soldById.set(it.productId, cur);
      });
    });
    return products
      .map((p) => {
        const sold = soldById.get(p.id);
        const unitsSold = sold?.unitsSold ?? 0;
        const revenue = sold?.revenue ?? 0;
        const cost = unitsSold * p.costPrice;
        const profit = revenue - cost;
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          costPrice: p.costPrice,
          price: p.price,
          marginPercent: p.marginPercent,
          active: p.active,
          unitsSold,
          revenue,
          profit,
          hasSales: unitsSold > 0,
        };
      })
      .sort((a, b) => b.profit - a.profit || b.marginPercent - a.marginPercent);
  }, [activeOrders, products]);
  const productProfitTotals = productProfit.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.revenue, profit: acc.profit + p.profit, unitsSold: acc.unitsSold + p.unitsSold }),
    { revenue: 0, profit: 0, unitsSold: 0 },
  );
  const topProfitProduct = productProfit.find((p) => p.hasSales);

  const assetStatusCounts: Record<AssetStatus, number> = useMemo(() => {
    const base = Object.fromEntries(ASSET_STATUSES.map((s) => [s, 0])) as Record<AssetStatus, number>;
    assets.forEach((a) => { base[a.status] += 1; });
    return base;
  }, [assets]);
  const assetsByType = useMemo(() => {
    return assetTypes.map((t) => ({ id: t.id, name: t.name, count: assets.filter((a) => a.assetTypeId === t.id).length }));
  }, [assetTypes, assets]);
  const recentMovements = useMemo(
    () => [...assetMovements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12),
    [assetMovements],
  );
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const ccByCodeForAssets = useMemo(() => Object.fromEntries(costCenters.map((c) => [c.code, c])), [costCenters]);

  const catracaEffective = useMemo(() => catracaRedemptions.map((r) => ({ r, status: catracaEffectiveStatus(r) })), [catracaRedemptions]);
  const catracaStatusCounts: Record<CatracaEffectiveStatus, number> = useMemo(() => {
    const base: Record<CatracaEffectiveStatus, number> = { "Aguardando retirada": 0, "Check-in realizado": 0, "Check-out realizado": 0, Perda: 0 };
    catracaEffective.forEach(({ status }) => { base[status] += 1; });
    return base;
  }, [catracaEffective]);
  const catracaByMeal = useMemo(
    () => MEAL_SERVICES.map((m) => ({ meal: m, count: catracaRedemptions.filter((r) => r.mealService === m).length })),
    [catracaRedemptions],
  );
  const recentCatraca = useMemo(
    () => [...catracaRedemptions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12),
    [catracaRedemptions],
  );
  const kitById = useMemo(() => Object.fromEntries(kits.map((k) => [k.id, k])), [kits]);

  const countStatus = (s: Order["status"]) => activeOrders.filter((o) => o.status === s).length;
  const openOccurrences = occurrences.filter((o) => o.status === "Aberta" || o.status === "Em análise").length;
  const statusCards: { glyph: string; label: string; value: string; bg: string; border: string; color: string; dash: ReportDash }[] = [
    { glyph: "🕓", label: "Aguardando aprovação", value: `${countStatus("Aguardando aprovação")} pedidos`, bg: "#fdf6ea", border: "#f0d49a", color: "#8a5a0f", dash: "pedidos" },
    { glyph: "🔥", label: "Em produção", value: `${countStatus("Em preparação")} pedidos`, bg: "#eef4fc", border: "#c7dcf5", color: "#1e4fa3", dash: "pedidos" },
    { glyph: "📬", label: "Prontos para entrega", value: `${countStatus("Pronto para entrega")} pedidos`, bg: "#eef8f1", border: "#bfe4cc", color: "#1a7a4f", dash: "pedidos" },
    { glyph: "📝", label: "Aguardando confirmação", value: `${countStatus("Solicitado")} pedidos`, bg: "#f3f0fb", border: "#d9d0f0", color: "#5a4a8a", dash: "pedidos" },
    { glyph: "⚠", label: "Ocorrências abertas", value: `${openOccurrences} ocorrências`, bg: "#fdf1ef", border: "#f0c6bd", color: "#c0392b", dash: "pedidos" },
  ];

  const pedidoResponses = useMemo(() => surveyResponses.filter((r) => r.kind === "pedido"), [surveyResponses]);
  const aplicacaoResponses = useMemo(() => surveyResponses.filter((r) => r.kind === "aplicacao"), [surveyResponses]);

  // NPS "geral" (Visão Geral) combina a resposta de NPS de todos os tipos de pedido — cada
  // tipo tem sua própria pergunta de NPS (uma pesquisa por tipo), então aqui juntamos todas.
  const allPedidoNpsIds = surveyQuestions.filter((q) => q.type === "NPS" && q.active).map((q) => q.id);
  const blendedNpsValues = pedidoResponses.flatMap((r) => r.answers.filter((a) => allPedidoNpsIds.includes(a.questionId) && typeof a.value === "number").map((a) => a.value as number));
  const pedidoNps = npsStats(blendedNpsValues);

  const [pesquisaCategory, setPesquisaCategory] = useState<(typeof ORDER_CATEGORIES)[number]>(ORDER_CATEGORIES[0]);
  const categoryOrderIds = useMemo(() => new Set(orders.filter((o) => o.category === pesquisaCategory).map((o) => o.id)), [orders, pesquisaCategory]);
  const categoryPedidoResponses = useMemo(() => pedidoResponses.filter((r) => r.orderId && categoryOrderIds.has(r.orderId)), [pedidoResponses, categoryOrderIds]);
  const categoryQuestions = surveyQuestions.filter((q) => q.orderCategory === pesquisaCategory);
  const categoryNpsQuestion = categoryQuestions.find((q) => q.type === "NPS" && q.active);
  const categoryNps = npsStats(categoryNpsQuestion ? numericAnswers(categoryPedidoResponses, categoryNpsQuestion.id) : []);
  const starQuestions = categoryQuestions.filter((q) => q.type === "Estrelas" && q.active);
  const textQuestions = categoryQuestions.filter((q) => q.type === "Texto" && q.active);

  const appNpsQuestion = appSurveyQuestions.find((q) => q.type === "NPS" && q.active);
  const appNps = npsStats(appNpsQuestion ? numericAnswers(aplicacaoResponses, appNpsQuestion.id) : []);
  const appRatedQuestions = appSurveyQuestions.filter((q) => q.active && (q.type === "Estrelas" || q.type === "Escala 1-5"));
  const appTextQuestions = appSurveyQuestions.filter((q) => q.active && q.type === "Texto");

  const kpis: { glyph: string; label: string; value: string; seed: number; sparkColor: string; dash: ReportDash }[] = [
    { glyph: "💰", label: "Faturamento total", value: money(totalFaturamento), seed: 1, sparkColor: "var(--color-primary)", dash: "faturamento" },
    { glyph: "📦", label: "Pedidos realizados", value: String(totalPedidos), seed: 2, sparkColor: "#1e4fa3", dash: "pedidos" },
    { glyph: "🎟", label: "Ticket médio", value: money(ticketMedio), seed: 3, sparkColor: "#1a7a4f", dash: "faturamento" },
    { glyph: "👥", label: "Unidades atendidas", value: String(unidadesAtendidas), seed: 4, sparkColor: "#b5690f", dash: "centros-custo" },
    { glyph: "⭐", label: "Satisfação (NPS)", value: pedidoNps.count > 0 ? String(pedidoNps.score) : "—", seed: 5, sparkColor: "#c99a1f", dash: "pesquisa-satisfacao" },
  ];

  const quotesByDateDesc = useMemo(
    () => [...quoteRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [quoteRequests],
  );
  const countQuoteStatus = (s: QuoteStatus) => quoteRequests.filter((q) => q.status === s).length;
  const approvedQuoteValue = quoteRequests
    .filter((q) => q.status === "Aprovado")
    .reduce((sum, q) => sum + (q.items ?? []).reduce((s, it) => s + it.qty * it.price, 0) * (1 + (q.serviceFeePercent ?? 0) / 100), 0);

  const recentOrders = ordersByDateDesc.slice(0, 5);
  const periodOrders = ordersByDateDesc;

  const exportRows = useMemo(
    () =>
      ordersByDateDesc.map((o) => ({
        id: o.id,
        type: o.type,
        unidade: orderUnitLabel(o, costCenters),
        datetime: o.datetime,
        people: o.peopleCount ?? 0,
        value: o.valueNumber ?? 0,
        status: o.status,
      })),
    [ordersByDateDesc, costCenters],
  );

  const activeFieldDefs = EXPORT_FIELD_DEFS.filter((f) => exportFields[f.key]);
  const noFieldsSelected = activeFieldDefs.length === 0;

  const toggleField = (key: ExportFieldKey) => setExportFields((s) => ({ ...s, [key]: !s[key] }));

  const doExport = () => {
    if (noFieldsSelected) return;
    const rows = [activeFieldDefs.map((f) => f.label).join(";")];
    exportRows.forEach((o) => {
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

  return (
    <div className="relatorios-page">
      <div className="relatorios-header">
        <div>
          <h1 className="relatorios-title">Relatórios</h1>
          <div className="relatorios-subtitle">Acompanhe indicadores, análise de pedidos e faturamento da sua operação — calculados a partir dos pedidos reais.</div>
        </div>
        <div className="relatorios-header__actions">
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
            {kpis.map((k) => (
              <button className="card relatorios-kpi relatorios-kpi--clickable" key={k.label} onClick={() => goDash(k.dash)}>
                <div className="relatorios-kpi__head">
                  <div className="relatorios-kpi__label">{k.label}</div>
                  <span>{k.glyph}</span>
                </div>
                <div className="relatorios-kpi__value">{k.value}</div>
                <Sparkline seed={k.seed} color={k.sparkColor} />
              </button>
            ))}
          </div>

          <div className="relatorios-row-1">
            <div className="card relatorios-panel">
              <div className="relatorios-panel-title">Faturamento por dia</div>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={barData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#edf1f7" />
                    <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: "#7d8798" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v) => [money(Number(v)), "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8f0" }} />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Nenhum pedido faturável ainda.</div>
              )}
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Faturamento por tipo de serviço</div>
                <button className="link" onClick={() => goDash("faturamento")}>Ver mais &rsaquo;</button>
              </div>
              <div className="relatorios-service-list">
                {serviceBreakdown.map((sb) => (
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
                {serviceBreakdown.length === 0 && <div className="relatorios-muted-sm">Nenhum pedido faturável ainda.</div>}
              </div>
              <div className="relatorios-panel-total">
                <span>Total</span>
                <span className="relatorios-panel-total__value">{money(serviceTotal)}</span>
              </div>
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Top centros de custo</div>
                <button className="link" onClick={() => goDash("centros-custo")}>Ver mais &rsaquo;</button>
              </div>
              <div className="relatorios-topunits">
                {topCostCenters.map((u, i) => (
                  <button className="relatorios-topunit relatorios-topunit--clickable" key={u.code} onClick={() => goDash("centros-custo")}>
                    <div className="relatorios-topunit__rank">{i + 1}</div>
                    <div className="relatorios-topunit__body">
                      <div className="relatorios-topunit__name">
                        {u.code} • {u.name}
                      </div>
                      <div className="relatorios-bar-track relatorios-bar-track--sm">
                        <div className="relatorios-bar-fill" style={{ width: `${u.pct}%`, background: "var(--color-primary)" }} />
                      </div>
                    </div>
                    <div className="relatorios-topunit__value">{money(u.value)}</div>
                  </button>
                ))}
                {topCostCenters.length === 0 && <div className="relatorios-muted-sm">Nenhum pedido com centro de custo alocado ainda.</div>}
              </div>
            </div>
          </div>

          <div className="relatorios-status-row">
            {statusCards.map((s) => (
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
              </div>
              {serviceBreakdown.map((sb) => (
                <div className="relatorios-summary__row" key={sb.label} style={{ gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.9fr" }}>
                  <div className="relatorios-summary__type">
                    <span className="relatorios-dot" style={{ background: sb.color }} />
                    {sb.label}
                  </div>
                  <div className="relatorios-summary__value">{money(sb.value)}</div>
                  <div className="relatorios-muted">{sb.pct}%</div>
                  <div>{sb.orders}</div>
                </div>
              ))}
              {serviceBreakdown.length === 0 && <div className="empty-state">Nenhum pedido faturável ainda.</div>}
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
              {recentOrders.map((o) => {
                const st = STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
                return (
                  <div className="relatorios-orders__row" key={o.id}>
                    <div className="relatorios-orders__id-wrap">
                      <div className="relatorios-orders__id">{o.id}</div>
                      <div className="relatorios-muted-sm">{o.type}</div>
                    </div>
                    <div className="relatorios-orders__unidade">{orderUnitLabel(o, costCenters)}</div>
                    <div className="relatorios-orders__datetime">{o.datetime}</div>
                    <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                      {o.status}
                    </span>
                  </div>
                );
              })}
              {recentOrders.length === 0 && <div className="empty-state">Nenhum pedido registrado ainda.</div>}
            </div>
          </div>
        </>
      )}

      {dash === "faturamento" && (
        <>
          <div className="relatorios-kpis">
            {kpis.filter((k) => k.dash === "faturamento").map((k) => (
              <div className="card relatorios-kpi" key={k.label}>
                <div className="relatorios-kpi__head">
                  <div className="relatorios-kpi__label">{k.label}</div>
                  <span>{k.glyph}</span>
                </div>
                <div className="relatorios-kpi__value">{k.value}</div>
                <Sparkline seed={k.seed} color={k.sparkColor} />
              </div>
            ))}
          </div>
          <div className="relatorios-row-1">
            <div className="card relatorios-panel" style={{ gridColumn: "span 2" }}>
              <div className="relatorios-panel-title">Faturamento por dia</div>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#edf1f7" />
                    <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: "#7d8798" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v) => [money(Number(v)), "Faturamento"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e3e8f0" }} />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Nenhum pedido faturável ainda.</div>
              )}
            </div>
            <div className="card relatorios-panel">
              <div className="relatorios-panel-title">Faturamento por tipo</div>
              <div className="relatorios-service-list">
                {serviceBreakdown.map((sb) => (
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
                <span className="relatorios-panel-total__value">{money(serviceTotal)}</span>
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
            </div>
            {serviceBreakdown.map((sb) => (
              <div className="relatorios-summary__row" key={sb.label} style={{ gridTemplateColumns: "1.3fr 0.8fr 0.8fr 0.9fr" }}>
                <div className="relatorios-summary__type">
                  <span className="relatorios-dot" style={{ background: sb.color }} />
                  {sb.label}
                </div>
                <div className="relatorios-summary__value">{money(sb.value)}</div>
                <div className="relatorios-muted">{sb.pct}%</div>
                <div>{sb.orders}</div>
              </div>
            ))}
            {serviceBreakdown.length === 0 && <div className="empty-state">Nenhum pedido faturável ainda.</div>}
          </div>
        </>
      )}

      {dash === "pedidos" && (
        <>
          <div className="relatorios-status-row">
            {statusCards.map((s) => (
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
            {periodOrders.map((o) => {
              const st = STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
              return (
                <div className="relatorios-orders__row" key={o.id}>
                  <div className="relatorios-orders__id-wrap">
                    <div className="relatorios-orders__id">{o.id}</div>
                    <div className="relatorios-muted-sm">{o.type}{o.peopleCount ? ` • ${o.peopleCount} pessoas` : ""}</div>
                  </div>
                  <div className="relatorios-orders__unidade">{orderUnitLabel(o, costCenters)}</div>
                  <div className="relatorios-orders__datetime">{o.datetime}</div>
                  <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                    {o.status}
                  </span>
                </div>
              );
            })}
            {periodOrders.length === 0 && <div className="empty-state">Nenhum pedido registrado ainda.</div>}
          </div>
        </>
      )}

      {dash === "centros-custo" && (
        <div className="relatorios-row-2">
          <div className="card relatorios-panel">
            <div className="relatorios-panel-title">Faturamento por centro de custo</div>
            <div className="relatorios-topunits">
              {topCostCenters.map((u, i) => (
                <div className="relatorios-topunit" key={u.code}>
                  <div className="relatorios-topunit__rank">{i + 1}</div>
                  <div className="relatorios-topunit__body">
                    <div className="relatorios-topunit__name">
                      {u.code} • {u.name}
                    </div>
                    <div className="relatorios-bar-track relatorios-bar-track--sm">
                      <div className="relatorios-bar-fill" style={{ width: `${u.pct}%`, background: "var(--color-primary)" }} />
                    </div>
                  </div>
                  <div className="relatorios-topunit__value">{money(u.value)}</div>
                </div>
              ))}
              {topCostCenters.length === 0 && <div className="empty-state">Nenhum pedido com centro de custo alocado ainda.</div>}
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

      {dash === "lucro-produto" && (
        <>
          <div className="relatorios-kpis">
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Lucro realizado</span>
                <span>💰</span>
              </div>
              <div className="relatorios-kpi__value">{money(productProfitTotals.profit)}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Faturamento rastreado</span>
                <span>📦</span>
              </div>
              <div className="relatorios-kpi__value">{money(productProfitTotals.revenue)}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Unidades vendidas</span>
                <span>🔢</span>
              </div>
              <div className="relatorios-kpi__value">{productProfitTotals.unitsSold}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Produto mais lucrativo</span>
                <span>⭐</span>
              </div>
              <div className="relatorios-kpi__value" style={{ fontSize: 15 }}>{topProfitProduct ? topProfitProduct.name : "—"}</div>
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Lucro por produto</div>
              <Link to="/admin/produtos" className="link">
                Gerenciar catálogo &rsaquo;
              </Link>
            </div>
            <div className="relatorios-muted-sm" style={{ marginBottom: 14 }}>
              Margem e preço vêm do cadastro do produto. Unidades vendidas, faturamento e lucro realizado são calculados a partir dos pedidos reais que usaram esse produto (Coffee Break, Água e Abastecimento Simples) — pedidos com itens de kit ainda não rastreiam produto individual.
            </div>
            <div className="relatorios-summary__head" style={{ gridTemplateColumns: "1.6fr 0.8fr 0.8fr 0.9fr 0.8fr 0.9fr 0.9fr" }}>
              <div>Produto</div>
              <div>Custo</div>
              <div>Preço</div>
              <div>Margem cadastrada</div>
              <div>Vendidos</div>
              <div>Faturamento</div>
              <div>Lucro realizado</div>
            </div>
            {productProfit.map((p) => (
              <div className="relatorios-summary__row" key={p.id} style={{ gridTemplateColumns: "1.6fr 0.8fr 0.8fr 0.9fr 0.8fr 0.9fr 0.9fr" }}>
                <div>
                  <div className="relatorios-summary__type">{p.name}</div>
                  <div className="relatorios-muted-sm">{p.type}{!p.active && " · inativo"}</div>
                </div>
                <div className="relatorios-muted">{money(p.costPrice)}</div>
                <div className="relatorios-muted">{money(p.price)}</div>
                <div className="relatorios-muted">{p.marginPercent}%</div>
                <div className="relatorios-muted">{p.hasSales ? p.unitsSold : "—"}</div>
                <div className="relatorios-muted">{p.hasSales ? money(p.revenue) : "—"}</div>
                <div style={{ fontWeight: 700, color: p.hasSales ? (p.profit >= 0 ? "var(--color-success)" : "var(--color-danger)") : "var(--color-text-muted)" }}>
                  {p.hasSales ? money(p.profit) : "—"}
                </div>
              </div>
            ))}
            {productProfit.length === 0 && <div className="empty-state">Nenhum produto cadastrado.</div>}
          </div>
        </>
      )}

      {dash === "ativos" && (
        <>
          <div className="relatorios-kpis">
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Total de ativos</span>
                <span>📦</span>
              </div>
              <div className="relatorios-kpi__value">{assets.length}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Ativos</span>
                <span>✅</span>
              </div>
              <div className="relatorios-kpi__value">{assetStatusCounts["Ativo"]}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Em manutenção / extraviados</span>
                <span>⚠</span>
              </div>
              <div className="relatorios-kpi__value">{assetStatusCounts["Em manutenção"] + assetStatusCounts["Extraviado"]}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Movimentações registradas</span>
                <span>🔁</span>
              </div>
              <div className="relatorios-kpi__value">{assetMovements.length}</div>
            </div>
          </div>

          <div className="relatorios-row-2">
            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Ativos por tipo</div>
                <Link to="/admin/tipos-ativo" className="link">
                  Gerenciar tipos &rsaquo;
                </Link>
              </div>
              <div className="relatorios-service-list">
                {assetsByType.map((t) => {
                  const pct = assets.length > 0 ? Math.round((t.count / assets.length) * 100) : 0;
                  return (
                    <div key={t.id}>
                      <div className="relatorios-service-row">
                        <span>{t.name}</span>
                        <span>{t.count}</span>
                      </div>
                      <div className="relatorios-bar-track relatorios-bar-track--sm">
                        <div className="relatorios-bar-fill" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                      </div>
                    </div>
                  );
                })}
                {assetsByType.length === 0 && <div className="empty-state">Nenhum tipo de ativo cadastrado.</div>}
              </div>
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Ativos por status</div>
                <Link to="/admin/ativos" className="link">
                  Ver ativos &rsaquo;
                </Link>
              </div>
              <div className="relatorios-service-list">
                {ASSET_STATUSES.map((s) => {
                  const count = assetStatusCounts[s];
                  const pct = assets.length > 0 ? Math.round((count / assets.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="relatorios-service-row">
                        <span>{s}</span>
                        <span>{count}</span>
                      </div>
                      <div className="relatorios-bar-track relatorios-bar-track--sm">
                        <div className="relatorios-bar-fill" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Movimentações recentes (check-in / check-out)</div>
              <Link to="/admin/ativos/checkin" className="link">
                Registrar movimentação &rsaquo;
              </Link>
            </div>
            <div className="relatorios-summary__head" style={{ gridTemplateColumns: "1.4fr 0.8fr 1.2fr 1.2fr 1fr" }}>
              <div>Ativo</div>
              <div>Movimento</div>
              <div>Departamento</div>
              <div>Localização</div>
              <div>Data</div>
            </div>
            {recentMovements.map((m) => (
              <div className="relatorios-summary__row" key={m.id} style={{ gridTemplateColumns: "1.4fr 0.8fr 1.2fr 1.2fr 1fr" }}>
                <div className="relatorios-summary__type">{assetById[m.assetId]?.name ?? m.assetId}</div>
                <div>
                  <span className="pill-tag">{m.kind === "checkin" ? "Check-in" : "Check-out"}</span>
                </div>
                <div className="relatorios-muted">{m.costCenterCode ? ccByCodeForAssets[m.costCenterCode]?.name ?? m.costCenterCode : "—"}</div>
                <div className="relatorios-muted">{m.location || "—"}</div>
                <div className="relatorios-muted">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</div>
              </div>
            ))}
            {recentMovements.length === 0 && <div className="empty-state">Nenhuma movimentação registrada ainda.</div>}
          </div>
        </>
      )}

      {dash === "catraca" && (
        <>
          <div className="relatorios-kpis">
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Total de consumos</span>
                <span>🍽</span>
              </div>
              <div className="relatorios-kpi__value">{catracaRedemptions.length}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Aguardando retirada</span>
                <span>⏳</span>
              </div>
              <div className="relatorios-kpi__value">{catracaStatusCounts["Aguardando retirada"]}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Check-outs concluídos</span>
                <span>✅</span>
              </div>
              <div className="relatorios-kpi__value">{catracaStatusCounts["Check-out realizado"]}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Perdas (sem check-out em 1h)</span>
                <span>⚠</span>
              </div>
              <div className="relatorios-kpi__value" style={{ color: catracaStatusCounts.Perda > 0 ? "var(--color-danger)" : undefined }}>
                {catracaStatusCounts.Perda}
              </div>
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Consumos por refeição</div>
              <Link to="/admin/kits" className="link">
                Gerenciar kits &rsaquo;
              </Link>
            </div>
            <div className="relatorios-service-list">
              {catracaByMeal.map((m) => {
                const pct = catracaRedemptions.length > 0 ? Math.round((m.count / catracaRedemptions.length) * 100) : 0;
                return (
                  <div key={m.meal}>
                    <div className="relatorios-service-row">
                      <span>{m.meal}</span>
                      <span>{m.count}</span>
                    </div>
                    <div className="relatorios-bar-track relatorios-bar-track--sm">
                      <div className="relatorios-bar-fill" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Consumos recentes</div>
              <Link to="/admin/catraca-checkin" className="link">
                Check-in da operação &rsaquo;
              </Link>
            </div>
            <div className="relatorios-summary__head" style={{ gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr" }}>
              <div>Kit</div>
              <div>Refeição</div>
              <div>Retirada</div>
              <div>Solicitante</div>
              <div>Status</div>
            </div>
            {recentCatraca.map((r) => (
              <div className="relatorios-summary__row" key={r.id} style={{ gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr" }}>
                <div className="relatorios-summary__type">{kitById[r.kitId]?.name ?? "Kit removido"}</div>
                <div className="relatorios-muted">{r.mealService}</div>
                <div className="relatorios-muted">
                  {r.pickupDate} {r.pickupTime}
                </div>
                <div className="relatorios-muted">{r.requestedBy ?? "—"}</div>
                <div>
                  <span className="pill-tag">{catracaEffectiveStatus(r)}</span>
                </div>
              </div>
            ))}
            {recentCatraca.length === 0 && <div className="empty-state">Nenhum consumo registrado ainda.</div>}
          </div>
        </>
      )}

      {dash === "orcamentos" && (
        <>
          <div className="relatorios-kpis">
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Aprovados</span>
                <span>✅</span>
              </div>
              <div className="relatorios-kpi__value">{countQuoteStatus("Aprovado")}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Rejeitados</span>
                <span>✕</span>
              </div>
              <div className="relatorios-kpi__value">{countQuoteStatus("Rejeitado")}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Cancelados</span>
                <span>🚫</span>
              </div>
              <div className="relatorios-kpi__value">{countQuoteStatus("Cancelado")}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Editados (em revisão)</span>
                <span>✎</span>
              </div>
              <div className="relatorios-kpi__value">{countQuoteStatus("Editado")}</div>
            </div>
            <div className="card relatorios-kpi">
              <div className="relatorios-kpi__head">
                <span className="relatorios-kpi__label">Valor aprovado</span>
                <span>💰</span>
              </div>
              <div className="relatorios-kpi__value">{money(approvedQuoteValue)}</div>
            </div>
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-head">
              <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>Todas as solicitações de orçamento</div>
              <Link to="/admin/orcamentos" className="link">
                Ir para Orçamentos &rsaquo;
              </Link>
            </div>
            <div className="relatorios-summary__head" style={{ gridTemplateColumns: "1.3fr 1.1fr 0.9fr 0.9fr 1fr" }}>
              <div>Serviço</div>
              <div>Cliente</div>
              <div>Data prevista</div>
              <div>Pedido gerado</div>
              <div>Status</div>
            </div>
            {quotesByDateDesc.map((q) => (
              <div className="relatorios-summary__row" key={q.id} style={{ gridTemplateColumns: "1.3fr 1.1fr 0.9fr 0.9fr 1fr" }}>
                <div className="relatorios-summary__type">{q.serviceType}</div>
                <div className="relatorios-muted">{q.requestedBy ?? "—"}</div>
                <div className="relatorios-muted">{new Date(`${q.expectedDate}T00:00:00`).toLocaleDateString("pt-BR")}</div>
                <div className="relatorios-muted">{q.orderId ?? "—"}</div>
                <div>
                  <span className="status-pill" style={{ background: QUOTE_STATUS_STYLE[q.status].bg, color: QUOTE_STATUS_STYLE[q.status].color }}>
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
            {quotesByDateDesc.length === 0 && <div className="empty-state">Nenhuma solicitação de orçamento ainda.</div>}
          </div>
        </>
      )}

      {dash === "pesquisa-satisfacao" && (
        <>
          <div className="tab-row" style={{ marginBottom: 18 }}>
            {ORDER_CATEGORIES.map((c) => (
              <button key={c} className={pesquisaCategory === c ? "is-active" : ""} onClick={() => setPesquisaCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="relatorios-row-2">
            <div className="card relatorios-panel">
              <div className="relatorios-panel-head">
                <div className="relatorios-panel-title" style={{ marginBottom: 0 }}>NPS &middot; {pesquisaCategory}</div>
                <Link to="/admin/pesquisa-satisfacao" className="link">
                  Configurar perguntas &rsaquo;
                </Link>
              </div>
              <div className="relatorios-kpi__value" style={{ fontSize: 32, marginTop: 10, marginBottom: 4 }}>{categoryNps.count > 0 ? categoryNps.score : "—"}</div>
              <div className="relatorios-muted-sm" style={{ marginBottom: 14 }}>
                {categoryNps.count > 0 ? `Calculado a partir de ${categoryNps.count} resposta(s) reais` : "Nenhuma resposta recebida ainda"}
              </div>
              {categoryNps.count > 0 ? (
                <div className="relatorios-service-list">
                  {[
                    { label: "Promotores (9-10)", pct: categoryNps.promoter, color: "#1a7a4f" },
                    { label: "Neutros (7-8)", pct: categoryNps.neutral, color: "#c99a1f" },
                    { label: "Detratores (0-6)", pct: categoryNps.detractor, color: "#c0392b" },
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
              ) : (
                <div className="empty-state">Sem dados suficientes para o gráfico.</div>
              )}
            </div>

            <div className="card relatorios-panel">
              <div className="relatorios-panel-title">Avaliações por pergunta</div>
              <div className="relatorios-service-list">
                {starQuestions.map((q) => {
                  const { avg, count } = avgOf(numericAnswers(categoryPedidoResponses, q.id));
                  return (
                    <div key={q.id} className="relatorios-service-row" style={{ marginBottom: 8 }}>
                      <span className="relatorios-service-label">{q.text}</span>
                      <span className="relatorios-muted">
                        {count > 0 ? `${"★".repeat(Math.round(avg))}${"☆".repeat(5 - Math.round(avg))}` : "Sem avaliações ainda"}
                      </span>
                    </div>
                  );
                })}
                {starQuestions.length === 0 && <div className="relatorios-muted-sm">Nenhuma pergunta de estrelas configurada para {pesquisaCategory}.</div>}
              </div>
              <div className="relatorios-panel-total" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                <span>Comentários recentes</span>
                {textQuestions.flatMap((q) => textAnswers(categoryPedidoResponses, q.id)).slice(0, 3).map((t, i) => (
                  <div key={i} className="relatorios-muted-sm">“{t}”</div>
                ))}
                {textQuestions.flatMap((q) => textAnswers(categoryPedidoResponses, q.id)).length === 0 && (
                  <div className="relatorios-muted-sm">Nenhum comentário recebido ainda.</div>
                )}
              </div>
            </div>
          </div>
        </>
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
            <div className="relatorios-kpi__value" style={{ fontSize: 32, marginTop: 10, marginBottom: 4 }}>{appNps.count > 0 ? appNps.score : "—"}</div>
            <div className="relatorios-muted-sm" style={{ marginBottom: 14 }}>
              {appNps.count > 0 ? `Calculado a partir de ${appNps.count} resposta(s) reais` : "Nenhuma resposta recebida ainda"}
            </div>
            {appNps.count > 0 ? (
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
            ) : (
              <div className="empty-state">Sem dados suficientes para o gráfico.</div>
            )}
          </div>

          <div className="card relatorios-panel">
            <div className="relatorios-panel-title">CX &amp; UX por pergunta</div>
            <div className="relatorios-service-list">
              {appRatedQuestions.map((q) => {
                const { avg, count } = avgOf(numericAnswers(aplicacaoResponses, q.id));
                return (
                  <div key={q.id} className="relatorios-service-row" style={{ marginBottom: 8 }}>
                    <span className="relatorios-service-label">
                      <span className="relatorios-dot" style={{ background: APP_SURVEY_CATEGORY_COLOR[q.category] }} />
                      {q.text}
                    </span>
                    <span className="relatorios-muted">{count > 0 ? `${avg.toFixed(1)}/5` : "Sem avaliações ainda"}</span>
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
            {activeFieldDefs.length} campo(s) selecionado(s) &bull; {exportRows.length} pedidos no total
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
