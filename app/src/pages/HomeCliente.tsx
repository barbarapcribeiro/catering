import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { PathIcon } from "../components/Icon";
import { useAppData } from "../mock/AppDataContext";
import { isOpenOrder, SERVICES, STATUS_STYLE } from "../mock/services";
import { PROMOS } from "../mock/promos";
import type { Order } from "../types";
import "./Home.css";

function formatDateTimePt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("pt-BR")} • ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

const PROMO_ICON: Record<string, string> = { combo: "☕", coffee: "☕", lanche: "🥪" };

type Modal_ = { type: "service"; service: (typeof SERVICES)[number] } | { type: "order"; order: Order } | null;

export function HomeCliente() {
  const { orders, addOrder, cancelOrder, duplicateOrder, favorites, toggleFavorite, showToast } = useAppData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "favorites">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [kebabOpenId, setKebabOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal_>(null);
  const [form, setForm] = useState({ people: "", date: "", time: "", notes: "" });

  const q = searchQuery.trim().toLowerCase();
  let filtered = SERVICES.filter((sv) => sv.name.toLowerCase().includes(q));
  if (activeFilter === "favorites") filtered = filtered.filter((sv) => favorites.has(sv.id));

  const openOrders = useMemo(() => orders.filter(isOpenOrder), [orders]);
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [orders],
  );

  const openService = (svc: (typeof SERVICES)[number]) => {
    if (svc.route) {
      navigate(svc.route);
    } else {
      setForm({ people: "", date: "", time: "", notes: "" });
      setModal({ type: "service", service: svc });
    }
  };

  const repeatOrder = (order: Order) => {
    duplicateOrder(order.id);
  };

  const submitOrder = () => {
    if (modal?.type !== "service") return;
    const svc = modal.service;
    addOrder({
      category: svc.name,
      type: svc.name,
      mono: svc.mono,
      qty: `${form.people || "1"} pessoas`,
      datetime: `${form.date || "A definir"} ${form.time || ""}`.trim(),
    });
    setModal(null);
    showToast("Pedido solicitado com sucesso!");
  };

  return (
    <Layout chat>
      <div className="page-container">
        <div className="home-title-row">
          <div>
            <h1 className="home-title">O que você deseja solicitar hoje?</h1>
            <div className="home-subtitle">Escolha uma opção para iniciar seu pedido.</div>
          </div>
          <div className="home-search-row">
            <div className="home-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar serviço ou pedido" />
            </div>
            <button className={`home-filter-btn ${filterOpen ? "is-active" : ""}`} onClick={() => setFilterOpen((v) => !v)} aria-label="Filtros">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="home-chips">
            <button className={`chip ${activeFilter === "all" ? "is-active" : ""}`} onClick={() => setActiveFilter("all")}>
              Todos os serviços
            </button>
            <button className={`chip ${activeFilter === "favorites" ? "is-active" : ""}`} onClick={() => setActiveFilter("favorites")}>
              ★ Favoritos
            </button>
          </div>
        )}

        <div className="home-grid-2x2">
          <div className="home-hero">
            <div className="home-hero__blob home-hero__blob--1" />
            <div className="home-hero__blob home-hero__blob--2" />
            <span className="home-hero__badge">Mais solicitado</span>
            <div className="home-hero__content">
              <div className="home-hero__icon">
                <PathIcon path="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v4M10 2v4M14 2v4" color="#fff" size={26} strokeWidth={2} />
              </div>
              <div>
                <div className="home-hero__title">Coffee Break</div>
                <div className="home-hero__desc">Solicite coffee break para reuniões, treinamentos e eventos.</div>
              </div>
            </div>
            <button className="btn btn--primary" onClick={() => navigate("/pedido/coffee-break")}>
              Novo pedido
            </button>
          </div>

          <div className="card home-recent">
            <div className="home-recent__header">
              <div className="home-recent__title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                Pedidos recentes
              </div>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/pedidos"); }} className="link">
                Ver todos
              </a>
            </div>
            {recentOrders.length === 0 && <div className="empty-state">Nenhum pedido realizado ainda.</div>}
            {recentOrders.map((r) => (
              <div key={r.id} className="home-recent__row">
                <div className="home-recent__left">
                  <div className="avatar-circle">{r.mono}</div>
                  <div>
                    <div className="home-recent__name">{r.type}</div>
                    <div className="home-recent__date">{formatDateTimePt(r.createdAt)}</div>
                  </div>
                </div>
                <div className="home-recent__buttons">
                  {r.mono === "CB" && (
                    <button className="btn btn--primary btn--sm" onClick={() => navigate("/pedido/coffee-break")}>
                      ☕ Pedir agora
                    </button>
                  )}
                  <button className="btn btn--outline btn--sm" onClick={() => repeatOrder(r)}>
                    Repetir pedido
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card home-promos-compact">
            <div className="home-compact-card__header">
              <span className="home-compact-card__title">Novidades e Promoções</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="link">
                Ver todas
              </a>
            </div>
            <div className="home-promos-compact__list">
              {PROMOS.map((p) => (
                <div key={p.id} className="home-promo-row" onClick={() => p.route && navigate(p.route)}>
                  <div className="home-promo-row__thumb" style={{ background: p.bg }}>
                    {PROMO_ICON[p.id] ?? "🎉"}
                  </div>
                  <div className="home-promo-row__body">
                    <div className="home-promo-row__tag" style={{ color: p.color }}>
                      {p.tag}
                      {p.discount ? ` · ${p.discount}` : ""}
                    </div>
                    <div className="home-promo-row__title">{p.title}</div>
                    <div className="home-promo-row__desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card home-open-compact">
            <div className="home-compact-card__header">
              <div className="home-compact-card__title-row">
                <span className="home-compact-card__title">Pedidos em aberto</span>
                <span className="pill-count">{openOrders.length}</span>
              </div>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/pedidos"); }} className="link">
                Ver todos &rsaquo;
              </a>
            </div>
            <div className="home-compact-card__subtitle">Acompanhe e gerencie seus pedidos em andamento.</div>

            {openOrders.length === 0 && <div className="empty-state">Nenhum pedido em aberto no momento.</div>}

            {openOrders.length > 0 && (
              <div className="home-open-compact__list">
                {openOrders.map((o) => {
                  const st = STATUS_STYLE[o.status] || { bg: "#eee", color: "#555" };
                  return (
                    <div key={o.id} className="home-open-row">
                      <div className="home-open-row__left">
                        <div className="avatar-circle avatar-circle--sm">{o.mono}</div>
                        <div>
                          <div className="home-open-row__id">{o.id} &bull; {o.type}</div>
                          <div className="home-open-row__sub">{o.qty} &bull; {o.datetime}</div>
                        </div>
                      </div>
                      <div className="home-open-row__right">
                        <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                          {o.status}
                        </span>
                        <span className="home-open-row__value">{o.value}</span>
                        <button className="btn btn--outline btn--sm" onClick={() => setModal({ type: "order", order: o })}>
                          Ver
                        </button>
                        <button className="kebab-btn" onClick={() => setKebabOpenId(kebabOpenId === o.id ? null : o.id)} aria-label="Mais ações">
                          &#8942;
                        </button>
                        {kebabOpenId === o.id && (
                          <div className="kebab-menu">
                            <button
                              onClick={() => {
                                duplicateOrder(o.id);
                                setKebabOpenId(null);
                              }}
                            >
                              Duplicar pedido
                            </button>
                            <button
                              className="kebab-menu__danger"
                              onClick={() => {
                                cancelOrder(o.id);
                                setKebabOpenId(null);
                              }}
                            >
                              Cancelar pedido
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {favorites.size > 0 && (
          <div className="home-favorites">
            <div className="home-favorites__header">
              <span className="star-icon">★</span>
              <div className="home-favorites__title">Favoritos</div>
              <div className="home-favorites__hint">&bull; serviços mais solicitados por você</div>
            </div>
            <div className="favorites-grid">
              {SERVICES.filter((sv) => favorites.has(sv.id)).map((sv) => (
                <div key={sv.id} className="service-card service-card--fav" onClick={() => openService(sv)}>
                  <div className="service-card__icon service-card__icon--primary">
                    <PathIcon path={sv.iconPath} color="#fff" />
                  </div>
                  <div className="service-card__body">
                    <div className="service-card__name">{sv.name}</div>
                    <div className="service-card__desc">{sv.desc}</div>
                  </div>
                  <button
                    className="fav-btn fav-btn--active"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(sv.id);
                    }}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="home-all-services">
          <div className="home-all-services__header">
            <div>
              <div className="home-all-services__title">Todos os serviços</div>
              <div className="home-all-services__subtitle">Explore todas as opções disponíveis.</div>
            </div>
            <div className="view-toggle">
              <button className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")} aria-label="Ver em grade">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={viewMode === "grid" ? "#fff" : "#46526a"} strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button className={viewMode === "list" ? "is-active" : ""} onClick={() => setViewMode("list")} aria-label="Ver em lista">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={viewMode === "list" ? "#fff" : "#46526a"} strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {filtered.length === 0 && <div className="empty-state">Nenhum serviço encontrado para "{searchQuery}".</div>}

          {filtered.length > 0 && viewMode === "grid" && (
            <div className="services-grid">
              {filtered.map((sv) => (
                <div key={sv.id} className="service-card" onClick={() => openService(sv)}>
                  <div className="service-card__icon">
                    <PathIcon path={sv.iconPath} color="var(--color-primary)" />
                  </div>
                  <div className="service-card__body">
                    <div className="service-card__name">{sv.name}</div>
                    <div className="service-card__desc">{sv.desc}</div>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c3bfb6" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                  <button
                    className={`fav-btn ${favorites.has(sv.id) ? "fav-btn--active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(sv.id);
                    }}
                  >
                    {favorites.has(sv.id) ? "★" : "☆"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {filtered.length > 0 && viewMode === "list" && (
            <div className="services-list">
              {filtered.map((sv) => (
                <div key={sv.id} className="service-row" onClick={() => openService(sv)}>
                  <div className="service-card__icon">
                    <PathIcon path={sv.iconPath} color="var(--color-primary)" size={18} />
                  </div>
                  <div className="service-card__body">
                    <div className="service-card__name">{sv.name}</div>
                    <div className="service-card__desc">{sv.desc}</div>
                  </div>
                  <button
                    className={`fav-btn ${favorites.has(sv.id) ? "fav-btn--active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(sv.id);
                    }}
                  >
                    {favorites.has(sv.id) ? "★" : "☆"}
                  </button>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c3bfb6" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-tip">
          <span>&#128161;</span>
          <div>
            <strong>Dica:</strong> Use os pedidos recentes ou em aberto para repetir solicitações com mais rapidez.
          </div>
        </div>
      </div>

      {modal?.type === "service" && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-service-header">
            <div className="avatar-circle">{modal.service.mono}</div>
            <div>
              <div className="modal-title">Solicitar {modal.service.name}</div>
              <div className="modal-subtitle">Preencha os dados do pedido</div>
            </div>
          </div>
          <div className="modal-form">
            <label className="field-label">
              Quantidade de pessoas
              <input type="number" min={1} value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} />
            </label>
            <div className="field-row">
              <label className="field-label">
                Data
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <label className="field-label">
                Horário
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </label>
            </div>
            <label className="field-label">
              Observações
              <textarea rows={3} placeholder="Opcional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="btn btn--primary" onClick={submitOrder}>
              Confirmar pedido
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === "order" && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-order-header">
            <div>
              <div className="modal-title">{modal.order.id}</div>
              <div className="modal-subtitle">{modal.order.category}</div>
            </div>
            <span className="status-pill" style={{ background: STATUS_STYLE[modal.order.status]?.bg, color: STATUS_STYLE[modal.order.status]?.color }}>
              {modal.order.status}
            </span>
          </div>
          <div className="modal-order-rows">
            <div className="modal-order-row">
              <span>Tipo</span>
              <span className="fw-600">{modal.order.type}</span>
            </div>
            <div className="modal-order-row">
              <span>Quantidade</span>
              <span className="fw-600">{modal.order.qty}</span>
            </div>
            <div className="modal-order-row">
              <span>Data/Hora</span>
              <span className="fw-600">{modal.order.datetime}</span>
            </div>
            <div className="modal-order-row modal-order-row--last">
              <span>Valor</span>
              <span className="fw-700">{modal.order.value}</span>
            </div>
          </div>
          <button className="btn btn--primary btn--full" onClick={() => setModal(null)}>
            Fechar
          </button>
        </Modal>
      )}
    </Layout>
  );
}
