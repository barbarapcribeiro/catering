import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Stepper } from "../components/Stepper";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { QrPlaceholder } from "../components/QrPlaceholder";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { LOCATIONS } from "../mock/services";
import "./OrderFlow.css";

const CATEGORIES = [
  { id: "kits", label: "Kits temáticos" },
  { id: "bebidas", label: "Bebidas" },
  { id: "salgados", label: "Salgados" },
  { id: "doces", label: "Doces" },
  { id: "decoracao", label: "Decoração" },
  { id: "outros", label: "Outros" },
];

const OCCASIONS = [
  { id: "aniversariantes", label: "Aniversariantes do Mês", emoji: "🎂" },
  { id: "pais", label: "Dia dos Pais", emoji: "👔" },
  { id: "junina", label: "Festa Junina", emoji: "🌽" },
  { id: "natal", label: "Natal", emoji: "🎄" },
  { id: "happyhour", label: "Happy Hour", emoji: "🍻" },
  { id: "outro", label: "Outro evento", emoji: "🎉" },
];

const KITS = [
  { id: "happyhour", name: "Kit Happy Hour", serves: "Serve até 20 pessoas", desc: "Petiscos, cervejas e drinks sem álcool para uma confraternização descontraída.", price: 300, badge: "HAPPY HOUR", badgeBg: "#b5690f" },
  { id: "aniversariantes", name: "Kit Aniversariantes do Mês", serves: "Serve até 20 pessoas", desc: "Bolo confeitado, salgadinhos, sucos e kit de decoração para comemorar os aniversariantes do mês.", price: 250, badge: "ANIVERSARIANTES", badgeBg: "#283897" },
  { id: "pais", name: "Kit Dia dos Pais", serves: "Serve até 20 pessoas", desc: "Petiscos, cervejas sem álcool e sobremesas para homenagear os pais.", price: 280, badge: "DIA DOS PAIS", badgeBg: "#1a7a4f" },
  { id: "junina", name: "Kit Festa Junina", serves: "Serve até 20 pessoas", desc: "Quentão, pipoca, canjica, pé-de-moleque e milho cozido.", price: 260, badge: "FESTA JUNINA", badgeBg: "#b5690f" },
  { id: "natal", name: "Kit Natal", serves: "Serve até 20 pessoas", desc: "Panetone, ceia leve, espumante sem álcool e decoração natalina.", price: 340, badge: "NATAL", badgeBg: "#c0392b" },
];

const AVULSOS = [
  { id: "quentao", name: "Quentão", unit: "Térmico 1 litro (sem álcool)", min: 1, max: 10, step: 1, price: 22, category: "bebidas" },
  { id: "espumante", name: "Espumante sem álcool", unit: "garrafa 750 ml", min: 1, max: 20, step: 1, price: 28, category: "bebidas" },
  { id: "suco", name: "Suco Natural", unit: "300 ml, sabores variados", min: 3, max: 30, step: 3, price: 8, category: "bebidas" },
  { id: "pipoca", name: "Pipoca", unit: "(porção 50g)", min: 20, max: 150, step: 10, price: 2.5, category: "salgados" },
  { id: "salgados", name: "Mini Salgados", unit: "(100 unidades)", min: 50, max: 200, step: 10, price: 0.9, category: "salgados" },
  { id: "panetone", name: "Mini Panetone", unit: "individual 80g", min: 10, max: 100, step: 10, price: 9, category: "doces" },
  { id: "canjica", name: "Canjica", unit: "copo 150ml", min: 15, max: 90, step: 5, price: 5.5, category: "doces" },
  { id: "decoracao", name: "Kit Decoração Temática", unit: "conjunto para 10 mesas", min: 1, max: 5, step: 1, price: 120, category: "decoracao" },
];

const CC_NAMES: Record<string, string> = { CC001: "Administrativo", CC002: "Comercial", CC003: "Operações" };

const STEP_DEFS = [
  { title: "Produtos", sub: "Escolha e monte seu pedido" },
  { title: "Informações", sub: "Detalhes do evento" },
  { title: "Revisão", sub: "Confira os detalhes" },
  { title: "Finalizar", sub: "Confirmação do pedido" },
];

