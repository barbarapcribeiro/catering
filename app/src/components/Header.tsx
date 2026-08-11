import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppData } from "../mock/AppDataContext";
import "./Header.css";

export function Header() {
  const { notifications, markAllNotificationsRead } = useAppData();
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="app-header">
      <div className="app-header__identity">
        <button className="app-header__avatar" onClick={() => navigate("/")} aria-label="Ir para a página inicial">
          B
        </button>
        <div>
          <div className="app-header__name">Olá, Bárbara C. Ribeiro</div>
          <div className="app-header__subtitle">Sodexo &bull; Demonstração</div>
        </div>
      </div>
      <nav className="app-header__nav">
        <Link to="/fique-por-dentro">Fique por dentro</Link>
        <Link to="/pedidos">Pedidos</Link>
        <Link to="/producao">Produção</Link>
        <div className="app-header__divider" />
        <Link to="/admin" className="app-header__admin-btn">
          Painel Administrativo
        </Link>
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
                <div key={n.id} className="app-header__dropdown-item">
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
