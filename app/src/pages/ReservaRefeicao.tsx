import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { AttachmentsField } from "../components/AttachmentsField";
import { KitDetailsModal } from "../components/KitDetailsModal";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { computeKitPrice } from "../mock/pricing";
import { kitContentsFromCatalog } from "../mock/kitContents";
import { MEAL_SERVICES, type Kit, type MealServiceName, type OrderAttachment } from "../types";
import "./OrderFlow.css";
import "./Surpreenda.css";
import "./LancheOrder.css";

type MealType = "Refeição Normal" | "Refeição Marmitex";
const MEAL_TYPES: MealType[] = ["Refeição Normal", "Refeição Marmitex"];

const MANUAL_PAYMENTS = [
  { id: "credito", label: "Cartão de crédito", sub: "Pagamento na retirada, com maquininha", emoji: "💳" },
  { id: "debito", label: "Cartão de débito", sub: "Pagamento na retirada, com maquininha", emoji: "💳" },
  { id: "pix", label: "Pix", sub: "QR Code exibido no recibo", emoji: "⚡" },
];

export function ReservaRefeicao() {
  const { addOrder, showToast, costCenters, kits, products, serviceCatalog } = useAppData();
  const navigate = useNavigate();

  const activeCostCenters = costCenters.filter((c) => c.active);
  const reservaKits = kits.filter((k) => k.active && (k.pages ?? []).includes("Reserva de Refeição"));

  const kitPrice = (k: Kit) => {
    const itemsTotal = k.items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);
    return computeKitPrice(itemsTotal, k.serviceFeePercent);
  };

  const [orderId] = useState(() => `#RR-${Math.floor(15200 + Math.random() * 800)}`);
  const [detailsKitId, setDetailsKitId] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(MEAL_TYPES[0]);
  const [meal, setMeal] = useState<MealServiceName>(MEAL_SERVICES[0]);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [consumeDate, setConsumeDate] = useState("");
  const [consumeTime, setConsumeTime] = useState("");
  const [paymentMode, setPaymentMode] = useState<"centro" | "manual" | null>(null);
  const [costCenter, setCostCenter] = useState("");
  const [manualPayment, setManualPayment] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const setQty = (id: string, v: number) => setQtys((s) => ({ ...s, [id]: Math.max(0, v) }));

  const visibleKits = useMemo(
    () => reservaKits.filter((k) => (k.pages ?? []).includes(mealType) && (k.mealServices ?? []).includes(meal)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reservaKits, mealType, meal],
  );

  const cartItems = useMemo(
    () =>
      reservaKits
        .filter((k) => (qtys[k.id] || 0) > 0)
        .map((k) => {
          const qty = qtys[k.id];
          const unitPrice = kitPrice(k);
          return { id: k.id, name: k.name, qty, unitPrice, total: unitPrice * qty, contents: kitContentsFromCatalog(k, products, serviceCatalog) };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qtys, reservaKits, products, serviceCatalog],
  );

  const totalUnits = cartItems.reduce((sum, ci) => sum + ci.qty, 0);
  const total = cartItems.reduce((sum, ci) => sum + ci.total, 0);
  const manualPaymentDef = MANUAL_PAYMENTS.find((p) => p.id === manualPayment);
  const paymentLabel = paymentMode === "centro" ? `Centro de custo (${costCenter})` : paymentMode === "manual" ? manualPaymentDef?.label ?? "—" : "—";
  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const submitOrder = () => {
    if (totalUnits === 0) {
      setHasError(true);
      setErrorMsg("Selecione ao menos uma refeição.");
      return;
    }
    if (!consumeDate || !consumeTime) {
      setHasError(true);
      setErrorMsg("Preencha a data e o horário da reserva.");
      return;
    }
    if (!paymentMode) {
      setHasError(true);
      setErrorMsg("Selecione a forma de pagamento.");
      return;
    }
    if (paymentMode === "centro" && !costCenter) {
      setHasError(true);
      setErrorMsg("Selecione o centro de custo.");
      return;
    }
    if (paymentMode === "manual" && !manualPayment) {
      setHasError(true);
      setErrorMsg("Selecione a forma de pagamento manual.");
      return;
    }
    setHasError(false);
    setErrorMsg("");

    addOrder({
      id: orderId,
      category: "Reserva de Refeição",
      type: "Reserva de Refeição",
      mono: "RR",
      qty: `${totalUnits} refeição(ões)`,
      pickupDate: consumeDate,
      pickupTime: consumeTime,
      datetime: `${consumeDate} ${consumeTime}`.trim(),
      status: "Solicitado",
      value: money(total),
      valueNumber: total,
      items: cartItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.unitPrice })),
      costCenters: paymentMode === "centro" ? [{ code: costCenter, percent: 100 }] : undefined,
      notes: `Forma de pagamento: ${paymentLabel}`,
      attachments: attachments.length ? attachments : undefined,
    });
    showToast("Reserva de refeição solicitada com sucesso!");
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
                <div className="confirmation-title">Reserva confirmada!</div>
                <div className="confirmation-meta">
                  Pedido {orderId} &bull; enviado em {todayLabel}
                </div>
              </div>
            </div>

            <div className="receipt-card">
              <div className="receipt-card__header">
                <div className="receipt-card__eyebrow">Recibo</div>
                <div className="receipt-card__title">Reserva de Refeição &bull; Direct Eventos</div>
                <div className="receipt-card__meta">
                  Pedido {orderId} &bull; {todayLabel}
                </div>
              </div>

              <div className="event-summary-grid" style={{ borderBottom: "1px solid var(--color-border-soft)", paddingBottom: 14, marginBottom: 14 }}>
                <div>
                  <div className="event-summary-item-label">Data da reserva</div>
                  <div className="event-summary-item-value">{consumeDate || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Horário</div>
                  <div className="event-summary-item-value">{consumeTime || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Tipo</div>
                  <div className="event-summary-item-value">{mealType}</div>
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
                  {ci.contents.length > 0 && (
                    <ul className="cart-item__contents" style={{ gridColumn: "1 / -1" }}>
                      {ci.contents.map((c, i) => (
                        <li key={i}>
                          {c.qty}x {c.label}
                        </li>
                      ))}
                    </ul>
                  )}
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
                <span style={{ fontWeight: 700 }}>{paymentLabel}</span>
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

  const clearAll = () => {
    setQtys({});
    showToast("Carrinho limpo.");
  };

  return (
    <Layout>
      <div className="page-container" style={{ paddingTop: 24 }}>
        <button className="order-back-link" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para a página inicial
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26 }}>
          <div className="order-header-icon">RR</div>
          <div>
            <h1 className="order-title">Reserva de Refeição</h1>
            <div className="order-subtitle">Escolha o tipo de refeição, os kits, o horário e a forma de pagamento.</div>
          </div>
        </div>

        <div className="step1-grid">
          <div style={{ minWidth: 0 }}>
            <div className="catalog-heading">1. Tipo de refeição</div>
            <div className="tab-row" style={{ marginBottom: 18 }}>
              {MEAL_TYPES.map((t) => (
                <button key={t} className={mealType === t ? "is-active" : ""} onClick={() => setMealType(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className="catalog-heading">2. Escolha a refeição</div>
            <div className="tab-row" style={{ marginBottom: 18 }}>
              {MEAL_SERVICES.map((m) => (
                <button key={m} className={meal === m ? "is-active" : ""} onClick={() => setMeal(m)}>
                  {m}
                </button>
              ))}
            </div>

            <div className="catalog-heading">3. Escolha os kits</div>
            <div className="kits-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {visibleKits.map((k) => {
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
                      <button className="link" style={{ fontSize: 12, marginBottom: 8 }} onClick={() => setDetailsKitId(k.id)}>
                        Detalhes
                      </button>
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
              {visibleKits.length === 0 && (
                <div className="empty-state">Nenhum kit cadastrado para {mealType.toLowerCase()} em {meal} ainda. Cadastre em Catálogos &rsaquo; Kits.</div>
              )}
            </div>

            <div className="step-card">
              <div className="step-heading">4. Data e horário</div>
              <div className="lanche-fields-grid">
                <label className="field-label">
                  Data
                  <input type="date" value={consumeDate} onChange={(e) => setConsumeDate(e.target.value)} />
                </label>
                <label className="field-label">
                  Horário
                  <input type="time" value={consumeTime} onChange={(e) => setConsumeTime(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="step-card">
              <div className="step-heading">5. Forma de pagamento</div>
              <div className="payment-options">
                <button
                  className="payment-option"
                  style={{ borderColor: paymentMode === "centro" ? "var(--color-primary)" : "var(--color-border)", background: paymentMode === "centro" ? "#f4f6fc" : "#fff" }}
                  onClick={() => setPaymentMode("centro")}
                >
                  <div className="payment-option__icon">💼</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Centro de custo</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Lançado direto no centro de custo do solicitante</div>
                  </div>
                  <div className="payment-option__radio" style={{ borderColor: paymentMode === "centro" ? "var(--color-primary)" : "var(--color-border-input)", background: paymentMode === "centro" ? "var(--color-primary)" : "#fff" }} />
                </button>
                <button
                  className="payment-option"
                  style={{ borderColor: paymentMode === "manual" ? "var(--color-primary)" : "var(--color-border)", background: paymentMode === "manual" ? "#f4f6fc" : "#fff" }}
                  onClick={() => setPaymentMode("manual")}
                >
                  <div className="payment-option__icon">💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Pagamento manual</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Você escolhe Pix, crédito ou débito</div>
                  </div>
                  <div className="payment-option__radio" style={{ borderColor: paymentMode === "manual" ? "var(--color-primary)" : "var(--color-border-input)", background: paymentMode === "manual" ? "var(--color-primary)" : "#fff" }} />
                </button>
              </div>

              {paymentMode === "centro" && (
                <label className="field-label" style={{ marginTop: 14 }}>
                  Centro de custo
                  <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                    <option value="">Selecione o centro de custo</option>
                    {activeCostCenters.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {paymentMode === "manual" && (
                <div className="payment-options" style={{ marginTop: 14 }}>
                  {MANUAL_PAYMENTS.map((p) => {
                    const sel = manualPayment === p.id;
                    return (
                      <button key={p.id} className="payment-option" style={{ borderColor: sel ? "var(--color-primary)" : "var(--color-border)", background: sel ? "#f4f6fc" : "#fff" }} onClick={() => setManualPayment(p.id)}>
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
              )}
            </div>

            <div className="step-card">
              <div className="step-heading">6. Anexo</div>
              <AttachmentsField value={attachments} onChange={setAttachments} />
            </div>
          </div>

          <div className="cart-panel">
            <div className="cart-panel__header">
              <div className="cart-panel__title">Seu pedido</div>
              <button className="cart-panel__clear" onClick={clearAll}>
                Limpar tudo
              </button>
            </div>

            {cartItems.length === 0 && (
              <div className="empty-state">
                Seu carrinho está vazio.
                <br />
                Adicione uma ou mais refeições.
              </div>
            )}

            <div className="cart-items">
              {cartItems.map((ci) => (
                <div key={ci.id} className="cart-item">
                  <div className="cart-item__body">
                    <div className="cart-item__name">{ci.name}</div>
                    {ci.contents.length > 0 && (
                      <ul className="cart-item__contents">
                        {ci.contents.map((c, i) => (
                          <li key={i}>
                            {c.qty}x {c.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="cart-item__row">
                      <div className="qty-stepper qty-stepper--sm">
                        <button onClick={() => setQty(ci.id, ci.qty - 1)}>&minus;</button>
                        <span>{ci.qty}</span>
                        <button onClick={() => setQty(ci.id, ci.qty + 1)}>+</button>
                      </div>
                      <div className="cart-item__price">{money(ci.total)}</div>
                    </div>
                  </div>
                  <button className="cart-item__remove" onClick={() => setQty(ci.id, 0)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-totals">
              <div className="cart-totals__final">
                <span>Total estimado</span>
                <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
              </div>
            </div>
            <div className="cart-note">O valor final poderá ser ajustado conforme confirmação do pedido.</div>

            {hasError && (
              <div className="error-text" style={{ marginTop: 12 }}>
                {errorMsg}
              </div>
            )}

            <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} disabled={totalUnits === 0} onClick={submitOrder}>
              Confirmar reserva
            </button>
          </div>
        </div>
      </div>

      {detailsKitId &&
        (() => {
          const k = reservaKits.find((x) => x.id === detailsKitId);
          if (!k) return null;
          return <KitDetailsModal name={k.name} description={k.description} contents={kitContentsFromCatalog(k, products, serviceCatalog)} onClose={() => setDetailsKitId(null)} />;
        })()}
    </Layout>
  );
}
