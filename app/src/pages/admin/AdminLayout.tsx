import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAppData } from "../../mock/AppDataContext";
import { Toast } from "../../components/Toast";
import { ProfileSwitcher } from "../../components/ProfileSwitcher";
import "./AdminLayout.css";

interface NavItem {
  label: string;
  to: string;
  glyph: string;
  pageId: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { label: "Gestão de pedidos", to: "/pedidos", glyph: "📋", pageId: "pedidos" },
      { label: "Orçamentos", to: "/admin/orcamentos", glyph: "🧾", pageId: "admin-orcamentos" },
      { label: "Aprovações", to: "/aprovacoes", glyph: "✓", pageId: "aprovacoes" },
      { label: "Eventos Premium", to: "/eventos-premium", glyph: "🎉", pageId: "eventos-premium" },
      { label: "Ocorrências", to: "/admin/ocorrencias", glyph: "⚠", pageId: "admin-ocorrencias" },
      { label: "Check-in Consumo Catraca", to: "/admin/catraca-checkin", glyph: "🍽", pageId: "admin-catraca-checkin" },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { label: "Produtos", to: "/admin/produtos", glyph: "📦", pageId: "admin-produtos" },
      { label: "Kits", to: "/admin/kits", glyph: "🎁", pageId: "admin-kits" },
      { label: "Serviços", to: "/admin/servicos", glyph: "🧰", pageId: "admin-servicos" },
      { label: "Decorações", to: "/admin/decoracoes", glyph: "🎈", pageId: "admin-decoracoes" },
      { label: "Fornecedores", to: "/admin/fornecedores", glyph: "🚚", pageId: "admin-fornecedores" },
    ],
  },
  {
    label: "Pesquisa de Satisfação",
    items: [
      { label: "Configurar perguntas", to: "/admin/pesquisa-satisfacao", glyph: "⭐", pageId: "admin-pesquisa" },
      { label: "Pesquisa da aplicação (CX/UX/NPS)", to: "/admin/pesquisa-aplicacao", glyph: "💬", pageId: "admin-pesquisa-app" },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { label: "Usuários", to: "/admin/usuarios", glyph: "👤", pageId: "admin-usuarios" },
      { label: "Perfis e permissões", to: "/admin/permissoes", glyph: "🔒", pageId: "admin-permissoes" },
      { label: "Autocadastro (link público)", to: "/autocadastro", glyph: "🆕", pageId: "admin-autocadastro" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { label: "Segmentos", to: "/admin/segmentos", glyph: "🧩", pageId: "admin-segmentos" },
      { label: "Unidades", to: "/admin/unidades", glyph: "🏭", pageId: "admin-unidades" },
      { label: "Marcas", to: "/admin/marcas", glyph: "🏷", pageId: "admin-marcas" },
      { label: "Empresas", to: "/admin/empresas", glyph: "🏢", pageId: "admin-empresas" },
      { label: "Filiais", to: "/admin/filiais", glyph: "🏬", pageId: "admin-filiais" },
      { label: "Centros de custo", to: "/admin/centros-custo", glyph: "🏷", pageId: "admin-centros-custo" },
      { label: "Copas", to: "/admin/copas", glyph: "🍽", pageId: "admin-copas" },
      { label: "Localizações", to: "/admin/localizacoes", glyph: "📍", pageId: "admin-localizacoes" },
    ],
  },
  {
    label: "Conteúdo",
    items: [{ label: "Pop-ups", to: "/admin/popups", glyph: "📢", pageId: "admin-popups" }],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Faturamento", to: "/admin/faturamento", glyph: "💳", pageId: "admin-faturamento" },
      { label: "Contratos", to: "/admin/contratos", glyph: "📄", pageId: "admin-contratos" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { label: "Parâmetros", to: "/admin/parametros", glyph: "⚙", pageId: "admin-parametros" },
      { label: "Serviços por Filial", to: "/admin/servicos-filial", glyph: "🧭", pageId: "admin-servicos-filial" },
    ],
  },
  {
    label: "Gestão de Ativos",
    items: [
      { label: "Ativos", to: "/admin/ativos", glyph: "🧴", pageId: "admin-ativos" },
      { label: "Tipos de ativo", to: "/admin/tipos-ativo", glyph: "🏷", pageId: "admin-tipos-ativo" },
      { label: "Check-in / Check-out", to: "/admin/ativos/checkin", glyph: "🔁", pageId: "admin-ativos-checkin" },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { label: "Visão Geral", to: "/admin/relatorios", glyph: "📊", pageId: "admin-relatorios" },
      { label: "Faturamento", to: "/admin/relatorios/faturamento", glyph: "💰", pageId: "admin-relatorios" },
      { label: "Pedidos", to: "/admin/relatorios/pedidos", glyph: "📦", pageId: "admin-relatorios" },
      { label: "Centros de Custo", to: "/admin/relatorios/centros-custo", glyph: "🏷", pageId: "admin-relatorios" },
      { label: "Lucro por Produto", to: "/admin/relatorios/lucro-produto", glyph: "💰", pageId: "admin-relatorios" },
      { label: "Ativos", to: "/admin/relatorios/ativos", glyph: "🧴", pageId: "admin-relatorios" },
      { label: "Consumo Catraca", to: "/admin/relatorios/catraca", glyph: "🍽", pageId: "admin-relatorios" },
      { label: "Orçamentos", to: "/admin/relatorios/orcamentos", glyph: "🧾", pageId: "admin-relatorios" },
      { label: "Pesquisa de Satisfação", to: "/admin/relatorios/pesquisa-satisfacao", glyph: "⭐", pageId: "admin-relatorios" },
      { label: "Pesquisa da Aplicação", to: "/admin/relatorios/pesquisa-aplicacao", glyph: "💬", pageId: "admin-relatorios" },
    ],
  },
];