export function EventoEspecialOrder() {
  const { addOrder, showToast } = useAppData();
  const navigate = useNavigate();

  const [orderId] = useState(() => `#EE-${Math.floor(15200 + Math.random() * 800)}`);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("kits");
  const [occasion, setOccasion] = useState("aniversariantes");
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [people, setPeople] = useState(15);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocal, setEventLocal] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [coffeeInstructions, setCoffeeInstructions] = useState("");
  const [hasDietary, setHasDietary] = useState(false);
  const [dietaryDetails, setDietaryDetails] = useState("");
  const [costCenterSel, setCostCenterSel] = useState<Record<string, boolean>>({});
  const [costCenterPct, setCostCenterPct] = useState<Record<string, number>>({ CC001: 100, CC002: 100, CC003: 100 });
  const [feeInput, setFeeInput] = useState("");

  const redistributePct = (sel: Record<string, boolean>) => {
    const codes = Object.keys(sel).filter((k) => sel[k]);
    if (codes.length === 0) return costCenterPct;
    const base = Math.floor(100 / codes.length);
    const pct = { ...costCenterPct };
    codes.forEach((c, i) => {
      pct[c] = i === codes.length - 1 ? 100 - base * (codes.length - 1) : base;
    });
    return pct;
  };

  const toggleCostCenter = (code: string) => {
    const sel = { ...costCenterSel, [code]: !costCenterSel[code] };
    setCostCenterSel(sel);
    setCostCenterPct(redistributePct(sel));
  };

  const setQty = (id: string, val: number, min: number, max: number) => {
    let v = Math.max(0, val);
    if (v > 0) v = Math.min(max, Math.max(min, v));
    setQtys((s) => ({ ...s, [id]: v }));
  };
  const incQty = (a: (typeof AVULSOS)[number]) => {
    const cur = qtys[a.id] || 0;
    const next = cur === 0 ? a.min : Math.min(a.max, cur + a.step);
    setQty(a.id, next, a.min, a.max);
  };
  const decQty = (a: (typeof AVULSOS)[number]) => {
    const cur = qtys[a.id] || 0;
    if (cur <= a.min) {
      setQty(a.id, 0, a.min, a.max);
      return;
    }
    setQty(a.id, cur - a.step, a.min, a.max);
  };

  const toggleKit = (kitId: string) => setSelectedKit((s) => (s === kitId ? null : kitId));
  const clearAll = () => {
    setSelectedKit(null);
    setQtys({});
    showToast("Carrinho limpo.");
  };

  let avulsosList = AVULSOS;
  if (activeCategory !== "kits") avulsosList = avulsosList.filter((a) => a.category === activeCategory);
  const q = searchQuery.trim().toLowerCase();
  if (q) avulsosList = avulsosList.filter((a) => a.name.toLowerCase().includes(q));

  const cartItems = useMemo(() => {
    const items: { id: string; name: string; sub: string; qty: number; unitPrice: number; total: number; dec: () => void; inc: () => void; remove: () => void }[] = [];
    if (selectedKit) {
      const k = KITS.find((x) => x.id === selectedKit)!;
      items.push({ id: "kit-" + k.id, name: k.name, sub: k.serves, qty: 1, unitPrice: k.price, total: k.price, dec: () => toggleKit(k.id), inc: () => {}, remove: () => toggleKit(k.id) });
    }
    AVULSOS.forEach((a) => {
      const qty = qtys[a.id] || 0;
      if (qty <= 0) return;
      items.push({
        id: a.id,
        name: a.name,
        sub: `${qty} ${a.unit.includes("unidades") ? "unidades" : a.unit}`,
        qty,
        unitPrice: a.price,
        total: a.price * qty,
        dec: () => decQty(a),
        inc: () => incQty(a),
        remove: () => setQty(a.id, 0, a.min, a.max),
      });
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKit, qtys]);

  const subtotal = cartItems.reduce((sum, ci) => sum + ci.total, 0);
  const fee = parseFloat((feeInput || "").replace(",", ".")) || 0;
  const total = subtotal + fee;
  const cartEmpty = cartItems.length === 0;

  const selCodes = Object.keys(costCenterSel).filter((k) => costCenterSel[k]);
  const multiSel = selCodes.length > 1;
  const pctTotal = selCodes.reduce((sum, c) => sum + (costCenterPct[c] || 0), 0);
  const pctTotalInvalid = multiSel && pctTotal !== 100;
  const noCostCenter = selCodes.length === 0;
  const step3Invalid = noCostCenter || pctTotalInvalid;

  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const continueOrder = () => {
    setStep(2);
    showToast("Itens salvos! Prossiga com as informações do evento.");
  };
  const continueToStep3 = () => {
    setStep(3);
    showToast("Informações do evento salvas!");
  };
  const continueToStep4 = () => {
    addOrder({
      id: orderId,
      category: "Evento Especial",
      type: eventName || "Evento Especial",
      mono: "EE",
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
      pickupDate,
      pickupTime,
      coffeeInstructions,
      dietaryRestrictions: hasDietary ? dietaryDetails || "Sim, sem detalhes" : "Nenhuma",
      costCenters: selCodes.map((code) => ({ code, percent: multiSel ? costCenterPct[code] : 100 })),
      requiresApproval: needsApproval,
    });
    setStep(4);
    showToast("Faturamento confirmado!");
  };

  return (
    <Layout chat>
      <div className="page-container" style={{ paddingTop: 24 }}>
        <button className="order-back-link" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para a página inicial
        </button>

        <div className="order-header-bar">
          <div className="order-header-left">
            <div className="order-header-icon">EE</div>
            <div>
              <h1 className="order-title">Novo Evento Especial</h1>
              <div className="order-subtitle">Organize datas comemorativas com facilidade: Dia dos Pais, Festa Junina, Natal e mais.</div>
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
              <div className="catalog-heading">1. Escolha a data comemorativa</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
                {OCCASIONS.map((oc) => {
                  const sel = occasion === oc.id;
                  return (
                    <button
                      key={oc.id}
                      onClick={() => setOccasion(oc.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: `1px solid ${sel ? "#283897" : "#d3dae6"}`,
                        background: sel ? "#283897" : "#fff",
                        color: sel ? "#fff" : "#46526a",
                      }}
                    >
                      <span>{oc.emoji}</span>
                      {oc.label}
                    </button>
                  );
                })}
              </div>

              <div className="catalog-heading">2. Escolha um kit ou adicione itens avulsos</div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="catalog-search">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4-4" />
                  </svg>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar produtos, kits ou ingredientes..." />
                </div>
              </div>

              <div className="category-chips">
                {CATEGORIES.map((c) => (
                  <button key={c.id} className={activeCategory === c.id ? "is-active" : ""} onClick={() => setActiveCategory(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>

              {activeCategory === "kits" && (
                <>
                  <div className="kits-heading-row">
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>Kits de Coffee Break</div>
                    <span className="pill-tag">Kits prontos para facilitar sua escolha</span>
                  </div>
                  <div className="kits-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    {KITS.map((k) => {
                      const selected = selectedKit === k.id;
                      return (
                        <div key={k.id} className="kit-card">
                          <div className="kit-card__image-wrap">
                            <ImagePlaceholder label="Imagem do kit" style={{ width: "100%", height: 120, borderRadius: 0 }} />
                            <span className="kit-card__badge" style={{ background: k.badgeBg }}>
                              {k.badge}
                            </span>
                          </div>
                          <div className="kit-card__body">
                            <div className="kit-card__name">{k.name}</div>
                            <div className="kit-card__serves">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d8798" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                <path d="M16 3.13a4 4 0 010 7.75" />
                              </svg>
                              {k.serves}
                            </div>
                            <div className="kit-card__desc">{k.desc}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <div className="kit-card__price">{money(k.price)}</div>
                              <button
                                className="kit-card__btn"
                                style={{ background: selected ? "var(--color-primary)" : "#fff", color: selected ? "#fff" : "var(--color-primary)" }}
                                onClick={() => toggleKit(k.id)}
                              >
                                {selected ? "Selecionado" : "Adicionar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="catalog-heading">{activeCategory === "kits" ? "Produtos avulsos" : "Resultados"}</div>
              {avulsosList.length === 0 && <div className="empty-state">Nenhum produto encontrado.</div>}
              <div className="avulsos-grid">
                {avulsosList.map((a) => {
                  const qty = qtys[a.id] || 0;
                  const bulkPriceLabel = money(a.price * (a.step >= 5 ? 10 : 1)) + (a.step >= 5 ? " / 10un" : "");
                  return (
                    <div key={a.id} className="avulso-card">
                      <ImagePlaceholder label="Imagem" style={{ width: 56, height: 56 }} className="avulso-card__img" />
                      <div className="avulso-card__body">
                        <div className="avulso-name">{a.name}</div>
                        <div className="avulso-unit">{a.unit}</div>
                        <div className="avulso-minmax">
                          Mín. {a.min} &bull; Máx. {a.max}
                        </div>
                        <div className="avulso-footer">
                          <div className="avulso-price">{bulkPriceLabel}</div>
                          <div className="qty-stepper">
                            <button onClick={() => decQty(a)}>&minus;</button>
                            <span>{qty}</span>
                            <button onClick={() => incQty(a)}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="quick-info-card">
                <div className="quick-info-header">
                  <div className="quick-info-header-title">
                    3. Informações rápidas do evento <span className="quick-info-header-hint">(preencha após escolher os produtos)</span>
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
                  <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Ex.: Reunião de Diretoria, Confraternização..." />
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
                    <input type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, parseInt(e.target.value) || 1))} />
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
                  Adicione um kit ou itens avulsos.
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
                <div className="cart-totals__row">
                  <span>Taxa de serviço</span>
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

              <div className="step-card-divider step-card-grid2">
                <label className="field-label">
                  Data de recolhimento dos utensílios
                  <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                </label>
                <label className="field-label">
                  Horário de recolhimento
                  <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                </label>
              </div>

              <label className="field-label step-card-divider">
                Instruções para o café <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <textarea rows={3} placeholder="Ex: montar às 8h30, servir gelo à parte..." value={coffeeInstructions} onChange={(e) => setCoffeeInstructions(e.target.value)} />
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
                  <span>Taxa de serviço</span>
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
                  <div className="event-summary-item-label">Recolhimento dos utensílios</div>
                  <div className="event-summary-item-value">{pickupDate || pickupTime ? `${pickupDate || "—"} ${pickupTime || ""}` : "Não informado"}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Restrições alimentares</div>
                  <div className="event-summary-item-value">{hasDietary ? dietaryDetails || "Sim, sem detalhes" : "Nenhuma"}</div>
                </div>
              </div>
              {coffeeInstructions && (
                <div className="step-card-divider" style={{ marginTop: 14 }}>
                  <div className="event-summary-item-label">Instruções para o café</div>
                  <div className="event-summary-item-value">{coffeeInstructions}</div>
                </div>
              )}
              <button className="edit-link" onClick={() => setStep(2)}>
                Editar informações do evento
              </button>
            </div>

            <div className="step-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Dados de faturamento</div>
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>Selecione um ou mais centros de custo. Ao selecionar mais de um, informe o percentual de cada um.</div>
              <div className="cost-center-list">
                {Object.keys(CC_NAMES).map((code) => {
                  const checked = !!costCenterSel[code];
                  return (
                    <div key={code} className="cost-center-item" style={{ borderColor: checked ? "var(--color-primary)" : "var(--color-border)", background: checked ? "#f4f6fc" : "#fff" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCostCenter(code)} />
                      <div style={{ flex: 1 }}>
                        <div className="cost-center-item__code">{code}</div>
                        <div className="cost-center-item__name">{CC_NAMES[code]}</div>
                      </div>
                      {checked && multiSel && (
                        <div className="cost-center-pct">
                          <input type="number" min={0} max={100} value={costCenterPct[code]} onChange={(e) => setCostCenterPct((s) => ({ ...s, [code]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))} />
                          <span>%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {multiSel && (
                <div className="pct-total-row" style={{ color: pctTotalInvalid ? "var(--color-danger)" : "var(--color-success)" }}>
                  Total: {pctTotal}%{pctTotalInvalid && <span style={{ fontWeight: 400 }}>(deve somar 100%)</span>}
                </div>
              )}
              {noCostCenter && <div className="error-text">Selecione ao menos um centro de custo.</div>}
            </div>

            <div className="step-actions">
              <button className="btn btn--outline" onClick={() => setStep(2)}>
                Voltar
              </button>
              <button className="btn btn--primary" disabled={step3Invalid} onClick={continueToStep4}>
                Continuar para finalizar
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step4-grid">
            <div className="confirmation-card">
              <div className="confirmation-header">
                <div className="confirmation-icon">✓</div>
                <div>
                  <div className="confirmation-title">Pedido confirmado!</div>
                  <div className="confirmation-meta">
                    Pedido {orderId} &bull; enviado em {todayLabel}
                  </div>
                </div>
              </div>
              <div className="confirmation-summary">
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
                <div>
                  <div className="event-summary-item-label">Valor total</div>
                  <div className="event-summary-item-value" style={{ fontWeight: 800, color: "var(--color-primary)" }}>
                    {money(total)}
                  </div>
                </div>
              </div>
              <div className="confirmation-cost-centers">
                <div className="confirmation-cost-centers-label">Centro(s) de custo</div>
                {selCodes.map((code) => (
                  <div key={code} className="confirmation-cost-center-row">
                    <span style={{ fontWeight: 600 }}>
                      {code} &bull; {CC_NAMES[code]}
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{multiSel ? `${costCenterPct[code]}%` : "100%"}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn--outline" style={{ marginTop: 24 }} onClick={() => navigate("/")}>
                Voltar para a página inicial
              </button>
            </div>

            <div className="ticket-card">
              <div className="ticket-mono">EE</div>
              <div className="ticket-title">Ticket de acesso</div>
              <div className="ticket-id">Pedido {orderId}</div>
              <QrPlaceholder />
              <div className="ticket-hint">Escaneie o código para avaliar o atendimento após o consumo.</div>
              <div className="ticket-print-row">
                <button className="btn btn--primary btn--full" onClick={() => window.print()}>
                  🖨️ Imprimir ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
