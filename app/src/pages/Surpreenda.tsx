import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Stepper } from "../components/Stepper";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { AttachmentsField } from "../components/AttachmentsField";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { LOCATIONS } from "../mock/services";
import type { OrderAttachment } from "../types";
import "./OrderFlow.css";
import "./Surpreenda.css";

const KITS = [
  { id: "manha", name: "Kit Café da Manhã", desc: "Pães, frios, frutas, bolos, café, leite e sucos para começar o dia.", price: 180, badge: "CAFÉ DA MANHÃ", badgeBg: "#b5690f" },
  { id: "tarde", name: "Kit Café da Tarde", desc: "Bolos, biscoitos, salgados assados, café e chás para a pausa da tarde.", price: 170, badge: "CAFÉ DA TARDE", badgeBg: "#1a7a4f" },
  { id: "horaextra", name: "Kit Hora Extra", desc: "Lanches reforçados, sanduíches, sucos e café para quem fica além do horário.", price: 190, badge: "HORA EXTRA", badgeBg: "#2c5f8a" },
  { id: "aniversariante", name: "Kit Aniversariante", desc: "Bolo confeitado, salgadinhos, doces e refrigerantes para celebrar.", price: 220, badge: "ANIVERSARIANTE", badgeBg: "var(--color-primary)" },
];

const PAYMENTS = [
  { id: "credito", label: "Cartão de crédito", sub: "Pagamento na entrega, com maquininha", emoji: "💳" },
  { id: "debito", label: "Cartão de débito", sub: "Pagamento na entrega, com maquininha", emoji: "💳" },
  { id: "pix", label: "Pix", sub: "QR Code exibido no recibo", emoji: "⚡" },
];

const STEP_DEFS = [
  { title: "Kits", sub: "Escolha seus kits" },
  { title: "Informações", sub: "Detalhes do evento" },
  { title: "Revisão", sub: "Confira os detalhes" },
  { title: "Pagamento", sub: "Crédito, débito ou Pix" },
  { title: "Finalizar", sub: "Recibo do pedido" },
];

