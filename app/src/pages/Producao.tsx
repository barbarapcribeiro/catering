import { useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import type { Order } from "../types";
import "./Producao.css";

type FilterTab = "aguardando" | "producao" | "pronto" | "todos";
type SortBy = "recentes" | "pessoas" | "unidade";

const STATUS_STYLE: Record<string, { bg: string; color: string; accent: string }> = {
  Solicitado: { bg: "#e9e5f4", color: "#5a4a8a", accent: "#5a4a8a" },
  "Em preparação": { bg: "#dfeaff", color: "#1e4fa3", accent: "#1e4fa3" },
  "Pronto para entrega": { bg: "#e6f5ec", color: "#1a7a4f", accent: "#1a7a4f" },
};

const CAPACITY = 180;

export function Producao() {
  const { orders, updateOrder, costCenters, showToast } = useAppData();

  const kitchenOrders = useMemo(
    () => orders.filter((o) => o.status === "Solicitado" || o.status === "Em preparação" || o.status === "Pronto para entrega"),
    [orders],
  );

  const [startedIds, setStartedIds] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<FilterTab>("todos");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recentes");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIdOrDefault = selectedId ?? kitchenOrders[0]?.id ?? null;

  const startProduction = (id: string) => {
    const order = kitchenOrders.find((o) => o.id === id);
    if (order?.status === "Solicitado") {
      updateOrder(id, { status: "Em preparação" });
    }
    setStartedIds((prev) => new Set(prev).add(id));
    showToast(`Produção iniciada para o pedido ${id}.`);
  };

  const markReady = (id: string) => {
    updateOrder(id, { status: "Pronto para entrega" });
    setStartedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast(`Pedido ${id} marcado como pronto para entrega.`);
  };

  const markDelivered = (id: string) => {
    updateOrder(id, { status: "Entregue" });
    showToast(`Pedido ${id} marcado como entregue.`);
  };

  const bucketOf = (o: Order): Exclude<FilterTab, "todos"> => {
    if (o.status === "Pronto para entrega") return "pronto";
    return startedIds.has(o.id) ? "producao" : "aguardando";
  };

  const counts = {
    aguardando: kitchenOrders.filter((o) => bucketOf(o) === "aguardando").length,
    producao: kitchenOrders.filter((o) => bucketOf(o) === "producao").length,
    pronto: kitchenOrders.filter((o) => bucketOf(o) === "pronto").length,
    todos: kitchenOrders.length,
  };

  const filterDefs: { id: FilterTab; label: string; count: number }[] = [
    { id: "aguardando", label: "Aguardando produção", count: counts.aguardando },
    { id: "producao", label: "Em produção", count: counts.producao },
    { id: "pronto", label: "Prontos para entrega", count: counts.pronto },
    { id: "todos", label: "Todos", count: counts.todos },
  ];

  let filtered = kitchenOrders;
  if (filterTab !== "todos") filtered = filtered.filter((o) => bucketOf(o) === filterTab);
  const q = search.trim().toLowerCase();
  if (q) filtered = filtered.filter((o) => o.type.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || (o.location ?? "").toLowerCase().includes(q));

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "pessoas") return (b.peopleCount ?? 0) - (a.peopleCount ?? 0);
    if (sortBy === "unidade") return (a.location ?? "").localeCompare(b.location ?? "");
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selected = kitchenOrders.find((o) => o.id === selectedIdOrDefault) ?? null;

  const totalPeopleQueued = kitchenOrders.reduce((sum, o) => sum + (o.peopleCount ?? 0), 0);
  const loadPct = CAPACITY > 0 ? Math.min(100, Math.round((totalPeopleQueued / CAPACITY) * 100)) : 0;

  const summaryCards = [
    { glyph: "🕓", iconBg: "#fdedd3", iconColor: "#8a5a0f", value: counts.aguardando, label: "Aguardando produção" },
    { glyph: "🔥", iconBg: "#dfeaff", iconColor: "#1e4fa3", value: counts.producao, label: "Em produção" },
    { glyph: "✓", iconBg: "#e6f5ec", iconColor: "#1a7a4f", value: counts.pronto, label: "Prontos para entrega" },
    { glyph: "📋", iconBg: "#f1eef9", iconColor: "#5a4a8a", value: counts.todos, label: "Total na fila" },
  ];

  const alerts = useMemo(() => {
    const list: { glyph: string; bg: string; color: string; text: string }[] = [];
    const dietary = kitchenOrders.filter((o) => o.dietaryRestrictions && o.dietaryRestrictions !== "Nenhuma");
    if (dietary.length > 0) {
      list.push({ glyph: "🌾", bg: "#dfeaff", color: "#1e4fa3", text: `${dietary.length} pedido(s) com restrição alimentar — atenção aos ingredientes.` });
    }
    const withNotes = kitchenOrders.filter((o) => o.notes && o.notes.trim());
    if (withNotes.length > 0) {
      list.push({ glyph: "⚠️", bg: "#fdedd3", color: "#8a5a0f", text: `${withNotes.length} pedido(s) com observações — verifique antes da produção.` });
    }
    return list;
  }, [kitchenOrders]);

  const costCenterLabel = (o: Order) => {
    const first = o.costCenters?.[0];
    if (!first) return "—";
    const cc = costCenters.find((c) => c.code === first.code);
    return cc ? `${cc.code} · ${cc.name}` : first.code;
  };

  return (
    <Layout>
      <div className="page-container prod-page">
        <div className="prod-title-row">
          <div>
            <h1 className="prod-title">Pedidos para Produção</h1>
            <div className="prod-subtitle">Acompanhe e organize os pedidos que devem entrar em produção.</div>
          </div>
          <div className="prod-top-actions">
            <div className="prod-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido, tipo ou unidade..." />
            </div>
            <button className="btn btn--outline prod-refresh-btn" onClick={() => showToast("Lista atualizada.")}>
              ↻ Atualizar lista
            </button>
            <button className="btn btn--primary prod-print-btn" onClick={() => showToast("Enviando tickets para impressão...")}>
              🖨 Imprimir tickets
            </button>
          </div>
        </div>

        <div className="prod-filter-tabs">
          {filterDefs.map((ft) => (
            <button key={ft.id} className={`prod-filter-tab ${filterTab === ft.id ? "is-active" : ""}`} onClick={() => setFilterTab(ft.id)}>
              {ft.label}
              <span className="prod-filter-tab__count">{ft.count}</span>
            </button>
          ))}
        </div>

        <div className="prod-grid">
          {/* LEFT: order list */}
          <div className="prod-panel prod-list-panel">
            <div className="prod-sort-row">
              <span>Ordenar por:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                <option value="recentes">Mais recentes</option>
                <option value="pessoas">Nº de pessoas</option>
                <option value="unidade">Unidade</option>
              </select>
            </div>

            <div className="prod-order-list">
              {filtered.map((o) => {
                const st = STATUS_STYLE[o.status] ?? { bg: "#eee", color: "#555", accent: "#ccc" };
                const active = o.id === selectedIdOrDefault;
                return (
                  <div
                    key={o.id}
                    className={`prod-order-row ${active ? "is-active" : ""}`}
                    style={{ borderLeftColor: st.accent }}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <div className="prod-mono">{o.mono}</div>
                    <div className="prod-order-row__info">
                      <div className="prod-order-row__name">{o.type}</div>
                      <div className="prod-order-row__meta">
                        {o.peopleCount ? `${o.peopleCount} pessoas · ` : ""}
                        {o.location || "—"}
                      </div>
                      <div className="prod-order-row__id">{o.id}</div>
                    </div>
                    <div className="prod-order-row__status">
                      <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                        {bucketOf(o) === "producao" ? "Em produção" : o.status}
                      </span>
                      <div className="prod-order-row__eta">{o.datetime}</div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="empty-state">Nenhum pedido nesse filtro.</div>}
            </div>
            <div className="prod-list-footer">
              Mostrando {filtered.length} de {kitchenOrders.length} pedidos
            </div>
          </div>

          {/* MIDDLE: resumo */}
          <div className="prod-side-col">
            <div className="prod-panel prod-summary-card">
              <div className="prod-summary-card__title">Resumo da produção</div>
              <div className="prod-summary-card__subtitle">Pedidos aprovados aguardando produção ou entrega</div>
              <div className="prod-summary-grid">
                {summaryCards.map((sc) => (
                  <div key={sc.label} className="prod-summary-tile">
                    <div className="prod-summary-tile__icon" style={{ background: sc.iconBg, color: sc.iconColor }}>
                      {sc.glyph}
                    </div>
                    <div className="prod-summary-tile__value">{sc.value}</div>
                    <div className="prod-summary-tile__label">{sc.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="prod-panel prod-load-card">
              <div className="prod-load-card__header">
                <span className="prod-side-card__title">Carga de produção</span>
                <span className="prod-load-card__info" title="Soma de pessoas atendidas pelos pedidos na fila, comparada à capacidade diária configurada.">
                  ⓘ
                </span>
              </div>
              <div className="prod-load-bar">
                <div className="prod-load-bar__fill" style={{ width: `${loadPct}%` }} />
              </div>
              <div className="prod-load-card__row">
                <span>Capacidade do dia: {CAPACITY} pessoas</span>
                <span className="prod-load-card__pct">{loadPct}%</span>
              </div>
              <div className="prod-load-card__produced">Em fila: {totalPeopleQueued} pessoas</div>
            </div>

            <div className="prod-panel prod-alerts-card">
              <div className="prod-side-card__title">Alertas</div>
              {alerts.length === 0 && <div className="empty-state">Nenhum alerta no momento.</div>}
              <div className="prod-alerts-list">
                {alerts.map((al) => (
                  <div key={al.text} className="prod-alert-row" style={{ background: al.bg }}>
                    <span className="prod-alert-row__glyph">{al.glyph}</span>
                    <div className="prod-alert-row__text" style={{ color: al.color }}>
                      {al.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: detalhes */}
          <div className="prod-panel prod-detail-panel">
            {selected && (
              <>
                <div className="prod-detail-header">
                  <span className="prod-side-card__title">Detalhes do pedido</span>
                  <button className="prod-detail-close" onClick={() => setSelectedId(null)} aria-label="Fechar detalhes">
                    &times;
                  </button>
                </div>
                <div className="prod-detail-identity">
                  <div className="prod-mono prod-mono--lg">{selected.mono}</div>
                  <div className="prod-detail-identity__name">{selected.type}</div>
                  <span className="status-pill" style={{ background: (STATUS_STYLE[selected.status] ?? STATUS_STYLE["Em preparação"]).bg, color: (STATUS_STYLE[selected.status] ?? STATUS_STYLE["Em preparação"]).color }}>
                    {bucketOf(selected) === "producao" ? "Em produção" : selected.status}
                  </span>
                </div>

                <div className="prod-detail-summary">
                  <div>
                    <div className="prod-detail-summary__label">Pedido</div>
                    <div className="prod-detail-summary__value">{selected.id}</div>
                  </div>
                  <div className="prod-detail-summary__right">
                    <div className="prod-detail-summary__label">Centro de custo</div>
                    <div className="prod-detail-summary__value">{costCenterLabel(selected)}</div>
                  </div>
                </div>

                <div className="prod-detail-facts">
                  <div className="prod-detail-fact">
                    <span>📅</span>
                    <div>
                      <div className="prod-detail-fact__label">Data/Hora</div>
                      <div className="prod-detail-fact__value">{selected.datetime}</div>
                    </div>
                  </div>
                  <div className="prod-detail-fact">
                    <span>👥</span>
                    <div>
                      <div className="prod-detail-fact__label">Pessoas</div>
                      <div className="prod-detail-fact__value">{selected.peopleCount ? `${selected.peopleCount} pessoas` : "—"}</div>
                    </div>
                  </div>
                  <div className="prod-detail-fact">
                    <span>📍</span>
                    <div>
                      <div className="prod-detail-fact__label">Local</div>
                      <div className="prod-detail-fact__value">{selected.location || "—"}</div>
                    </div>
                  </div>
                  {selected.notes && (
                    <div className="prod-detail-fact">
                      <span>📝</span>
                      <div>
                        <div className="prod-detail-fact__label">Observações</div>
                        <div className="prod-detail-fact__value">{selected.notes}</div>
                      </div>
                    </div>
                  )}
                  {selected.dietaryRestrictions && selected.dietaryRestrictions !== "Nenhuma" && (
                    <div className="prod-detail-fact">
                      <span>🌾</span>
                      <div>
                        <div className="prod-detail-fact__label">Restrições alimentares</div>
                        <div className="prod-detail-fact__value">{selected.dietaryRestrictions}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="prod-detail-items-title">
                  Itens do pedido <span className="prod-detail-items-title__count">({selected.items?.length ?? 0} itens)</span>
                </div>
                <div className="prod-detail-items">
                  {(selected.items ?? []).map((it) => (
                    <div key={it.name} className="prod-detail-item">
                      <span>{it.name}</span>
                      <div className="prod-detail-item__right">
                        <span className="prod-detail-item__qty">{it.qty}</span>
                      </div>
                    </div>
                  ))}
                  {(!selected.items || selected.items.length === 0) && <div className="empty-state">Sem itens detalhados para este pedido.</div>}
                </div>

                {bucketOf(selected) === "aguardando" && (
                  <button className="btn btn--primary btn--full prod-start-btn" onClick={() => startProduction(selected.id)}>
                    ▶ Iniciar produção
                  </button>
                )}
                {bucketOf(selected) === "producao" && (
                  <button className="btn btn--primary btn--full prod-start-btn" onClick={() => markReady(selected.id)}>
                    ✓ Marcar como pronto
                  </button>
                )}
                {bucketOf(selected) === "pronto" && (
                  <button className="btn btn--primary btn--full prod-start-btn" onClick={() => markDelivered(selected.id)}>
                    📬 Marcar como entregue
                  </button>
                )}
                <button className="btn btn--outline btn--full" onClick={() => showToast("Enviando ticket para impressão...")}>
                  🖨 Imprimir ticket
                </button>
              </>
            )}
            {!selected && <div className="prod-detail-empty">Selecione um pedido na lista.</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
