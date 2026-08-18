import { useNavigate } from "react-router-dom";
import { isOpenOrder, STATUS_STYLE } from "../mock/services";
import { PROMOS } from "../mock/promos";
import { money } from "../mock/money";
import type { Order } from "../types";
import "./HomeWidgets.css";

function statusStyleOf(status: Order["status"]) {
  return STATUS_STYLE[status] || { bg: "#eee", color: "#555" };
}

export function RecentOrdersCard({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="card hw-card">
      <div className="hw-card__header">
        <div className="hw-card__title">Pedidos recentes</div>
        <button className="link hw-link-btn" onClick={() => navigate("/pedidos")}>
          Ver todos
        </button>
      </div>
      {recent.length === 0 && <div className="empty-state">Nenhum pedido registrado ainda.</div>}
      {recent.length > 0 && (
        <div className="hw-recent-list">
          {recent.map((o) => {
            const st = statusStyleOf(o.status);
            return (
              <div key={o.id} className="hw-recent-row">
                <div className="hw-recent-row__left">
                  <div className="avatar-circle avatar-circle--sm">{o.mono}</div>
                  <div>
                    <div className="hw-recent-row__name">{o.type}</div>
                    <div className="hw-recent-row__date">{o.datetime}</div>
                  </div>
                </div>
                <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                  {o.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OpenOrdersCard({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();
  const open = orders.filter(isOpenOrder);

  return (
    <div className="card hw-card">
      <div className="hw-card__header">
        <div className="hw-card__title-row">
          <div className="hw-card__title">Pedidos em aberto</div>
          <span className="pill-count">{open.length}</span>
        </div>
        <button className="link hw-link-btn" onClick={() => navigate("/pedidos")}>
          Ver todos os pedidos &rsaquo;
        </button>
      </div>
      {open.length === 0 && <div className="empty-state">Nenhum pedido em aberto no momento.</div>}
      {open.length > 0 && (
        <div className="hw-open-table">
          <div className="hw-open-table__head">
            <div>Pedido</div>
            <div>Data/Hora</div>
            <div>Status</div>
            <div>Valor</div>
          </div>
          {open.slice(0, 6).map((o) => {
            const st = statusStyleOf(o.status);
            return (
              <div key={o.id} className="hw-open-table__row">
                <div>
                  <div className="hw-open-table__id">{o.id}</div>
                  <div className="hw-open-table__muted">{o.type}</div>
                </div>
                <div className="hw-open-table__muted">{o.datetime}</div>
                <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                  {o.status}
                </span>
                <div className="hw-open-table__value">{o.valueNumber != null ? money(o.valueNumber) : o.value}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PromosSection() {
  const navigate = useNavigate();
  return (
    <div className="hw-promos">
      <div className="hw-card__header">
        <div className="hw-card__title-row">
          <div className="hw-card__title">Novidades e Promoções</div>
          <span className="pill-tag">Novidades da semana</span>
        </div>
      </div>
      <div className="hw-promos__grid">
        {PROMOS.map((p) => (
          <div key={p.id} className="hw-promo-card" style={{ background: p.bg }}>
            <div className="hw-promo-card__tags">
              <span className="hw-promo-card__tag" style={{ color: p.color }}>
                {p.tag}
              </span>
              {p.discount && (
                <span className="hw-promo-card__discount" style={{ background: p.color }}>
                  {p.discount}
                </span>
              )}
            </div>
            <div className="hw-promo-card__title">{p.title}</div>
            <div className="hw-promo-card__desc">{p.desc}</div>
            <button className="hw-promo-card__cta" style={{ background: p.color }} onClick={() => p.route && navigate(p.route)}>
              {p.ctaLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
