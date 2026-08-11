import { useState } from "react";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import "./Producao.css";

type ProdStatus = "Aguardando produção" | "Em produção" | "Pronto para entrega" | "Agendado";
type FilterTab = "aguardando" | "producao" | "pronto" | "todos";
type SortBy = "hora" | "pessoas" | "unidade";

interface ProdOrder {
  id: string;
  name: string;
  mono: string;
  time: string;
  dateRel: string;
  people: number;
  unidade: string;
  status: ProdStatus;
  eta: string;
  solicitante: string;
  dateTime: string;
  local: string;
  obs: string;
  items: { name: string; qty: string; people: string }[];
}

const STATUS_STYLE: Record<ProdStatus, { bg: string; color: string; accent: string }> = {
  "Aguardando produção": { bg: "#fdedd3", color: "#8a5a0f", accent: "#e0a83a" },
  "Em produção": { bg: "#dfeaff", color: "#1e4fa3", accent: "#1e4fa3" },
  "Pronto para entrega": { bg: "#e6f5ec", color: "#1a7a4f", accent: "#1a7a4f" },
  Agendado: { bg: "#f1eef9", color: "#5a4a8a", accent: "#5a4a8a" },
};

// Kitchen/production-floor view of today's queue. This is intentionally a separate
// mock dataset from the shared `orders` in AppDataContext: the shared list models the
// requester's order history (arbitrary dates/status vocabulary), while this page needs
// a same-day production queue with its own status vocabulary (Aguardando produção / Em
// produção / Pronto para entrega / Agendado) and fields (solicitante, ETA, unidade)
// that don't exist on the shared Order type — matching how the source prototype models it.
const INITIAL_ORDERS: ProdOrder[] = [
  {
    id: "CB-15234",
    name: "Coffee Break Diretoria",
    mono: "CB",
    time: "09:30",
    dateRel: "Hoje",
    people: 20,
    unidade: "Unidade Matriz",
    status: "Aguardando produção",
    eta: "Em 15 min",
    solicitante: "Bárbara C. Ribeiro",
    dateTime: "24/07/2026 às 09:30",
    local: "Sala 402 • Unidade Matriz",
    obs: "Reunião mensal da diretoria. Favor entregar com 15 min de antecedência.",
    items: [
      { name: "Coffee Executivo", qty: "1 kit", people: "20 pessoas" },
      { name: "Água Mineral 500ml", qty: "20 un.", people: "" },
      { name: "Suco Natural 300ml", qty: "20 un.", people: "" },
      { name: "Pão de queijo", qty: "40 un.", people: "" },
    ],
  },
  {
    id: "LAN-15210",
    name: "Lanche Reunião Comercial",
    mono: "LA",
    time: "10:00",
    dateRel: "Hoje",
    people: 15,
    unidade: "Unidade Matriz",
    status: "Aguardando produção",
    eta: "Em 45 min",
    solicitante: "Carlos Mendes",
    dateTime: "24/07/2026 às 10:00",
    local: "Sala 210 • Unidade Matriz",
    obs: "",
    items: [{ name: "Lanche Individual", qty: "15 un.", people: "" }],
  },
  {
    id: "EVT-15188",
    name: "Evento Especial RH",
    mono: "EE",
    time: "11:00",
    dateRel: "Hoje",
    people: 30,
    unidade: "Unidade RH",
    status: "Em produção",
    eta: "Em 1h 45 min",
    solicitante: "Fernanda Souza",
    dateTime: "24/07/2026 às 11:00",
    local: "Auditório • Unidade RH",
    obs: "Confirmar decoração temática.",
    items: [{ name: "Evento Especial", qty: "1 pacote", people: "30 pessoas" }],
  },
  {
    id: "MEX-15123",
    name: "Marmitex Executivo",
    mono: "MX",
    time: "12:00",
    dateRel: "Hoje",
    people: 25,
    unidade: "Unidade Matriz",
    status: "Em produção",
    eta: "Em 2h 45 min",
    solicitante: "João Paulo",
    dateTime: "24/07/2026 às 12:00",
    local: "Refeitório • Unidade Matriz",
    obs: "",
    items: [{ name: "Refeição Marmitex", qty: "25 un.", people: "" }],
  },
  {
    id: "CB-15098",
    name: "Coffee Break Financeiro",
    mono: "CB",
    time: "13:30",
    dateRel: "Hoje",
    people: 18,
    unidade: "Unidade Financeira",
    status: "Pronto para entrega",
    eta: "Em 4h 15 min",
    solicitante: "Ana Paula",
    dateTime: "24/07/2026 às 13:30",
    local: "Sala 12 • Unidade Financeira",
    obs: "",
    items: [{ name: "Coffee Premium", qty: "1 kit", people: "18 pessoas" }],
  },
  {
    id: "HH-15145",
    name: "Happy Hour Equipe",
    mono: "HH",
    time: "15:00",
    dateRel: "Hoje",
    people: 25,
    unidade: "Unidade Matriz",
    status: "Agendado",
    eta: "Em 5h 45 min",
    solicitante: "Rodrigo Alves",
    dateTime: "24/07/2026 às 15:00",
    local: "Terraço • Unidade Matriz",
    obs: "",
    items: [{ name: "Serviços Diversos", qty: "1 pacote", people: "25 pessoas" }],
  },
];

