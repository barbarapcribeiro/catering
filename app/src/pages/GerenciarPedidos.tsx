import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAppData } from "../mock/AppDataContext";
import { STATUS_STYLE } from "../mock/services";
import { money } from "../mock/money";
import type { Order } from "../types";
import "./GerenciarPedidos.css";

type ListTab = "andamento" | "finalizado" | "cancelado";
type DetailTab = "resumo" | "itens" | "informacoes" | "anexos" | "historico";

const STAGES = ["Pedido recebido", "Aguardando aprovação", "Aguardando aprovação do restaurante", "Em preparação", "Entrega"];

// Attachments aren't part of the shared Order type (display-only, mock-only data).
// Keyed by order id — orders without a match simply show the empty state.
const ATTACHMENTS: Record<string, { name: string; meta: string }[]> = {
  "#CB-15234": [
    { name: "Ata da reunião.pdf", meta: "240 KB • enviado por você" },
    { name: "Layout da sala.jpg", meta: "1.1 MB • enviado por você" },
  ],
  "#LAN-15210": [{ name: "Pauta comercial.pdf", meta: "96 KB • enviado por você" }],
};

function tabOf(o: Order): ListTab {
  if (o.status === "Cancelado") return "cancelado";
  if (o.status === "Entregue" || o.status === "Finalizado") return "finalizado";
  return "andamento";
}

function splitDateTime(dt: string): [string, string] {
  const idx = dt.indexOf(" ");
  if (idx === -1) return [dt, "—"];
  const time = dt.slice(idx + 1).trim();
  return [dt.slice(0, idx), time || "—"];
}

function stageIndex(status: Order["status"]): number {
  switch (status) {
    case "Aguardando aprovação":
      return 1;
    case "Em preparação":
      return 3;
    case "Pronto para entrega":
      return 3;
    case "Entregue":
    case "Finalizado":
      return 4;
    default:
      return 0;
  }
}

interface DisplayItem {
  key: string;
  name: string;
  sub: string;
  qty: number;
  unit: number;
  total: number;
}

// Real order flows store a granular items[] (qty/price pre-tax); orders that predate
// that (seeded demo orders, "repeat order" shortcuts) only carry a final value, so we
// synthesize a single line item from them, backing the pre-tax price out of the total.
function getDisplayItems(o: Order): DisplayItem[] {
  if (o.items && o.items.length > 0) {
    return o.items.map((it, i) => ({
      key: `${it.name}-${i}`,
      name: it.name,
      sub: `${it.qty} unidades`,
      qty: it.qty,
      unit: it.price,
      total: it.qty * it.price,
    }));
  }
  const total = o.valueNumber ?? 0;
  const unit = total / 1.1;
  return [{ key: "single", name: o.type, sub: o.qty, qty: 1, unit, total: unit }];
}

