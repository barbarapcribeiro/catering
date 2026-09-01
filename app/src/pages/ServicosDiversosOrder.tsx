import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { AttachmentsField } from "../components/AttachmentsField";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import type { OrderAttachment } from "../types";
import "./OrderFlow.css";
import "./Surpreenda.css";
import "./ServicosDiversosOrder.css";

const PAYMENTS = [
  { id: "credito", label: "Cartão de crédito", sub: "Pagamento na conclusão do serviço", emoji: "💳" },
  { id: "debito", label: "Cartão de débito", sub: "Pagamento na conclusão do serviço", emoji: "💳" },
  { id: "pix", label: "Pix", sub: "QR Code exibido no recibo", emoji: "⚡" },
];

export function ServicosDiversosOrder() {
  const { addOrder, showToast, costCenters, serviceCatalog, orders } = useAppData();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const repeatOrderId = (routerLocation.state as { repeatOrderId?: string } | null)?.repeatOrderId;

  const activeCostCenters = costCenters.filter((c) => c.active);
  const activeServices = serviceCatalog.filter((s) => s.active);

  const [orderId] = useState(() => `#SD-${Math.floor(15200 + Math.random() * 800)}`);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [serviceDate, setServiceDate] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [costCenterMenuOpen, setCostCenterMenuOpen] = useState(false);
  const [payment, setPayment] = useState<string | null>(null);
  const [observations, setObservations] = useState("");
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const setQty = (id: string, v: number) => setQtys((s) => ({ ...s, [id]: Math.max(0, v) }));

  useEffect(() => {
    if (!repeatOrderId) return;
    const source = orders.find((o) => o.id === repeatOrderId);
    if (!source) return;
    const nextQtys: Record<string, number> = {};
    (source.items ?? []).forEach((it) => {
      const svc = activeServices.find((s) => s.name === it.name);
      if (svc) nextQtys[svc.id] = it.qty;
    });
    setQtys(nextQtys);
    if (source.costCenters && source.costCenters.length > 0) setCostCenter(source.costCenters[0].code);
    showToast("Carrinho preenchido com os itens do pedido anterior. Revise e confirme.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOrderId]);

  const cartItems = useMemo(
    () =>
      activeServices
        .filter((sv) => (qtys[sv.id] || 0) > 0)
        .map((sv) => {
          const qty = qtys[sv.id];
          return { id: sv.id, name: sv.name, qty, unitPrice: sv.price, total: sv.price * qty };
        }),
    [qtys, activeServices],
  );

  const totalUnits = cartItems.reduce((sum, ci) => sum + ci.qty, 0);
  const total = cartItems.reduce((sum, ci) => sum + ci.total, 0);
  const paymentDef = PAYMENTS.find((p) => p.id === payment);
  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const submitOrder = () => {
    if (totalUnits === 0) {
      setHasError(true);
      setErrorMsg("Selecione ao menos um serviço.");
      return;
    }
    if (!serviceDate || !serviceTime) {
      setHasError(true);
      setErrorMsg("Preencha a data e o horário do serviço.");
      return;
    }
    if (!costCenter) {
      setHasError(true);
      setErrorMsg("Selecione o centro de custo.");
      return;
    }
    if (!payment) {
      setHasError(true);
      setErrorMsg("Selecione a forma de pagamento.");
      return;
    }
    setHasError(false);
    setErrorMsg("");

    addOrder({
      id: orderId,
      category: "Serviços Diversos",
      type: "Serviços Diversos",
      mono: "SD",
      qty: `${totalUnits} serviço(s)`,
      pickupDate: serviceDate,
      pickupTime: serviceTime,
      datetime: `${serviceDate} ${serviceTime}`.trim(),
      status: "Solicitado",
      value: money(total),
      valueNumber: total,
      items: cartItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.unitPrice })),
      costCenters: [{ code: costCenter, percent: 100 }],
      notes: [`Forma de pagamento: ${paymentDef?.label ?? "—"}`, observations && `Observações: ${observations}`].filter(Boolean).join(" · "),
      attachments: attachments.length ? attachments : undefined,
    });
    showToast("Pedido de serviços diversos solicitado com sucesso!");
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Layout>
        <div className="page-container" style={{ paddingTop: 24 }}>
          <div className="receipt-wrap">
            <div className="confirmation-header" style={{ marginBottom: 20 }}>
              <div className="confirmation-icon">✓</div>
              <div>
                <div className="confirmation-title">Pedido confirmado!</div>
                <div className="confirmation-meta">
                  Pedido {orderId} &bull; enviado em {todayLabel}
                </div>
              </div>
            </div>

            <div className="receipt-card">
              <div className="receipt-card__header">
                <div className="receipt-card__eyebrow">Recibo</div>
                <div className="receipt-card__title">Serviços Diversos &bull; Direct Eventos</div>
                <div className="receipt-card__meta">
                  Pedido {orderId} &bull; {todayLabel}
                </div>
              </div>

              <div className="event-summary-grid" style={{ borderBottom: "1px solid var(--color-border-soft)", paddingBottom: 14, marginBottom: 14 }}>
                <div>
                  <div className="event-summary-item-label">Data do serviço</div>
                  <div className="event-summary-item-value">{serviceDate || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Horário do serviço</div>
                  <div className="event-summary-item-value">{serviceTime || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Centro de custo</div>
                  <div className="event-summary-item-value">{costCenter}</div>
                </div>
              </div>

              <div className="receipt-table-head">
                <div>Item</div>
                <div>Qtd.</div>
                <div>Total</div>
              </div>
              {cartItems.map((ci) => (
                <div key={ci.id} className="receipt-row">
                  <div style={{ fontWeight: 600 }}>{ci.name}</div>
                  <div style={{ color: "var(--color-text-secondary)" }}>{ci.qty}</div>
                  <div style={{ fontWeight: 700, textAlign: "right" }}>{money(ci.total)}</div>
                </div>
              ))}

              <div className="invoice-totals">
                <div className="invoice-totals__final">
                  <span>Valor total</span>
                  <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
                </div>
              </div>

              <div className="receipt-payment-row">
                <span style={{ color: "var(--color-text-muted)" }}>Forma de pagamento</span>
                <span style={{ fontWeight: 700 }}>{paymentDef ? paymentDef.label : "—"}</span>
              </div>

              {observations && (
                <div className="receipt-payment-row">
                  <span style={{ color: "var(--color-text-muted)" }}>Observações</span>
                  <span style={{ fontWeight: 600, textAlign: "right" }}>{observations}</span>
                </div>
              )}

              <div className="receipt-disclaimer">Este recibo é uma demonstração e não possui valor fiscal.</div>
            </div>

            <div className="receipt-actions">
              <button className="btn btn--outline" style={{ flex: 1 }} onClick={() => navigate("/")}>
                Voltar para a página inicial
              </button>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => window.print()}>
                🖨️ Imprimir recibo
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container" style={{ paddingTop: 24, maxWidth: 1000 }}>
        <button className="order-back-link" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para a página inicial
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26 }}>
          <div className="order-header-icon">SD</div>
          <div>
            <h1 className="order-title">Serviços Diversos</h1>
            <div className="order-subtitle">Escolha os serviços cadastrados, a data prevista e a forma de pagamento.</div>
          </div>
        </div>

        <div className="catalog-heading">1. Escolha os serviços</div>
        <div className="sd-service-list">
          {activeServices.map((sv) => {
            const qty = qtys[sv.id] || 0;
            return (
              <div key={sv.id} className="sd-service-row" style={{ borderColor: qty > 0 ? "var(--color-primary)" : "var(--color-border)" }}>
                <div className="sd-service-row__info">
                  <div className="sd-service-row__name-line">
                    <span className="sd-service-row__name">{sv.name}</span>
                    <span className="pill-tag">{sv.category}</span>
                  </div>
                  {sv.description && <div className="sd-service-row__desc">{sv.description}</div>}
                  <div className="sd-service-row__price">{money(sv.price)}</div>
                </div>
                <div className="qty-stepper">
                  <button onClick={() => setQty(sv.id, qty - 1)}>&minus;</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(sv.id, qty + 1)}>+</button>
                </div>
              </div>
            );
          })}
          {activeServices.length === 0 && <div className="empty-state">Nenhum serviço cadastrado ainda. Cadastre em Catálogos &rsaquo; Serviços.</div>}
        </div>

        <div className="step-card">
          <div className="step-heading">2. Data e horário do serviço</div>
          <div className="sd-fields-grid">
            <label className="field-label">
              Data do serviço
              <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </label>
            <label className="field-label">
              Horário do serviço
              <input type="time" value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} />
            </label>
            <div style={{ position: "relative" }}>
              <label className="field-label" style={{ marginBottom: 6 }}>Centro de custo</label>
              <div className="sd-local-box" onClick={() => setCostCenterMenuOpen((v) => !v)} style={{ color: costCenter ? "var(--color-text)" : "var(--color-text-muted)" }}>
                {costCenter ? `${costCenter} · ${activeCostCenters.find((c) => c.code === costCenter)?.name}` : "Selecionar centro de custo"}
              </div>
              {costCenterMenuOpen && (
                <div className="location-dropdown">
                  {activeCostCenters.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCostCenter(c.code);
                        setCostCenterMenuOpen(false);
                      }}
                    >
                      {c.code} · {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="step-card">
          <div className="step-heading">3. Observações <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span></div>
          <textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Detalhes adicionais sobre o serviço solicitado" style={{ width: "100%" }} />
        </div>

        <div className="step-card">
          <AttachmentsField value={attachments} onChange={setAttachments} />
        </div>

        <div className="step-card">
          <div className="step-heading">4. Forma de pagamento</div>
          <div className="payment-options">
            {PAYMENTS.map((p) => {
              const sel = payment === p.id;
              return (
                <button key={p.id} className="payment-option" style={{ borderColor: sel ? "var(--color-primary)" : "var(--color-border)", background: sel ? "#f4f6fc" : "#fff" }} onClick={() => setPayment(p.id)}>
                  <div className="payment-option__icon">{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{p.sub}</div>
                  </div>
                  <div className="payment-option__radio" style={{ borderColor: sel ? "var(--color-primary)" : "var(--color-border-input)", background: sel ? "var(--color-primary)" : "#fff" }} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="step-card sd-summary">
          <div className="sd-summary__row">
            <span>Itens selecionados</span>
            <strong>{totalUnits}</strong>
          </div>
          <div className="sd-summary__row sd-summary__row--total">
            <span>Valor total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>

        {hasError && <div className="error-text" style={{ marginBottom: 12 }}>{errorMsg}</div>}

        <button className="btn btn--primary btn--full" onClick={submitOrder}>
          Confirmar pedido de serviços diversos
        </button>
      </div>
    </Layout>
  );
}
