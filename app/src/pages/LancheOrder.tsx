import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { AttachmentsField } from "../components/AttachmentsField";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { computeKitPrice } from "../mock/pricing";
import type { Kit, OrderAttachment } from "../types";
import "./OrderFlow.css";
import "./Surpreenda.css";
import "./LancheOrder.css";

const PAYMENTS = [
  { id: "credito", label: "Cartão de crédito", sub: "Pagamento na retirada, com maquininha", emoji: "💳" },
  { id: "debito", label: "Cartão de débito", sub: "Pagamento na retirada, com maquininha", emoji: "💳" },
  { id: "pix", label: "Pix", sub: "QR Code exibido no recibo", emoji: "⚡" },
];

export function LancheOrder() {
  const { addOrder, showToast, costCenters, kits, products, orders } = useAppData();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const repeatOrderId = (routerLocation.state as { repeatOrderId?: string } | null)?.repeatOrderId;

  const activeCostCenters = costCenters.filter((c) => c.active);
  const lancheKits = kits.filter((k) => k.active && (k.pages ?? []).includes("Lanche"));

  const kitPrice = (k: Kit) => {
    const itemsTotal = k.items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);
    return computeKitPrice(itemsTotal, k.serviceFeePercent);
  };

  const [orderId] = useState(() => `#LA-${Math.floor(15200 + Math.random() * 800)}`);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [costCenterMenuOpen, setCostCenterMenuOpen] = useState(false);
  const [payment, setPayment] = useState<string | null>(null);
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
      const kit = lancheKits.find((k) => k.name === it.name);
      if (kit) nextQtys[kit.id] = it.qty;
    });
    setQtys(nextQtys);
    if (source.costCenters && source.costCenters.length > 0) setCostCenter(source.costCenters[0].code);
    showToast("Carrinho preenchido com os itens do pedido anterior. Revise e confirme.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOrderId]);

  const cartItems = useMemo(
    () =>
      lancheKits
        .filter((k) => (qtys[k.id] || 0) > 0)
        .map((k) => {
          const qty = qtys[k.id];
          const unitPrice = kitPrice(k);
          return { id: k.id, name: k.name, qty, unitPrice, total: unitPrice * qty };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qtys, lancheKits, products],
  );

  const totalUnits = cartItems.reduce((sum, ci) => sum + ci.qty, 0);
  const total = cartItems.reduce((sum, ci) => sum + ci.total, 0);
  const paymentDef = PAYMENTS.find((p) => p.id === payment);
  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const submitOrder = () => {
    if (totalUnits === 0) {
      setHasError(true);
      setErrorMsg("Selecione ao menos um kit de lanche.");
      return;
    }
    if (!pickupDate || !pickupTime) {
      setHasError(true);
      setErrorMsg("Preencha a data e o horário de retirada.");
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
      category: "Lanche",
      type: "Lanche",
      mono: "LA",
      qty: `${totalUnits} kit(s)`,
      pickupDate,
      pickupTime,
      datetime: `${pickupDate} ${pickupTime}`.trim(),
      status: "Solicitado",
      value: money(total),
      valueNumber: total,
      items: cartItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.unitPrice })),
      costCenters: [{ code: costCenter, percent: 100 }],
      notes: `Forma de pagamento: ${paymentDef?.label ?? "—"}`,
      attachments: attachments.length ? attachments : undefined,
    });
    showToast("Pedido de lanche solicitado com sucesso!");
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
                <div className="receipt-card__title">Lanche &bull; Direct Eventos</div>
                <div className="receipt-card__meta">
                  Pedido {orderId} &bull; {todayLabel}
                </div>
              </div>

              <div className="event-summary-grid" style={{ borderBottom: "1px solid var(--color-border-soft)", paddingBottom: 14, marginBottom: 14 }}>
                <div>
                  <div className="event-summary-item-label">Data de retirada</div>
                  <div className="event-summary-item-value">{pickupDate || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Horário de retirada</div>
                  <div className="event-summary-item-value">{pickupTime || "Não informado"}</div>
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
          <div className="order-header-icon">LA</div>
          <div>
            <h1 className="order-title">Lanche</h1>
            <div className="order-subtitle">Escolha os kits de lanche, o horário de retirada e a forma de pagamento.</div>
          </div>
        </div>

        <div className="catalog-heading">1. Escolha os kits de lanche</div>
        <div className="kits-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {lancheKits.map((k) => {
            const qty = qtys[k.id] || 0;
            const price = kitPrice(k);
            return (
              <div key={k.id} className="kit-card" style={{ borderColor: qty > 0 ? "var(--color-primary)" : "var(--color-border)" }}>
                {k.photoUrl ? (
                  <img src={k.photoUrl} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                ) : (
                  <ImagePlaceholder label="Foto do kit" style={{ width: "100%", height: 130, borderRadius: 0 }} />
                )}
                <div className="kit-card__body">
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{k.name}</div>
                  {k.description && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6, minHeight: 32 }}>{k.description}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{money(price)}</div>
                    <div className="qty-stepper">
                      <button onClick={() => setQty(k.id, qty - 1)}>&minus;</button>
                      <span>{qty}</span>
                      <button onClick={() => setQty(k.id, qty + 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {lancheKits.length === 0 && <div className="empty-state">Nenhum kit de lanche cadastrado ainda. Cadastre em Catálogos &rsaquo; Kits, marcando o serviço "Lanche".</div>}
        </div>

        <div className="step-card">
          <div className="step-heading">2. Data e horário de retirada</div>
          <div className="lanche-fields-grid">
            <label className="field-label">
              Data de retirada
              <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </label>
            <label className="field-label">
              Horário de retirada
              <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
            </label>
            <div style={{ position: "relative" }}>
              <label className="field-label" style={{ marginBottom: 6 }}>Centro de custo</label>
              <div className="lanche-local-box" onClick={() => setCostCenterMenuOpen((v) => !v)} style={{ color: costCenter ? "var(--color-text)" : "var(--color-text-muted)" }}>
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
          <div className="step-heading">3. Forma de pagamento</div>
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

        <div className="step-card">
          <div className="step-heading">4. Anexo</div>
          <AttachmentsField value={attachments} onChange={setAttachments} />
        </div>

        <div className="step-card lanche-summary">
          <div className="lanche-summary__row">
            <span>Itens selecionados</span>
            <strong>{totalUnits}</strong>
          </div>
          <div className="lanche-summary__row lanche-summary__row--total">
            <span>Valor total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>

        {hasError && <div className="error-text" style={{ marginBottom: 12 }}>{errorMsg}</div>}

        <button className="btn btn--primary btn--full" onClick={submitOrder}>
          Confirmar pedido de lanche
        </button>
      </div>
    </Layout>
  );
}