export function Surpreenda() {
  const { addOrder, showToast, costCenters, serviceParameters } = useAppData();
  const navigate = useNavigate();
  const activeCostCenters = costCenters.filter((c) => c.active);
  const linkedCostCenterCode = serviceParameters.find((s) => s.category === "Surpreenda")?.linkedCostCenterCode;

  const [orderId] = useState(() => `#SP-${Math.floor(15200 + Math.random() * 800)}`);
  const [step, setStep] = useState(1);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [people, setPeople] = useState(8);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocal, setEventLocal] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [obs, setObs] = useState("");
  const [hasDietary, setHasDietary] = useState(false);
  const [dietaryDetails, setDietaryDetails] = useState("");
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [payment, setPayment] = useState<string | null>(null);
  const [feeInput, setFeeInput] = useState("");
  const [costCenter, setCostCenter] = useState("");

  useEffect(() => {
    if (!costCenter && linkedCostCenterCode) setCostCenter(linkedCostCenterCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedCostCenterCode]);
  const [costCenterMenuOpen, setCostCenterMenuOpen] = useState(false);

  const setQty = (id: string, v: number) => setQtys((s) => ({ ...s, [id]: Math.max(0, v) }));

  const clearAll = () => {
    setQtys({});
    showToast("Carrinho limpo.");
  };

  const cartItems = useMemo(
    () =>
      KITS.filter((k) => (qtys[k.id] || 0) > 0).map((k) => {
        const qty = qtys[k.id];
        return {
          id: k.id,
          name: k.name,
          sub: `${qty} ${qty > 1 ? "kits" : "kit"} • mín. 8 pessoas`,
          qty,
          unitPrice: k.price,
          total: k.price * qty,
          inc: () => setQty(k.id, qty + 1),
          dec: () => setQty(k.id, qty - 1),
          remove: () => setQty(k.id, 0),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qtys],
  );

  const subtotal = cartItems.reduce((sum, ci) => sum + ci.total, 0);
  const fee = parseFloat((feeInput || "").replace(",", ".")) || 0;
  const total = subtotal + fee;
  const cartEmpty = cartItems.length === 0;
  const noPayment = !payment;
  const paymentDef = PAYMENTS.find((p) => p.id === payment);

  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const continueOrder = () => {
    setStep(2);
    showToast("Kits salvos! Prossiga com as informações do evento.");
  };
  const continueToStep3 = () => {
    setStep(3);
    showToast("Informações do evento salvas!");
  };
  const continueToStep5 = () => {
    addOrder({
      id: orderId,
      category: "Surpreenda",
      type: eventName || "Surpreenda",
      mono: "SP",
      qty: `${people} pessoas`,
      peopleCount: people,
      datetime: `${eventDate || "A definir"} ${eventTime || ""}`.trim(),
      status: needsApproval ? "Aguardando aprovação" : "Solicitado",
      value: money(total),
      valueNumber: total,
      items: cartItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.unitPrice })),
      eventName,
      location: eventLocal,
      eventTime,
      dietaryRestrictions: hasDietary ? dietaryDetails || "Sim, sem detalhes" : "Nenhuma",
      notes: obs,
      costCenters: [{ code: costCenter, percent: 100 }],
      requiresApproval: needsApproval,
      attachments: attachments.length ? attachments : undefined,
    });
    setStep(5);
    showToast("Pedido finalizado com sucesso!");
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

        <div className="order-header-bar">
          <div className="order-header-left">
            <div className="order-header-icon">SP</div>
            <div>
              <h1 className="order-title">Surpreenda</h1>
              <div className="order-subtitle">Kits prontos para surpreender sua equipe: café da manhã, café da tarde, hora extra e aniversariantes.</div>
            </div>
          </div>
          <div className="order-header-right">
            <span className="order-draft-badge">Rascunho salvo</span>
            <div className="order-id-label">Pedido {orderId}</div>
          </div>
        </div>

        <Stepper steps={STEP_DEFS} current={step} />

        {step === 1 && (
          <div className="step1-grid">
            <div style={{ minWidth: 0 }}>
              <div className="kits-heading-row">
                <div className="catalog-heading" style={{ marginBottom: 0 }}>1. Escolha seus kits</div>
                <span className="pill-tag">Todos os kits atendem no mínimo 8 pessoas</span>
              </div>
              <div className="kits-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {KITS.map((k) => {
                  const qty = qtys[k.id] || 0;
                  return (
                    <div key={k.id} className="kit-card" style={{ borderColor: qty > 0 ? "var(--color-primary)" : "var(--color-border)" }}>
                      <div className="kit-card__image-wrap">
                        <ImagePlaceholder label="Imagem do kit" style={{ width: "100%", height: 130, borderRadius: 0 }} />
                        <span className="kit-card__badge" style={{ background: k.badgeBg }}>
                          {k.badge}
                        </span>
                      </div>
                      <div className="kit-card__body">
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{k.name}</div>
                        <div className="kit-card__serves">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87" />
                            <path d="M16 3.13a4 4 0 010 7.75" />
                          </svg>
                          Mínimo 8 pessoas
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--color-text-secondary)", lineHeight: 1.45, marginBottom: 12, minHeight: 36 }}>{k.desc}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{money(k.price)}</div>
                          <div className="qty-stepper">
                            <button onClick={() => setQty(k.id, qty - 1)}>&minus;</button>
                            <span>{qty}</span>
                            <button onClick={() => setQty(k.id, qty + 1)}>+</button>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#a6afc0" }}>Preço por kit &bull; serve 8 pessoas</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="quick-info-card">
                <div className="quick-info-header">
                  <div className="quick-info-header-title">
                    2. Informações rápidas do evento <span className="quick-info-header-hint">(preencha após escolher os kits)</span>
                  </div>
                  <label className="approval-check">
                    <input type="checkbox" checked={needsApproval} onChange={(e) => setNeedsApproval(e.target.checked)} />
                    <span>Requer aprovação</span>
                  </label>
                </div>
                <div className="sla-banner">
                  <span>⏱️</span>
                  <div>Esse pedido precisa de no mínimo 48h úteis para serem aceitos para produção. Caso precise de outro prazo ou itens não constantes aqui, nos chame no chat ao lado.</div>
                </div>
                <label className="field-boxed">
                  Nome do evento
                  <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Ex.: Café da equipe, Aniversariantes de agosto..." />
                </label>
                <div className="field-boxed-grid">
                  <label className="field-boxed">
                    Data do evento
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </label>
                  <label className="field-boxed">
                    <span className="field-boxed-hint">
                      Horário do evento
                      <span className="info-dot" title="Esse é o horário que o evento será entregue, a montagem acontece 30min antes">
                        i
                      </span>
                    </span>
                    <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  </label>
                  <div style={{ position: "relative" }}>
                    <label className="field-boxed" style={{ cursor: "pointer" }} onClick={() => setLocalMenuOpen((v) => !v)}>
                      Local de entrega
                      <div className="field-boxed-value" style={{ color: eventLocal ? "var(--color-text)" : "var(--color-text-muted)" }}>
                        {eventLocal || "Selecionar local"}
                      </div>
                    </label>
                    {localMenuOpen && (
                      <div className="location-dropdown">
                        {LOCATIONS.map((name) => (
                          <button
                            key={name}
                            onClick={() => {
                              setEventLocal(name);
                              setLocalMenuOpen(false);
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <label className="field-boxed">
                    Nº de pessoas
                    <input type="number" min={8} value={people} onChange={(e) => setPeople(Math.max(8, parseInt(e.target.value) || 8))} />
                  </label>
                </div>
                <div className="info-note">
                  <span>&#8505;</span>
                  <div>Você poderá revisar todos os detalhes na próxima etapa.</div>
                </div>
              </div>
            </div>

            <div className="cart-panel">
              <div className="cart-panel__header">
                <div className="cart-panel__title">Seu pedido</div>
                <button className="cart-panel__clear" onClick={clearAll}>
                  Limpar tudo
                </button>
              </div>
              <div className="cart-panel__people">
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  {people} pessoas
                </span>
              </div>

              {cartEmpty && (
                <div className="empty-state">
                  Seu carrinho está vazio.
                  <br />
                  Adicione um ou mais kits.
                </div>
              )}

              <div className="cart-items">
                {cartItems.map((ci) => (
                  <div key={ci.id} className="cart-item">
                    <ImagePlaceholder label="" style={{ width: 44, height: 44 }} className="cart-item__img" />
                    <div className="cart-item__body">
                      <div className="cart-item__name">{ci.name}</div>
                      <div className="cart-item__sub">{ci.sub}</div>
                      <div className="cart-item__row">
                        <div className="qty-stepper qty-stepper--sm">
                          <button onClick={ci.dec}>&minus;</button>
                          <span>{ci.qty}</span>
                          <button onClick={ci.inc}>+</button>
                        </div>
                        <div className="cart-item__price">{money(ci.total)}</div>
                      </div>
                    </div>
                    <button className="cart-item__remove" onClick={ci.remove}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-totals">
                <div className="cart-totals__row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="cart-totals__row" style={{ alignItems: "center" }}>
                  <span>Taxa de serviço e/ou frete</span>
                  <input
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    placeholder="R$ 0,00"
                    style={{ width: 100, textAlign: "right", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--color-border-input)", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div className="cart-totals__final">
                  <span>Total estimado</span>
                  <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
                </div>
              </div>
              <div className="cart-note">O valor final poderá ser ajustado conforme confirmação do pedido.</div>

              <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} disabled={cartEmpty} onClick={continueOrder}>
                Continuar para informações
              </button>
              <button className="btn btn--outline btn--full" style={{ marginTop: 10 }} onClick={() => showToast("Pedido salvo como rascunho.")}>
                Salvar para depois
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-narrow">
            <div className="step-heading">2. Informações do evento</div>

            <div className="step-card">
              <div className="step-card-label">Definidos na etapa anterior</div>
              <div className="step-card-grid2">
                <label className="field-label">
                  Data do evento
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </label>
                <div style={{ position: "relative" }}>
                  <label className="field-label" style={{ cursor: "pointer" }} onClick={() => setLocalMenuOpen((v) => !v)}>
                    Local de entrega
                    <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border-input)", fontSize: 13, fontWeight: 600, color: eventLocal ? "var(--color-text)" : "var(--color-text-muted)", boxSizing: "border-box" }}>
                      {eventLocal || "Selecionar local"}
                    </div>
                  </label>
                  {localMenuOpen && (
                    <div className="location-dropdown">
                      {LOCATIONS.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            setEventLocal(name);
                            setLocalMenuOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="step-card step-card-flex">
              <div className="step-card-grid2">
                <label className="field-label">
                  <span className="field-boxed-hint">
                    Horário do evento
                    <span className="info-dot" title="Esse é o horário que o evento será entregue, a montagem acontece 30min antes">
                      i
                    </span>
                  </span>
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                </label>
              </div>

              <label className="field-label step-card-divider">
                Observações <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <textarea rows={3} placeholder="Ex: montar às 8h30, entregar na copa do 2º andar..." value={obs} onChange={(e) => setObs(e.target.value)} />
              </label>

              <div className="step-card-divider">
                <div className="field-label" style={{ marginBottom: 10 }}>
                  Há restrições alimentares?
                </div>
                <div className="dietary-chips">
                  <button className={hasDietary ? "is-active" : ""} onClick={() => setHasDietary(true)}>
                    Sim
                  </button>
                  <button className={!hasDietary ? "is-active" : ""} onClick={() => { setHasDietary(false); setDietaryDetails(""); }}>
                    Não
                  </button>
                </div>
                {hasDietary && (
                  <textarea rows={2} placeholder="Descreva as restrições (ex: vegetariano, sem lactose, alergia a nozes...)" value={dietaryDetails} onChange={(e) => setDietaryDetails(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border-input)", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", resize: "none" }} />
                )}
              </div>

              <div className="step-card-divider">
                <AttachmentsField value={attachments} onChange={setAttachments} />
              </div>
            </div>

            <div className="step-actions">
              <button className="btn btn--outline" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button className="btn btn--primary" onClick={continueToStep3}>
                Continuar para revisão
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-wide">
            <div className="step-heading">3. Revisão do pedido</div>

            <div className="invoice-card">
              <div className="invoice-header">
                <div>
                  <div className="invoice-header-title">Resumo do pedido</div>
                  <div className="invoice-header-id">Pedido {orderId}</div>
                </div>
                <div className="invoice-header-date">
                  Emitido em
                  <br />
                  <strong style={{ color: "var(--color-text)" }}>{todayLabel}</strong>
                </div>
              </div>
              <div className="invoice-table-head">
                <div>Item</div>
                <div>Qtd.</div>
                <div>Unit.</div>
                <div>Total</div>
              </div>
              {cartItems.map((ci) => (
                <div key={ci.id} className="invoice-row">
                  <div className="invoice-row__name">{ci.name}</div>
                  <div className="invoice-row__muted">{ci.qty}</div>
                  <div className="invoice-row__muted">{money(ci.unitPrice)}</div>
                  <div className="invoice-row__total">{money(ci.total)}</div>
                </div>
              ))}
              <div className="invoice-totals">
                <div className="invoice-totals__row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="invoice-totals__row" style={{ alignItems: "center" }}>
                  <span>Taxa de serviço e/ou frete</span>
                  <input
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    placeholder="R$ 0,00"
                    style={{ width: 100, textAlign: "right", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--color-border-input)", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div className="invoice-totals__final">
                  <span>Total</span>
                  <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
                </div>
              </div>
            </div>

            <div className="step-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Dados do evento</div>
              <div className="event-summary-grid">
                <div>
                  <div className="event-summary-item-label">Nome do evento</div>
                  <div className="event-summary-item-value">{eventName || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Data do evento</div>
                  <div className="event-summary-item-value">{eventDate || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Horário do evento</div>
                  <div className="event-summary-item-value">{eventTime || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Local de entrega</div>
                  <div className="event-summary-item-value">{eventLocal || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Nº de pessoas</div>
                  <div className="event-summary-item-value">{people}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Restrições alimentares</div>
                  <div className="event-summary-item-value">{hasDietary ? dietaryDetails || "Sim, sem detalhes" : "Nenhuma"}</div>
                </div>
              </div>
              <button className="edit-link" onClick={() => setStep(2)}>
                Editar informações do evento
              </button>
            </div>

            <div className="step-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Centro de custo</div>
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>Selecione o centro de custo ao qual este pedido será atribuído.</div>
              <div style={{ position: "relative", maxWidth: 360 }}>
                <div
                  onClick={() => setCostCenterMenuOpen((v) => !v)}
                  style={{ cursor: "pointer", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border-input)", fontSize: 13, fontWeight: 600, color: costCenter ? "var(--color-text)" : "var(--color-text-muted)", boxSizing: "border-box" }}
                >
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
              {!costCenter && <div className="error-text">Selecione um centro de custo.</div>}
            </div>

            <div className="step-actions">
              <button className="btn btn--outline" onClick={() => setStep(2)}>
                Voltar
              </button>
              <button className="btn btn--primary" disabled={!costCenter} onClick={() => setStep(4)}>
                Continuar para pagamento
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-narrow">
            <div className="step-heading">4. Forma de pagamento</div>

            <div className="step-card">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                <span>Taxa de serviço e/ou frete</span>
                <span>{money(fee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800, borderTop: "1px solid var(--color-border-soft)", paddingTop: 10, marginTop: 6 }}>
                <span>Total a pagar</span>
                <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
              </div>
            </div>

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

            {payment === "pix" && (
              <div className="payment-note">O QR Code do Pix será exibido no recibo, na próxima etapa. O pedido é confirmado após a identificação do pagamento.</div>
            )}
            {(payment === "credito" || payment === "debito") && (
              <div className="payment-note">O pagamento com cartão será realizado na entrega, com maquininha.</div>
            )}

            <div className="step-actions">
              <button className="btn btn--outline" onClick={() => setStep(3)}>
                Voltar
              </button>
              <button className="btn btn--primary" disabled={noPayment} onClick={continueToStep5}>
                Finalizar pedido
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
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
                <div className="receipt-card__title">Surpreenda &bull; Direct Eventos</div>
                <div className="receipt-card__meta">
                  Pedido {orderId} &bull; {todayLabel}
                </div>
              </div>

              <div className="event-summary-grid" style={{ borderBottom: "1px solid var(--color-border-soft)", paddingBottom: 14, marginBottom: 14 }}>
                <div>
                  <div className="event-summary-item-label">Evento</div>
                  <div className="event-summary-item-value">{eventName || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Data e horário</div>
                  <div className="event-summary-item-value">
                    {eventDate || "Não informado"} &bull; {eventTime || "Não informado"}
                  </div>
                </div>
                <div>
                  <div className="event-summary-item-label">Local de entrega</div>
                  <div className="event-summary-item-value">{eventLocal || "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Nº de pessoas</div>
                  <div className="event-summary-item-value">{people}</div>
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
                <div className="invoice-totals__row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="invoice-totals__row">
                  <span>Taxa de serviço e/ou frete</span>
                  <span>{money(fee)}</span>
                </div>
                <div className="invoice-totals__final">
                  <span>Total pago</span>
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
        )}
      </div>
    </Layout>
  );
}
