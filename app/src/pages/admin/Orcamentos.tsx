import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../../mock/AppDataContext";
import type { QuoteRequest, QuoteStatus } from "../../types";
import "./Orcamentos.css";

const STATUS_STYLE: Record<QuoteStatus, { bg: string; color: string }> = {
  Solicitado: { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  "Em elaboração": { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  Editado: { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  "Enviado para aprovação": { bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  Aprovado: { bg: "var(--color-success-soft)", color: "var(--color-success)" },
  Rejeitado: { bg: "var(--color-danger-soft, #fbe4e4)", color: "var(--color-danger)" },
  Cancelado: { bg: "var(--color-danger-soft, #fbe4e4)", color: "var(--color-danger)" },
};

type Tab = "pendentes" | "enviados" | "finalizados";

export function Orcamentos() {
  const { quoteRequests, costCenters, showToast } = useAppData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pendentes");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ccByCode = Object.fromEntries(costCenters.map((c) => [c.code, c]));

  const inTab = (q: QuoteRequest) => {
    if (tab === "pendentes") return q.status === "Solicitado" || q.status === "Em elaboração" || q.status === "Editado";
    if (tab === "enviados") return q.status === "Enviado para aprovação";
    return q.status === "Aprovado" || q.status === "Rejeitado" || q.status === "Cancelado";
  };

  const sorted = [...quoteRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const visible = sorted.filter(inTab);
  const selected = quoteRequests.find((q) => q.id === selectedId) ?? null;

  const counts = {
    pendentes: quoteRequests.filter((q) => q.status === "Solicitado" || q.status === "Em elaboração" || q.status === "Editado").length,
    enviados: quoteRequests.filter((q) => q.status === "Enviado para aprovação").length,
    finalizados: quoteRequests.filter((q) => q.status === "Aprovado" || q.status === "Rejeitado" || q.status === "Cancelado").length,
  };

  const startBuilding = (q: QuoteRequest) => {
    navigate(`/admin/orcamentos/${q.id}/montar`);
  };

  const copyLink = (q: QuoteRequest) => {
    showToast(`Pedido gerado: ${q.orderId}. Veja em Gerenciar Pedidos.`);
  };

  return (
    <div className="orcamentos-page">
      <div className="orcamentos-header">
        <div>
          <h1 className="orcamentos-title">Orçamentos</h1>
          <div className="orcamentos-subtitle">Solicitações recebidas via chat de orçamento — monte o pedido e envie a fatura para aprovação do cliente.</div>
        </div>
      </div>

      <div className="tab-row" style={{ marginBottom: 18 }}>
        <button className={tab === "pendentes" ? "is-active" : ""} onClick={() => setTab("pendentes")}>
          Pendentes ({counts.pendentes})
        </button>
        <button className={tab === "enviados" ? "is-active" : ""} onClick={() => setTab("enviados")}>
          Enviados ({counts.enviados})
        </button>
        <button className={tab === "finalizados" ? "is-active" : ""} onClick={() => setTab("finalizados")}>
          Finalizados ({counts.finalizados})
        </button>
      </div>

      <div className="orcamentos-grid">
        <div className="orcamentos-list">
          {visible.map((q) => {
            const st = STATUS_STYLE[q.status];
            return (
              <div key={q.id} className={`card orcamentos-card ${selectedId === q.id ? "is-selected" : ""}`} onClick={() => setSelectedId(q.id)}>
                <div className="orcamentos-card__top">
                  <div className="orcamentos-card__type">{q.serviceType}</div>
                  <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                    {q.status}
                  </span>
                </div>
                <div className="orcamentos-card__meta">
                  {q.requestedBy ?? "Cliente"} &bull; {q.peopleCount} pessoas &bull; {new Date(`${q.expectedDate}T00:00:00`).toLocaleDateString("pt-BR")}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && <div className="empty-state">Nenhuma solicitação nessa categoria.</div>}
        </div>

        <div className="card orcamentos-detail">
          {!selected && <div className="empty-state">Selecione uma solicitação na lista ao lado.</div>}
          {selected && (
            <>
              <div className="orcamentos-detail__head">
                <div>
                  <div className="orcamentos-detail__title">{selected.serviceType}</div>
                  <div className="orcamentos-detail__sub">Solicitado por {selected.requestedBy ?? "—"} em {new Date(selected.createdAt).toLocaleString("pt-BR")}</div>
                </div>
                <span className="status-pill" style={{ background: STATUS_STYLE[selected.status].bg, color: STATUS_STYLE[selected.status].color }}>
                  {selected.status}
                </span>
              </div>

              <div className="orcamentos-facts">
                <div>
                  <span>Data prevista</span>
                  <strong>{new Date(`${selected.expectedDate}T00:00:00`).toLocaleDateString("pt-BR")}</strong>
                </div>
                <div>
                  <span>Participantes</span>
                  <strong>{selected.peopleCount}</strong>
                </div>
                <div>
                  <span>Experiência desejada</span>
                  <strong>{selected.experience}</strong>
                </div>
                <div>
                  <span>Centro de custo</span>
                  <strong>{selected.costCenterCode ? `${selected.costCenterCode} · ${ccByCode[selected.costCenterCode]?.name ?? ""}` : "—"}</strong>
                </div>
              </div>

              <div className="orcamentos-open-text">
                <div className="orcamentos-open-text__label">O que o cliente quer</div>
                <div className="orcamentos-open-text__value">{selected.wants || "—"}</div>
              </div>
              <div className="orcamentos-open-text">
                <div className="orcamentos-open-text__label">Dietas especiais</div>
                <div className="orcamentos-open-text__value">{selected.specialDiet ? selected.specialDietDetails || "Sim, sem detalhes" : "Não"}</div>
              </div>
              <div className="orcamentos-open-text">
                <div className="orcamentos-open-text__label">Decoração / outros itens</div>
                <div className="orcamentos-open-text__value">{selected.decorationNotes || "—"}</div>
              </div>

              {selected.status === "Editado" && selected.clientFeedback && (
                <div className="orcamentos-feedback-banner">
                  <div className="orcamentos-open-text__label">⚠️ Cliente pediu alterações</div>
                  <div className="orcamentos-open-text__value">{selected.clientFeedback}</div>
                </div>
              )}

              {(selected.status === "Solicitado" || selected.status === "Em elaboração" || selected.status === "Editado") && (
                <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} onClick={() => startBuilding(selected)}>
                  {selected.status === "Solicitado" ? "Montar orçamento" : selected.status === "Editado" ? "Revisar orçamento" : "Continuar montagem"}
                </button>
              )}
              {selected.orderId && (
                <button className="btn btn--outline btn--full" style={{ marginTop: 12 }} onClick={() => copyLink(selected)}>
                  Ver pedido gerado ({selected.orderId})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