export function AdminLayout() {
  const location = useLocation();
  const { notifications, currentUser, currentProfile, hasPageAccess } = useAppData();
  const [topSearch, setTopSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const unread = notifications.filter((n) => !n.read).length;
  const displayName = currentUser?.name ?? currentProfile?.name ?? "Visitante";

  return (
    <div className={`admin-shell ${sidebarOpen ? "" : "admin-shell--sidebar-collapsed"}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">D</div>
          <div className="admin-sidebar__brand-name">Direct Eventos</div>
        </div>

        {NAV_GROUPS.map((g) => {
          const visibleItems = g.items.filter((it) => hasPageAccess(it.pageId));
          if (visibleItems.length === 0) return null;
          return (
            <div className="admin-sidebar__group" key={g.label}>
              <div className="admin-sidebar__group-label">{g.label}</div>
              <div className="admin-sidebar__group-items">
                {visibleItems.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`admin-sidebar__item ${location.pathname === it.to ? "is-active" : ""}`}
                  >
                    <span className="admin-sidebar__glyph">{it.glyph}</span>
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <button
            className="admin-topbar__menu-toggle"
            aria-label={sidebarOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="admin-topbar__search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Pesquisar item (pedido, produto, usuário...)"
            />
          </div>
          <div className="admin-topbar__right">
            <Link to="/" className="admin-topbar__back">
              ← Voltar ao app
            </Link>
            <ProfileSwitcher />
            <button className="admin-topbar__bell" aria-label="Notificações">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#46526a" strokeWidth="2">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unread > 0 && <span className="admin-topbar__badge">{unread}</span>}
            </button>
            <div className="admin-topbar__user">
              <div className="admin-topbar__avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div>
                <div className="admin-topbar__user-name">{displayName}</div>
                <div className="admin-topbar__user-role">{currentProfile?.name ?? "Sem perfil"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>

      <Toast />
    </div>
  );
}