export function GerenciarPedidos() {
  const { orders, cancelOrder, duplicateOrder, showToast, chatMessages, sendChatMessage } = useAppData();
  const navigate = useNavigate();

  const [listTab, setListTab] = useState<ListTab>("andamento");
  const [listSearch, setListSearch] = useState("");
  const [topSearch, setTopSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id ?? null);
  const [detailTab, setDetailTab] = useState<DetailTab>("resumo");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [convInput, setConvInput] = useState("");

  const selectOrder = (id: string) => {
    setSelectedId(id);
    setDetailTab("resumo");
    setQuickActionsOpen(false);
  };

  const counts: Record<ListTab, number> = {
    andamento: orders.filter((o) => tabOf(o) === "andamento").length,
    finalizado: orders.filter((o) => tabOf(o) === "finalizado").length,
    cancelado: orders.filter((o) => tabOf(o) === "cancelado").length,
  };

  const q = listSearch.trim().toLowerCase();
  let visibleOrders = orders.filter((o) => tabOf(o) === listTab);
  if (q) visibleOrders = visibleOrders.filter((o) => o.type.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const editOrder = () => {
    setQuickActionsOpen(false);
    showToast("Abrindo edição do pedido...");
  };
  const duplicate = () => {
    if (!selected) return;
    duplicateOrder(selected.id);
    setQuickActionsOpen(false);
  };
  const cancel = () => {
    if (!selected) return;
    cancelOrder(selected.id);
    setQuickActionsOpen(false);
  };
  const converse = () => {
    setDetailTab("resumo");
    showToast("Use o painel de Conversas à direita.");
  };

  const sendConv = () => {
    const text = convInput.trim();
    if (!text) return;
    sendChatMessage(text);
    setConvInput("");
  };

  const listTabDefs: { id: ListTab; label: string }[] = [
    { id: "andamento", label: `Em andamento (${counts.andamento})` },
    { id: "finalizado", label: `Finalizados (${counts.finalizado})` },
    { id: "cancelado", label: `Cancelados (${counts.cancelado})` },
  ];

  // ---- derived values for the selected order ----
  let items: DisplayItem[] = [];
  let subtotal = 0;
  let fee = 0;
  let total = 0;
  let selDate = "—";
  let selTime = "—";
  let timeline: { label: string; sub: string; isYou: boolean; done: boolean; current: boolean }[] = [];

  if (selected) {
    items = getDisplayItems(selected);
    subtotal = items.reduce((sum, it) => sum + it.total, 0);
    fee = subtotal * 0.1;
    total = subtotal + fee;
    [selDate, selTime] = splitDateTime(selected.datetime);

    const cancelled = selected.status === "Cancelado";
    const stage = stageIndex(selected.status);
    timeline = STAGES.map((label, i) => {
      const done = cancelled || i < stage || (selected.status === "Entregue" && i <= stage) || (selected.status === "Finalizado" && i <= stage);
      const current = !cancelled && i === stage && selected.status !== "Entregue" && selected.status !== "Finalizado";
      return {
        label,
        isYou: i === 1 && (done || current),
        done,
        current,
        sub: cancelled ? "Cancelado" : done ? "Concluído" : current ? "Em andamento" : `Previsão: ${selDate} às ${selTime}`,
      };
    });
  }

  const detailTabDefs: { id: DetailTab; label: string }[] = selected
    ? [
        { id: "resumo", label: "Resumo do pedido" },
        { id: "itens", label: `Itens (${items.length})` },
        { id: "informacoes", label: "Informações" },
        { id: "anexos", label: `Anexos (${(ATTACHMENTS[selected.id] ?? []).length})` },
        { id: "historico", label: "Histórico" },
      ]
    : [];

  return (
    <Layout>
      <div className="page-container gp-page">
        <div className="gp-title-row">
          <div>
            <h1 className="gp-title">Gerenciar pedidos</h1>
            <div className="gp-subtitle">Acompanhe, edite e gerencie todos os seus pedidos.</div>
          </div>
          <div className="gp-top-actions">
            <div className="gp-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <input value={topSearch} onChange={(e) => setTopSearch(e.target.value)} placeholder="Buscar pedido, descrição ou número" />
            </div>
            <button className="btn btn--outline gp-filter-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              Filtros
            </button>
            <button className="btn btn--primary gp-new-btn" onClick={() => navigate("/pedido/coffee-break")}>
              + Novo pedido
            </button>
          </div>
        </div>

        <div className="gp-grid">
          {/* LEFT: order list */}
          <div className="gp-panel gp-list-panel">
            <div className="gp-tabs">
              {listTabDefs.map((lt) => (
                <button key={lt.id} className={listTab === lt.id ? "is-active" : ""} onClick={() => setListTab(lt.id)}>
                  {lt.label}
                </button>
              ))}
            </div>

            <div className="gp-list-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <input value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="Buscar nos pedidos..." />
            </div>

            <div className="gp-order-list">
              {visibleOrders.map((o) => {
                const st = STATUS_STYLE[o.status] ?? { bg: "#eee", color: "#555" };
                const [dRel, tm] = splitDateTime(o.datetime);
                return (
                  <div key={o.id} className={`gp-order-card ${o.id === selectedId ? "is-active" : ""}`} onClick={() => selectOrder(o.id)}>
                    <div className="gp-order-card__top">
                      <div className="gp-mono">{o.mono}</div>
                      <div className="gp-order-card__info">
                        <div className="gp-order-card__name">{o.type}</div>
                        <div className="gp-order-card__meta">
                          {dRel} &bull; {tm} &bull; {o.peopleCount ?? o.qty} pessoas
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c3bfb6" strokeWidth="2" className="gp-order-card__chevron">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </div>
                    <div className="gp-order-card__bottom">
                      <div className="gp-order-card__id">{o.id}</div>
                      <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {visibleOrders.length === 0 && <div className="empty-state">Nenhum pedido nessa categoria.</div>}
            </div>

            <div className="gp-list-footer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <div>
                Não encontrou o que procura?
                <br />
                <a href="#" onClick={(e) => e.preventDefault()} className="link">
                  Ver todos os pedidos com outros filtros
                </a>
              </div>
            </div>
          </div>

          {/* MIDDLE: detail */}
          <div className="gp-panel gp-detail-panel">
            {selected && (
              <>
                <div className="gp-detail-header">
                  <div className="gp-detail-header__left">
                    <div className="gp-mono gp-mono--lg">{selected.mono}</div>
                    <div className="gp-detail-header__info">
                      <div className="gp-detail-header__title-row">
                        <span className="gp-detail-header__name">{selected.type}</span>
                        <span className="status-pill" style={{ background: STATUS_STYLE[selected.status]?.bg, color: STATUS_STYLE[selected.status]?.color }}>
                          {selected.status}
                        </span>
                      </div>
                      <div className="gp-detail-header__id">Pedido {selected.id}</div>
                    </div>
                  </div>
                  <div className="gp-quick-actions">
                    <button className="btn btn--outline gp-quick-actions__btn" onClick={() => setQuickActionsOpen((v) => !v)}>
                      Ações rápidas
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {quickActionsOpen && (
                      <div className="kebab-menu gp-quick-actions__menu">
                        <button onClick={editOrder}>Editar pedido</button>
                        <button onClick={duplicate}>Duplicar pedido</button>
                        <button className="kebab-menu__danger" onClick={cancel}>
                          Cancelar pedido
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="gp-stats">
                  <div>
                    <div className="gp-stats__label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M3 10h18M8 2v4M16 2v4" />
                      </svg>
                      Data/Hora
                    </div>
                    <div className="gp-stats__value">
                      {selDate}
                      <br />
                      {selTime}
                    </div>
                  </div>
                  <div>
                    <div className="gp-stats__label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Local
                    </div>
                    <div className="gp-stats__value">{selected.location ?? "—"}</div>
                  </div>
                  <div>
                    <div className="gp-stats__label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      Pessoas
                    </div>
                    <div className="gp-stats__value">{selected.peopleCount ? `${selected.peopleCount} pessoas` : selected.qty}</div>
                  </div>
                  <div>
                    <div className="gp-stats__label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v10M9 9.5c0-1 1-2 3-2s3 1 3 2-1 1.5-3 2-3 1-3 2 1 2 3 2 3-1 3-2" />
                      </svg>
                      Valor total
                    </div>
                    <div className="gp-stats__value gp-stats__value--primary">{money(total)}</div>
                  </div>
                </div>

                <div className="gp-detail-tabs">
                  {detailTabDefs.map((dt) => (
                    <button key={dt.id} className={detailTab === dt.id ? "is-active" : ""} onClick={() => setDetailTab(dt.id)}>
                      {dt.label}
                    </button>
                  ))}
                </div>

                {detailTab === "resumo" && (
                  <>
                    <div className="gp-resumo-items">
                      {items.map((it) => (
                        <div key={it.key} className="gp-resumo-item">
                          <div>
                            <div className="gp-resumo-item__name">{it.name}</div>
                            <div className="gp-resumo-item__sub">{it.sub}</div>
                          </div>
                          <div>
                            <div className="gp-resumo-item__col-label">Qtd.</div>
                            <div className="gp-resumo-item__col-value">{it.qty}</div>
                          </div>
                          <div>
                            <div className="gp-resumo-item__col-label">Valor unit.</div>
                            <div className="gp-resumo-item__col-value">{money(it.unit)}</div>
                          </div>
                          <div>
                            <div className="gp-resumo-item__col-label">Subtotal</div>
                            <div className="gp-resumo-item__col-value gp-resumo-item__col-value--bold">{money(it.total)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="gp-resumo-footer">
                      <button className="btn btn--outline" onClick={editOrder}>
                        ✎ Editar itens
                      </button>
                      <div className="gp-resumo-totals">
                        <div className="gp-resumo-totals__col">
                          <div className="gp-resumo-totals__label">Subtotal</div>
                          <div className="gp-resumo-totals__value">{money(subtotal)}</div>
                        </div>
                        <div className="gp-resumo-totals__col">
                          <div className="gp-resumo-totals__label">Taxa (10%)</div>
                          <div className="gp-resumo-totals__value">{money(fee)}</div>
                        </div>
                        <div className="gp-resumo-totals__col">
                          <div className="gp-resumo-totals__label">Total</div>
                          <div className="gp-resumo-totals__value gp-resumo-totals__value--total">{money(total)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="gp-resumo-note">
                      Pedido criado em {selected.createdAt ? new Date(selected.createdAt).toLocaleString("pt-BR") : "—"} por você.
                    </div>
                  </>
                )}

                {detailTab === "itens" && (
                  <div className="gp-itens-list">
                    {items.map((it) => (
                      <div key={it.key} className="gp-itens-row">
                        <div>
                          <div className="gp-itens-row__name">{it.name}</div>
                          <div className="gp-itens-row__sub">
                            {it.sub} &bull; {money(it.unit)}/un.
                          </div>
                        </div>
                        <div className="gp-itens-row__total">{money(it.total)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === "informacoes" && (
                  <div className="gp-info-grid">
                    <div>
                      <div className="gp-info-grid__label">Data e horário</div>
                      <div className="gp-info-grid__value">
                        {selDate} &bull; {selTime}
                      </div>
                    </div>
                    <div>
                      <div className="gp-info-grid__label">Local de entrega</div>
                      <div className="gp-info-grid__value">{selected.location ?? "—"}</div>
                    </div>
                    <div>
                      <div className="gp-info-grid__label">Nº de pessoas</div>
                      <div className="gp-info-grid__value">{selected.peopleCount ?? selected.qty}</div>
                    </div>
                    <div>
                      <div className="gp-info-grid__label">Centro de custo</div>
                      <div className="gp-info-grid__value">
                        {selected.costCenters && selected.costCenters.length > 0
                          ? selected.costCenters.map((cc) => `${cc.code} (${cc.percent}%)`).join(", ")
                          : "—"}
                      </div>
                    </div>
                    <div className="gp-info-grid__full">
                      <div className="gp-info-grid__label">Observações</div>
                      <div className="gp-info-grid__value">{selected.notes ?? "Sem observações adicionais."}</div>
                    </div>
                  </div>
                )}

                {detailTab === "anexos" && (
                  <div className="gp-anexos-list">
                    {(ATTACHMENTS[selected.id] ?? []).map((att) => (
                      <div key={att.name} className="gp-anexo-row">
                        <div className="gp-anexo-row__icon">📄</div>
                        <div className="gp-anexo-row__info">
                          <div className="gp-anexo-row__name">{att.name}</div>
                          <div className="gp-anexo-row__meta">{att.meta}</div>
                        </div>
                        <button className="gp-anexo-row__download">Baixar</button>
                      </div>
                    ))}
                    {(ATTACHMENTS[selected.id] ?? []).length === 0 && <div className="empty-state">Nenhum anexo neste pedido.</div>}
                  </div>
                )}

                {detailTab === "historico" && (
                  <div className="gp-historico">
                    {(selected.history ?? []).map((h, i) => (
                      <div key={i} className="gp-historico-row">
                        <div className="gp-historico-row__dot" />
                        <div>
                          <div className="gp-historico-row__text">{h.label}</div>
                          <div className="gp-historico-row__time">{h.time}</div>
                        </div>
                      </div>
                    ))}
                    {(!selected.history || selected.history.length === 0) && <div className="empty-state">Sem histórico registrado.</div>}
                  </div>
                )}
              </>
            )}

            {!selected && <div className="gp-detail-empty">Selecione um pedido na lista ao lado.</div>}
          </div>

          {/* RIGHT: status + conversas */}
          <div className="gp-side-col">
            {selected && (
              <>
                <div className="gp-panel gp-side-card">
                  <div className="gp-side-card__header">
                    <div className="gp-side-card__title">Status do pedido</div>
                    <a href="#" onClick={(e) => e.preventDefault()} className="link">
                      Ver detalhes
                    </a>
                  </div>
                  <div className="gp-timeline">
                    {timeline.map((ts, i) => {
                      const cancelled = selected.status === "Cancelado";
                      const dotClass = cancelled ? "is-cancelled" : ts.done ? "is-done" : ts.current ? "is-current" : "";
                      return (
                        <div key={ts.label} className="gp-timeline-row">
                          <div className="gp-timeline-row__rail">
                            <div className={`gp-timeline-row__dot ${dotClass}`}>{cancelled ? "✕" : ts.done ? "✓" : i + 1}</div>
                            {i < timeline.length - 1 && <div className={`gp-timeline-row__line ${ts.done ? "is-done" : ""}`} />}
                          </div>
                          <div className="gp-timeline-row__body">
                            <div className="gp-timeline-row__label-row">
                              <span className={`gp-timeline-row__label ${ts.done || ts.current ? "is-active" : ""}`}>{ts.label}</span>
                              {ts.isYou && <span className="gp-timeline-row__you">Você</span>}
                            </div>
                            <div className="gp-timeline-row__sub">{ts.sub}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="gp-panel gp-side-card gp-conversas">
                  <div className="gp-side-card__header">
                    <div className="gp-side-card__title">Conversas</div>
                  </div>
                  <div className="gp-conversas__messages">
                    {chatMessages.map((m) => (
                      <div key={m.id} className="gp-conv-message">
                        <div className={`gp-conv-message__avatar ${m.from === "me" ? "is-me" : ""}`}>{m.from === "me" ? "B" : "S"}</div>
                        <div>
                          <div className="gp-conv-message__author">{m.from === "me" ? "Você" : "Sodexo"}</div>
                          <div className="gp-conv-message__text">{m.text}</div>
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && <div className="empty-state">Nenhuma mensagem ainda.</div>}
                  </div>
                  <div className="gp-conversas__input-row">
                    <input
                      value={convInput}
                      onChange={(e) => setConvInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendConv();
                      }}
                      placeholder="Digite sua mensagem..."
                    />
                    <button onClick={sendConv} aria-label="Enviar mensagem">
                      &#10148;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {selected && (
          <div className="gp-action-bar">
            <button className="btn btn--outline" onClick={() => setDetailTab("informacoes")}>
              👁 Ver detalhes
            </button>
            <button className="btn btn--outline gp-action-bar__primary-outline" onClick={editOrder}>
              ✎ Editar pedido
            </button>
            <button className="btn btn--outline" onClick={converse}>
              💬 Conversar
            </button>
            <button className="btn btn--outline" onClick={duplicate}>
              ⧉ Duplicar pedido
            </button>
            <button className="btn btn--outline gp-action-bar__danger-outline" onClick={cancel}>
              ✕ Cancelar pedido
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
