import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { useAppData } from "../mock/AppDataContext";
import { PROMOS } from "../mock/promos";
import "./FiquePorDentro.css";

interface ActivityEntry {
  id: string;
  day: string;
  text: string;
  time: string;
}

const ICON = { glyph: "\u{1F4E6}", bg: "var(--color-primary-soft)", color: "var(--color-primary)" };

// order.history[].time is a formatted pt-BR string ("dd/mm/yyyy HH:mm" or
// the comma/seconds variant from toLocaleString), never ISO — parse just the
// date part so entries can be grouped by day.
function parseHistoryDate(time: string): Date | null {
  const datePart = time.split(/[, ]/)[0];
  const [d, m, y] = datePart.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function dayLabel(d: Date) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FiquePorDentro() {
  const navigate = useNavigate();
  const { orders } = useAppData();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleDetail = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const goTo = (route?: string) => {
    if (route) navigate(route);
  };

  const days = useMemo(() => {
    const entries: (ActivityEntry & { sortKey: string })[] = [];
    orders.forEach((o) => {
      (o.history ?? []).forEach((h, i) => {
        const d = parseHistoryDate(h.time);
        entries.push({
          id: `${o.id}-${i}`,
          day: d ? dayLabel(d) : "Data não informada",
          text: `${h.label} — ${o.type}`,
          time: h.time.split(/[, ]/).slice(1).join(" ") || h.time,
          sortKey: `${o.createdAt}-${i}`,
        });
      });
    });
    entries.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    const groups: { dayLabel: string; items: ActivityEntry[] }[] = [];
    entries.slice(0, 20).forEach((a) => {
      let group = groups.find((g) => g.dayLabel === a.day);
      if (!group) {
        group = { dayLabel: a.day, items: [] };
        groups.push(group);
      }
      group.items.push(a);
    });
    return groups;
  }, [orders]);

  return (
    <Layout>
      <div className="page-container">
        <div className="fpd-title-block">
          <h1 className="fpd-title">Fique por dentro</h1>
          <div className="fpd-subtitle">Novidades, promoções e um resumo da sua semana por aqui.</div>
        </div>

        <div className="fpd-section">
          <div className="fpd-section-header">
            <span className="fpd-section-title">Novidades e Promoções</span>
            <span className="pill-tag">Novidades da semana</span>
          </div>

          <div className="fpd-promo-list">
            {PROMOS.map((p) => (
              <div key={p.id} className="fpd-promo-card" style={{ background: p.bg }}>
                <div className="fpd-promo-card__main">
                  <div className="fpd-promo-card__tags">
                    <span className="fpd-promo-card__tag" style={{ color: p.color }}>
                      {p.tag}
                    </span>
                    {p.discount && (
                      <span className="fpd-promo-card__discount" style={{ background: p.color }}>
                        {p.discount}
                      </span>
                    )}
                  </div>
                  <div className="fpd-promo-card__title">{p.title}</div>
                  <div className="fpd-promo-card__desc">{p.fullDesc ?? p.desc}</div>
                  <div className="fpd-promo-card__valid">Válido até {p.validity}</div>
                  <div className="fpd-promo-card__actions">
                    <button className="fpd-promo-card__cta" style={{ background: p.color }} onClick={() => goTo(p.route)}>
                      {p.ctaLabel}
                    </button>
                    <button className="fpd-promo-card__toggle" onClick={() => toggleDetail(p.id)}>
                      {expanded[p.id] ? "Ocultar detalhes" : "Ver detalhes"}
                    </button>
                  </div>
                  {expanded[p.id] && p.terms && <div className="fpd-promo-card__terms">{p.terms}</div>}
                </div>
                <ImagePlaceholder style={{ width: "100%", height: 150, borderRadius: 12 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="fpd-section">
          <div className="fpd-week-header">
            <span className="fpd-section-title">Sua semana no app</span>
          </div>
          <div className="fpd-week-subtitle">Histórico dos seus pedidos mais recentes.</div>

          <div className="fpd-activity-card">
            {days.map((g) => (
              <div key={g.dayLabel} className="fpd-activity-day">
                <div className="fpd-activity-day__label">{g.dayLabel}</div>
                {g.items.map((a) => (
                  <div key={a.id} className="fpd-activity-row">
                    <div className="fpd-activity-row__icon" style={{ background: ICON.bg, color: ICON.color }}>
                      {ICON.glyph}
                    </div>
                    <div>
                      <div className="fpd-activity-row__text">{a.text}</div>
                      <div className="fpd-activity-row__time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {days.length === 0 && <div className="empty-state">Nenhuma atividade de pedidos ainda.</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
