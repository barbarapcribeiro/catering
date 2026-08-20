import { useState } from "react";
import { useAppData } from "../mock/AppDataContext";
import "./ChatWidget.css";

export function ChatWidget() {
  const { chatMessages, sendChatMessage } = useAppData();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [input, setInput] = useState("");

  const unreadCount = hasOpened ? 0 : chatMessages.filter((m) => m.from === "them").length;

  const toggle = () => {
    setOpen((v) => !v);
    setHasOpened(true);
  };

  const send = () => {
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput("");
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-widget__panel">
          <div className="chat-widget__header">
            <div>
              <div className="chat-widget__title">Fale com o time Direct Eventos</div>
              <div className="chat-widget__subtitle">Prazos, itens especiais e dúvidas</div>
            </div>
            <button className="chat-widget__close" onClick={toggle} aria-label="Fechar chat">
              &times;
            </button>
          </div>
          <div className="chat-widget__messages">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className="chat-widget__message"
                style={{
                  alignSelf: m.from === "me" ? "flex-end" : "flex-start",
                  background: m.from === "me" ? "var(--color-primary)" : "#fff",
                  color: m.from === "me" ? "#fff" : "var(--color-text)",
                }}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-widget__input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Escreva sua mensagem..."
            />
            <button onClick={send} aria-label="Enviar mensagem">
              &#10148;
            </button>
          </div>
        </div>
      )}
      <button className="chat-widget__fab" onClick={toggle} aria-label="Abrir chat">
        💬
        {unreadCount > 0 && <span className="chat-widget__fab-badge">{unreadCount}</span>}
      </button>
    </div>
  );
}