const ALERTS = [
  { glyph: "⚠️", bg: "#fdedd3", color: "#8a5a0f", text: "2 pedidos com alterações — verifique as observações antes da produção." },
  { glyph: "🌾", bg: "#dfeaff", color: "#1e4fa3", text: "1 pedido com restrição alimentar — atenção aos ingredientes." },
  { glyph: "📉", bg: "#fbe4e0", color: "#c0392b", text: "Estoque baixo: Coca-Cola lata 350ml (restam 8 un.)" },
];

const PRODUCED = 130;
const CAPACITY = 180;

export function Producao() {
  const { showToast } = useAppData();

  const [orders, setOrders] = useState<ProdOrder[]>(INITIAL_ORDERS);
  const [filterTab, setFilterTab] = useState<FilterTab>("todos");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("hora");
  const [selectedId, setSelectedId] = useState<string | null>("CB-15234");
  const [bulkOpen, setBulkOpen] = useState(false);

  const startProduction = (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Em produção" } : o)));
    showToast(`Produção iniciada para o pedido #${id}.`);
  };

  const counts = {
    aguardando: orders.filter((o) => o.status === "Aguardando produção").length,
    producao: orders.filter((o) => o.status === "Em produção").length,
    pronto: orders.filter((o) => o.status === "Pronto para entrega").length,
    agendado: orders.filter((o) => o.status === "Agendado").length,
    todos: orders.length,
  };

  const filterDefs: { id: FilterTab; label: string; count: number }[] = [
    { id: "aguardando", label: "Aguardando produção", count: counts.aguardando },
    { id: "producao", label: "Em produção", count: counts.producao },
    { id: "pronto", label: "Prontos para entrega", count: counts.pronto },
    { id: "todos", label: "Todos", count: counts.todos },
  ];

  const STATUS_KEY: Record<Exclude<FilterTab, "todos">, ProdStatus> = {
    aguardando: "Aguardando produção",
    producao: "Em produção",
    pronto: "Pronto para entrega",
  };

  let filtered = orders;
  if (filterTab !== "todos") filtered = filtered.filter((o) => o.status === STATUS_KEY[filterTab]);
  const q = search.trim().toLowerCase();
  if (q) filtered = filtered.filter((o) => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.unidade.toLowerCase().includes(q));

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "pessoas") return b.people - a.people;
    if (sortBy === "unidade") return a.unidade.localeCompare(b.unidade);
    return a.time.localeCompare(b.time);
  });

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const loadPct = Math.round((PRODUCED / CAPACITY) * 100);

  const summaryCards = [
    { glyph: "🕓", iconBg: "#fdedd3", iconColor: "#8a5a0f", value: counts.aguardando, label: "Aguardando produção" },
    { glyph: "🔥", iconBg: "#dfeaff", iconColor: "#1e4fa3", value: counts.producao, label: "Em produção" },
    { glyph: "✓", iconBg: "#e6f5ec", iconColor: "#1a7a4f", value: counts.pronto, label: "Prontos para entrega" },
    { glyph: "📅", iconBg: "#f1eef9", iconColor: "#5a4a8a", value: counts.agendado, label: "Agendados" },
  ];

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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido, cliente ou unidade..." />
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
                <option value="hora">Hora de atendimento</option>
                <option value="pessoas">Nº de pessoas</option>
                <option value="unidade">Unidade</option>
              </select>
            </div>

            <div className="prod-order-list">
              {filtered.map((o) => {
                const st = STATUS_STYLE[o.status];
                const active = o.id === selectedId;
                return (
                  <div
                    key={o.id}
                    className={`prod-order-row ${active ? "is-active" : ""}`}
                    style={{ borderLeftColor: st.accent }}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <div className="prod-order-row__time">
                      <div className="prod-order-row__time-value">{o.time}</div>
                      <div className="prod-order-row__time-rel">{o.dateRel}</div>
                    </div>
                    <div className="prod-mono">{o.mono}</div>
                    <div className="prod-order-row__info">
                      <div className="prod-order-row__name">{o.name}</div>
                      <div className="prod-order-row__meta">
                        {o.people} pessoas &bull; {o.unidade}
                      </div>
                      <div className="prod-order-row__id">#{o.id}</div>
                    </div>
                    <div className="prod-order-row__status">
                      <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                        {o.status}
                      </span>
                      <div className="prod-order-row__eta">{o.eta}</div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="empty-state">Nenhum pedido nesse filtro.</div>}
            </div>
            <div className="prod-list-footer">
              Mostrando 1 a {filtered.length} de {orders.length} pedidos
            </div>
          </div>

          {/* MIDDLE: resumo */}
          <div className="prod-side-col">
            <div className="prod-panel prod-summary-card">
              <div className="prod-summary-card__title">Resumo da produção</div>
              <div className="prod-summary-card__subtitle">Hoje, 24/07/2026</div>
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
                <span className="prod-load-card__info">ⓘ</span>
              </div>
              <div className="prod-load-bar">
                <div className="prod-load-bar__fill" style={{ width: `${loadPct}%` }} />
              </div>
              <div className="prod-load-card__row">
                <span>Capacidade do dia: {CAPACITY} pessoas</span>
                <span className="prod-load-card__pct">{loadPct}%</span>
              </div>
              <div className="prod-load-card__produced">Produzido: {PRODUCED} pessoas</div>
            </div>

            <div className="prod-panel prod-alerts-card">
              <div className="prod-side-card__title">Alertas</div>
              <div className="prod-alerts-list">
                {ALERTS.map((al) => (
                  <div key={al.text} className="prod-alert-row" style={{ background: al.bg }}>
                    <span className="prod-alert-row__glyph">{al.glyph}</span>
                    <div className="prod-alert-row__text" style={{ color: al.color }}>
                      {al.text}
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={al.color} strokeWidth="2" className="prod-alert-row__chevron">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
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
                  <div className="prod-detail-identity__name">{selected.name}</div>
                  <span className="status-pill" style={{ background: STATUS_STYLE[selected.status].bg, color: STATUS_STYLE[selected.status].color }}>
                    {selected.status}
                  </span>
                </div>

                <div className="prod-detail-summary">
                  <div>
                    <div className="prod-detail-summary__label">Pedido</div>
                    <div className="prod-detail-summary__value">#{selected.id}</div>
                  </div>
                  <div className="prod-detail-summary__right">
                    <div className="prod-detail-summary__label">Solicitado por</div>
                    <div className="prod-detail-summary__value">{selected.solicitante}</div>
                  </div>
                </div>

                <div className="prod-detail-facts">
                  <div className="prod-detail-fact">
                    <span>📅</span>
                    <div>
                      <div className="prod-detail-fact__label">Data/Hora</div>
                      <div className="prod-detail-fact__value">{selected.dateTime}</div>
                    </div>
                  </div>
                  <div className="prod-detail-fact">
                    <span>👥</span>
                    <div>
                      <div className="prod-detail-fact__label">Pessoas</div>
                      <div className="prod-detail-fact__value">{selected.people} pessoas</div>
                    </div>
                  </div>
                  <div className="prod-detail-fact">
                    <span>📍</span>
                    <div>
                      <div className="prod-detail-fact__label">Local</div>
                      <div className="prod-detail-fact__value">{selected.local}</div>
                    </div>
                  </div>
                  {selected.obs && (
                    <div className="prod-detail-fact">
                      <span>📝</span>
                      <div>
                        <div className="prod-detail-fact__label">Observações</div>
                        <div className="prod-detail-fact__value">{selected.obs}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="prod-detail-items-title">
                  Itens do pedido <span className="prod-detail-items-title__count">({selected.items.length} itens)</span>
                </div>
                <div className="prod-detail-items">
                  {selected.items.map((it) => (
                    <div key={it.name} className="prod-detail-item">
                      <span>{it.name}</span>
                      <div className="prod-detail-item__right">
                        <span className="prod-detail-item__qty">{it.qty}</span>
                        {it.people && <span className="prod-detail-item__people">{it.people}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn btn--primary btn--full prod-start-btn" onClick={() => startProduction(selected.id)}>
                  ▶ Iniciar produção
                </button>
                <button className="btn btn--outline btn--full" onClick={() => showToast("Enviando ticket para impressão...")}>
                  🖨 Imprimir ticket
                </button>
              </>
            )}
            {!selected && <div className="prod-detail-empty">Selecione um pedido na lista.</div>}
          </div>
        </div>

        {/* Bottom bulk actions */}
        <div className="prod-bulk-bar">
          <div className="prod-bulk-toggle">
            <button className="btn btn--outline" onClick={() => setBulkOpen((v) => !v)}>
              ☰ Ações em lote ▾
            </button>
            {bulkOpen && (
              <div className="kebab-menu prod-bulk-menu">
                <button
                  onClick={() => {
                    setBulkOpen(false);
                    showToast("Todos os pedidos selecionados.");
                  }}
                >
                  Selecionar todos os pedidos
                </button>
              </div>
            )}
          </div>
          <button className="btn btn--outline prod-bulk-btn prod-bulk-btn--success" onClick={() => showToast("Produção iniciada para os pedidos selecionados.")}>
            ✓ Iniciar produção
          </button>
          <button className="btn btn--outline prod-bulk-btn prod-bulk-btn--info" onClick={() => showToast("Pedidos marcados como prontos.")}>
            📦 Marcar como pronto
          </button>
          <button className="btn btn--outline prod-bulk-btn prod-bulk-btn--warning" onClick={() => showToast("Reagendamento iniciado.")}>
            ↻ Reagendar pedidos
          </button>
          <button className="btn btn--outline prod-bulk-btn prod-bulk-btn--primary" onClick={() => showToast("Abrindo envio de mensagem em lote.")}>
            💬 Enviar mensagem
          </button>
          <button className="btn btn--outline prod-bulk-btn prod-bulk-btn--danger" onClick={() => showToast("Pedidos selecionados cancelados.")}>
            ✕ Cancelar pedidos
          </button>
        </div>
      </div>
    </Layout>
  );
}
