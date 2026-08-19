import type { ReactNode } from "react";
import { Header } from "./Header";
import { ChatWidget } from "./ChatWidget";
import { Toast } from "./Toast";
import { PopupDisplay } from "./PopupDisplay";

export function Layout({ children, chat = false }: { children: ReactNode; chat?: boolean }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Header />
      {children}
      {chat && <ChatWidget />}
      <Toast />
      <PopupDisplay />
    </div>
  );
}
