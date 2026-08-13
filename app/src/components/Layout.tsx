import type { ReactNode } from "react";
import { Header } from "./Header";
import { ChatWidget } from "./ChatWidget";
import { Toast } from "./Toast";

export function Layout({ children, chat = false }: { children: ReactNode; chat?: boolean }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Header />
      {children}
      {chat && <ChatWidget />}
      <Toast />
    </div>
  );
}
