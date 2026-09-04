import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppData } from "../mock/AppDataContext";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { APP_PAGES } from "../types";
import "./Header.css";

interface MenuItem {
  pageId: string;
  label: string;
  to: string;
  glyph: string;
}
interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const COLLAB_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Início",
    items: [{ pageId: "home", label: "Home", to: "/", glyph: "🏠" }],
  },
  {
    label: "Fazer um pedido",
    items: [
      { pageId: "pedido-coffee", label: "Coffee Break", to: "/pedido/coffee-break", glyph: "☕" },
      { pageId: "pedido-evento", label: "Evento Especial", to: "/pedido/evento-especial", glyph: "🎪" },
      { pageId: "pedido-agua", label: "Solicitação de Água", to: "/pedido/agua", glyph: "💧" },
      { pageId: "pedido-abastecimento", label: "Abastecimento Simples", to: "/pedido/abastecimento-simples", glyph: "🧃" },
      { pageId: "surpreenda", label: "Surpreenda", to: "/surpreenda", glyph: "🎁" },
      { pageId: "pedido-lanche", label: "Lanche", to: "/pedido/lanche", glyph: "🥪" },
      { pageId: "pedido-servicos-diversos", label: "Serviços Diversos", to: "/pedido/servicos-diversos", glyph: "🧰" },
      { pageId: "consumo-catraca", label: "Consumo Catraca", to: "/consumo-catraca", glyph: "🍽" },
      { pageId: "reserva-refeicao", label: "Reserva de Refeição", to: "/reserva-refeicao", glyph: "🍱" },
      { pageId: "solicitar-orcamento", label: "Solicitar Orçamento", to: "/solicitar-orcamento", glyph: "🧾" },
    ],
  },
  {
    label: "Gerenciar",
    items: [
      { pageId: "pedidos", label: "Gerenciar Pedidos", to: "/pedidos", glyph: "📋" },
      { pageId: "producao", label: "Produção", to: "/producao", glyph: "🔥" },
      { pageId: "aprovacoes", label: "Aprovações", to: "/aprovacoes", glyph: "✓" },
      { pageId: "eventos-premium", label: "Eventos Premium", to: "/eventos-premium", glyph: "🎉" },
    ],
  },
  {
    label: "Outros",
    items: [
      { pageId: "fique-por-dentro", label: "Fique por Dentro", to: "/fique-por-dentro", glyph: "📰" },
      { pageId: "pesquisa-app", label: "Pesquisa da Aplicação", to: "/pesquisa-app", glyph: "💬" },
    ],
  },
];

export function Header() {
  const { notifications, markAllNotificationsRead, currentUser, currentProfile, hasPageAccess, operatingParameters } = useAppData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  const displayName = currentUser?.name ?? currentProfile?.name ?? "Visitante";
  const hasAnyAdminAccess = APP_PAGES.filter((p) => p.group === "Painel Administrativo").some((p) => hasPageAccess(p.id));
  const visibleMenuGroups = COLLAB_MENU_GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => hasPageAccess(it.pageId)) })).filter((g) => g.items.length > 0);

  return (
    <header className="app-header">
      <div className="app-header__identity">
        {visibleMenuGroups.length > 0 && (
          <button className="app-header__menu-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        )}
        <button className="app-header__avatar" onClick={() => navigate("/")} aria-label="Ir para a página inicial">
          {operatingParameters.logoUrl ? <img src={operatingParameters.logoUrl} alt="Logo" className="app-header__avatar-logo" /> : displayName.charAt(0).toUpperCase()}
        </button>
        <div>
          <div className="app-header__name">Olá, {displayName}</div>
          <div className="app-header__subtitle">
            Direct Eventos &bull; {currentProfile?.name ?? "Demonstração"}
            {operatingParameters.extensionNumber && ` · Ramal ${operatingParameters.extensionNumber}`}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="app-header__drawer-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="app-header__drawer" onClick={(e) => e.stopPropagation()}>
            <div className="app-header__drawer-head">
              <div className="app-header__drawer-title">Menu &bull; {currentProfile?.name ?? "Perfil"}</div>
              <button className="app-header__drawer-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
                ×
              </button>
            </div>
            {visibleMenuGroups.map((g) => (
              <div className="app-header__drawer-group" key={g.label}>
                <div className="app-header__drawer-group-label">{g.label}</div>
                {g.items.map((it) => (
                  <Link key={it.to} to={it.to} className="app-header__drawer-item" onClick={() => setMenuOpen(false)}>
                    <span className="app-header__drawer-glyph">{it.glyph}</span>
                    {it.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}

      <nav className="app-header__nav">
        {hasPageAccess("home") && <Link to="/" className="app-header__home-link">Home</Link>}
        {hasPageAccess("pedidos") && <Link to="/pedidos">Pedidos</Link>}
        <div className="app-header__divider" />
        <Link to="/autocadastro" className="app-header__signup-link">
          Cadastre-se
        </Link>
        <ProfileSwitcher />
        {hasAnyAdminAccess && (
          <Link to="/admin" className="app-header__admin-btn">
            Painel Administrativo
          </Link>
        )}
        <div className="app-header__notif">
          <button
            className="app-header__bell"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notificações"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unread > 0 && <span className="app-header__badge">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="app-header__dropdown">
              <div className="app-header__dropdown-title">Notificações</div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="app-header__dropdown-item"
                  style={n.link ? { cursor: "pointer" } : undefined}
                  onClick={() => {
                    if (!n.link) return;
                    setNotifOpen(false);
                    navigate(n.link);
                  }}
                >
                  <div className="app-header__dropdown-item-title">{n.title}</div>
                  <div className="app-header__dropdown-item-time">{n.time}</div>
                </div>
              ))}
              <div className="app-header__dropdown-footer">
                <button
                  onClick={() => {
                    markAllNotificationsRead();
                    setNotifOpen(false);
                  }}
                >
                  Marcar todas como lidas
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
