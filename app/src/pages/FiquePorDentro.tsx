import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import type { Promo } from "../types";
import "./FiquePorDentro.css";

type PromoItem = Promo & {
  discount?: string;
  route?: string;
};

const PROMOS: PromoItem[] = [
  {
    id: "combo",
    tag: "NOVIDADE",
    color: "#283897",
    bg: "#e9edf9",
    title: "Combo Reunião",
    desc: "Um novo combo pensado para reuniões produtivas: coffee break completo com opções quentes e frias, montado em até 2h úteis.",
    fullDesc: "Um novo combo pensado para reuniões produtivas: coffee break completo com opções quentes e frias, montado em até 2h úteis.",
    terms: "Disponível para pedidos com no mínimo 10 pessoas. Sujeito à disponibilidade da unidade de atendimento.",
    validity: "15/08/2026",
    ctaLabel: "Conhecer opções",
    route: "/pedido/coffee-break",
  },
  {
    id: "coffee",
    tag: "PROMOÇÃO",
    color: "#1a7a4f",
    bg: "#e6f5ec",
    title: "Desconto no Coffee Break",
    desc: "Peça para grupos acima de 20 pessoas e ganhe 10% de desconto automático no valor total do pedido.",
    fullDesc: "Peça para grupos acima de 20 pessoas e ganhe 10% de desconto automático no valor total do pedido.",
    terms: "Desconto aplicado automaticamente no carrinho ao atingir 20 pessoas ou mais. Válido para todos os kits de Coffee Break.",
    validity: "31/07/2026",
    discount: "10% OFF",
    ctaLabel: "Aproveitar agora",
    route: "/pedido/coffee-break",
  },
  {
    id: "lanche",
    tag: "NOVIDADE",
    color: "#b5690f",
    bg: "#faf0e3",
    title: "Lanche Saudável",
    desc: "Novas opções de lanches saudáveis chegaram ao cardápio: frutas frescas, mix de castanhas e barrinhas integrais.",
    fullDesc: "Novas opções de lanches saudáveis chegaram ao cardápio: frutas frescas, mix de castanhas e barrinhas integrais.",
    terms: "Novos itens já disponíveis na categoria Lanche ao montar seu próximo pedido.",
    validity: "sem data limite",
    ctaLabel: "Ver opções",
  },
];

// The source prototype also tracks a "busca" (search) activity kind. It has no
// dedicated filter chip (only Todos/Pedidos/Favoritos/Mensagens exist) but still
// shows up under "Todos", so the local activity type extends the shared
// WeeklyActivity["type"] union with that extra kind.
type ActivityKind = "Pedido" | "Favorito" | "Mensagem" | "Busca";

interface ActivityEntry {
  id: string;
  day: string;
  kind: ActivityKind;
  text: string;
  time: string;
}

const ACTIVITIES: ActivityEntry[] = [
  { id: "a1", day: "Segunda, 21/07", kind: "Pedido", text: 'Pedido "Coffee Break Diretoria" criado', time: "09:15" },
  { id: "a2", day: "Segunda, 21/07", kind: "Favorito", text: 'Item "Água Mineral" adicionado aos favoritos', time: "09:20" },
  { id: "a3", day: "Terça, 22/07", kind: "Mensagem", text: 'Mensagem enviada no chat do pedido #CB-15234', time: "11:18" },
  { id: "a4", day: "Quarta, 23/07", kind: "Pedido", text: 'Pedido "Lanche Reunião Comercial" solicitado', time: "08:40" },
  { id: "a5", day: "Quinta, 24/07", kind: "Busca", text: 'Busca por "coffee break" no catálogo de serviços', time: "10:02" },
  { id: "a6", day: "Quinta, 24/07", kind: "Favorito", text: 'Item "Refeição Normal" adicionado aos favoritos', time: "10:05" },
  { id: "a7", day: "Sexta, 25/07", kind: "Pedido", text: 'Pedido "Evento Especial RH" solicitado', time: "08:30" },
];

const ICONS: Record<ActivityKind, { glyph: string; bg: string; color: string }> = {
  Pedido: { glyph: "\u{1F4E6}", bg: "#e9edf9", color: "#283897" },
  Favorito: { glyph: "★", bg: "#fdf3d9", color: "#b5690f" },
  Mensagem: { glyph: "\u{1F4AC}", bg: "#dfeaff", color: "#1e4fa3" },
  Busca: { glyph: "\u{1F50D}", bg: "#eef0ec", color: "#46526a" },
};

const FILTERS: { id: "todos" | "pedido" | "favorito" | "mensagem"; label: string; kind?: ActivityKind }[] = [
  { id: "todos", label: "Todos" },
  { id: "pedido", label: "Pedidos", kind: "Pedido" },
  { id: "favorito", label: "Favoritos", kind: "Favorito" },
  { id: "mensagem", label: "Mensagens", kind: "Mensagem" },
];

export function FiquePorDentro() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activityFilter, setActivityFilter] = useState<(typeof FILTERS)[number]["id"]>("todos");

  const toggleDetail = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const goTo = (route?: string) => {
    if (route) navigate(route);
  };

  const activeFilterDef = FILTERS.find((f) => f.id === activityFilter);
  const filtered = activeFilterDef?.kind ? ACTIVITIES.filter((a) => a.kind === activeFilterDef.kind) : ACTIVITIES;

  const days: { dayLabel: string; items: ActivityEntry[] }[] = [];
  filtered.forEach((a) => {
    let group = days.find((d) => d.dayLabel === a.day);
    if (!group) {
      group = { dayLabel: a.day, items: [] };
      days.push(group);
    }
    group.items.push(a);
  });

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
            <div className="tab-row">
              {FILTERS.map((f) => (
                <button key={f.id} className={activityFilter === f.id ? "is-active" : ""} onClick={() => setActivityFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="fpd-week-subtitle">Resumo do que você fez por aqui de 21 a 25 de julho.</div>

          <div className="fpd-activity-card">
            {days.map((g) => (
              <div key={g.dayLabel} className="fpd-activity-day">
                <div className="fpd-activity-day__label">{g.dayLabel}</div>
                {g.items.map((a) => {
                  const icon = ICONS[a.kind];
                  return (
                    <div key={a.id} className="fpd-activity-row">
                      <div className="fpd-activity-row__icon" style={{ background: icon.bg, color: icon.color }}>
                        {icon.glyph}
                      </div>
                      <div>
                        <div className="fpd-activity-row__text">{a.text}</div>
                        <div className="fpd-activity-row__time">{a.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {days.length === 0 && <div className="empty-state">Nenhuma atividade nessa categoria esta semana.</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
