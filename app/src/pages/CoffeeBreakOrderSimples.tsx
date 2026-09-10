import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { QrPlaceholder } from "../components/QrPlaceholder";
import { PathIcon } from "../components/Icon";
import { AttachmentsField } from "../components/AttachmentsField";
import { KitDetailsModal } from "../components/KitDetailsModal";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { CopaLocationFields } from "../components/CopaLocationFields";
import type { OrderAttachment, ProductType } from "../types";
import "./OrderFlow.css";

/**
 * Protótipo (P1 do backlog de adoção): a mesma solicitação de Coffee Break,
 * mas numa tela só em vez do wizard de 4 etapas — com valores óbvios já
 * assumidos (centro de custo único pré-selecionado, "requer aprovação"
 * desligado por padrão) e o que é opcional escondido atrás de "Mais opções".
 * Ver CoffeeBreakOrder.tsx para o fluxo em produção.
 */

const CATEGORIES = [
  { id: "kits", label: "Kits de Coffee Break" },
  { id: "bebidas", label: "Bebidas" },
  { id: "salgados", label: "Salgados" },
  { id: "doces", label: "Doces" },
  { id: "paes", label: "Pães e Bolos" },
  { id: "frutas", label: "Frutas" },
  { id: "outros", label: "Outros" },
];

const TYPE_TO_CATEGORY: Record<ProductType, string> = {
  Bebida: "bebidas",
  Salgado: "salgados",
  Doce: "doces",
  "Pão e Bolo": "paes",
  Fruta: "frutas",
  Descartável: "outros",
  Outro: "outros",
};

const KITS = [
  {
    id: "exec",
    name: "Coffee Executivo",
    serves: "Serve até 20 pessoas",
    desc: "Seleção clássica com bebidas quentes, frias e acompanhamentos.",
    price: 240,
    badge: "MAIS VENDIDO",
    badgeBg: "#1a7a4f",
    items: [
      { label: "Café e chá (garrafas térmicas)", qty: 2 },
      { label: "Suco de frutas (jarras)", qty: 2 },
      { label: "Água mineral", qty: 20 },
      { label: "Mini sanduíches variados", qty: 20 },
      { label: "Bolo caseiro (fatias)", qty: 20 },
      { label: "Frutas da estação", qty: 10 },
    ],
  },
  {
    id: "premium",
    name: "Coffee Premium",
    serves: "Serve até 20 pessoas",
    desc: "Opção sofisticada com mais variedades e itens especiais.",
    price: 320,
    badge: "RECOMENDADO",
    badgeBg: "var(--color-primary)",
    items: [
      { label: "Café espresso e cappuccino", qty: 2 },
      { label: "Suco natural (jarras)", qty: 2 },
      { label: "Água mineral", qty: 20 },
      { label: "Salgados finos variados", qty: 24 },
      { label: "Doces gourmet", qty: 20 },
      { label: "Tábua de frios e queijos", qty: 1 },
      { label: "Frutas selecionadas", qty: 12 },
    ],
  },
  {
    id: "economico",
    name: "Coffee Econômico",
    serves: "Serve até 20 pessoas",
    desc: "Ideal para eventos rápidos com ótimo custo-benefício.",
    price: 180,
    badge: "MELHOR CUSTO",
    badgeBg: "#b5690f",
    items: [
      { label: "Café e água (garrafas térmicas)", qty: 2 },
      { label: "Suco em caixinha", qty: 20 },
      { label: "Salgados assados", qty: 20 },
      { label: "Bolo simples (fatias)", qty: 20 },
    ],
  },
];

export function CoffeeBreakOrderSimples() {
  const { addOrder, showToast, products, serviceParameters, orders, currentUser, costCenters, locations, copas } = useAppData();
  const svcParams = serviceParameters.find((s) => s.category === "Coffee Break");
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const repeatOrderId = (routerLocation.state as { repeatOrderId?: string } | null)?.repeatOrderId;
  const avulsoProducts = products.filter((p) => p.active && (p.pages ?? []).includes("Coffee Break"));

  const [orderId] = useState(() => `#CB-${Math.floor(15200 + Math.random() * 800)}`);
  const [confirmed, setConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("kits");
  const [selectedKit, setSelectedKit] = useState<string | null>("exec");
  const [detailsKitId, setDetailsKitId] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [people, setPeople] = useState(15);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [branchId, setBranchId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [copaId, setCopaId] = useState("");
  const [routingBlocked, setRoutingBlocked] = useState(false);

  const [showMore, setShowMore] = useState(false);
  const [eventName, setEventName] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [coffeeInstructions, setCoffeeInstructions] = useState("");
  const [hasDietary, setHasDietary] = useState(false);
  const [dietaryDetails, setDietaryDetails] = useState("");
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);

  const [costCenterCode, setCostCenterCode] = useState("");
  const [splitCostCenter, setSplitCostCenter] = useState(false);
  const [costCenterSel, setCostCenterSel] = useState<Record<string, boolean>>({});
  const [costCenterPct, setCostCenterPct] = useState<Record<string, number>>({});
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const allowedCostCenters = costCenters.filter(
    (c) => c.active && (!currentUser?.costCenterCodes?.length || currentUser.costCenterCodes.includes(c.code)) && (!branchId || !c.branchId || c.branchId === branchId),
  );

  // Menos uma decisão: se sobra só um centro de custo elegível, já vem selecionado.
  useEffect(() => {
    if (costCenterCode && allowedCostCenters.some((c) => c.code === costCenterCode)) return;
    setCostCenterCode(allowedCostCenters[0]?.code ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedCostCenters.map((c) => c.code).join(",")]);

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

  const setQty = (id: string, val: number) => setQtys((s) => ({ ...s, [id]: Math.max(0, val) }));
  const incQty = (p: (typeof avulsoProducts)[number]) => setQty(p.id, (qtys[p.id] || 0) + 1);
  const decQty = (p: (typeof avulsoProducts)[number]) => setQty(p.id, (qtys[p.id] || 0) - 1);
  const toggleKit = (kitId: string) => setSelectedKit((s) => (s === kitId ? null : kitId));
  const clearAll = () => {
    setSelectedKit(null);
    setQtys({});
    showToast("Carrinho limpo.");
  };

  useEffect(() => {
    if (!repeatOrderId) return;
    const source = orders.find((o) => o.id === repeatOrderId);
    if (!source) return;
    const nextQtys: Record<string, number> = {};
    let matchedKit: string | null = null;
    (source.items ?? []).forEach((it) => {
      if (it.productId) nextQtys[it.productId] = it.qty;
      else {
        const kit = KITS.find((k) => k.name === it.name);
        if (kit) matchedKit = kit.id;
      }
    });
    setQtys(nextQtys);
    setSelectedKit(matchedKit);
    if (source.eventName) setEventName(source.eventName);
    if (source.branchId) setBranchId(source.branchId);
    if (source.locationId) setLocationId(source.locationId);
    if (source.copaId) setCopaId(source.copaId);
    if (source.peopleCount) setPeople(source.peopleCount);
    if (source.costCenters && source.costCenters.length > 0) setCostCenterCode(source.costCenters[0].code);
    showToast("Carrinho preenchido com os itens do pedido anterior. Revise e confirme.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOrderId]);

  let avulsosList = avulsoProducts;
  if (activeCategory !== "kits") avulsosList = avulsosList.filter((p) => TYPE_TO_CATEGORY[p.type] === activeCategory);
  const q = searchQuery.trim().toLowerCase();
  if (q) avulsosList = avulsosList.filter((p) => p.name.toLowerCase().includes(q));

  const cartItems = useMemo(() => {
    const items: { id: string; name: string; sub: string; qty: number; unitPrice: number; total: number; productId?: string; contents?: { label: string; qty: number }[]; dec: () => void; inc: () => void; remove: () => void }[] = [];
    if (selectedKit) {
      const k = KITS.find((x) => x.id === selectedKit)!;
      items.push({ id: "kit-" + k.id, name: k.name, sub: k.serves, qty: 1, unitPrice: k.price, total: k.price, contents: k.items, dec: () => toggleKit(k.id), inc: () => {}, remove: () => toggleKit(k.id) });
    }
    avulsoProducts.forEach((p) => {
      const qty = qtys[p.id] || 0;
      if (qty <= 0) return;
      items.push({ id: p.id, name: p.name, sub: `${qty} ${p.unit}`, qty, unitPrice: p.price, total: p.price * qty, productId: p.id, dec: () => decQty(p), inc: () => incQty(p), remove: () => setQty(p.id, 0) });
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKit, qtys, avulsoProducts]);

  const subtotal = cartItems.reduce((sum, ci) => sum + ci.total, 0);
  const fee = subtotal * ((svcParams?.adminFeePercent ?? 10) / 100);
  const total = subtotal + fee;
  const cartEmpty = cartItems.length === 0;

  const selCodes = splitCostCenter ? Object.keys(costCenterSel).filter((k) => costCenterSel[k]) : costCenterCode ? [costCenterCode] : [];
  const multiSel = splitCostCenter && selCodes.length > 1;
  const pctTotal = selCodes.reduce((sum, c) => sum + (costCenterPct[c] || 0), 0);
  const pctTotalInvalid = multiSel && pctTotal !== 100;
  const pickupMissing = !!svcParams?.requireScheduledPickup && (!pickupDate || !pickupTime);

  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const locationName = locations.find((l) => l.id === locationId)?.name;
  const copaName = copas.find((c) => c.id === copaId)?.name;
  const costCenterLabel = (code: string) => costCenters.find((c) => c.code === code)?.name ?? code;

  const confirm = () => {
    if (cartEmpty) {
      setHasError(true);
      setErrorMsg("Escolha um kit ou adicione itens avulsos.");
      return;
    }
    if (!eventDate || !eventTime) {
      setHasError(true);
      setErrorMsg("Preencha a data e o horário do evento.");
      return;
    }
    if (!locationId || !copaId || routingBlocked) {
      setHasError(true);
      setErrorMsg("Selecione a localização e a copa de entrega — se a copa estiver sem capacidade, ajuste o horário sugerido.");
      return;
    }
    if (selCodes.length === 0) {
      setHasError(true);
      setErrorMsg("Selecione um centro de custo.");
      return;
    }
    if (pctTotalInvalid) {
      setHasError(true);
      setErrorMsg("A soma dos percentuais entre centros de custo deve fechar em 100%.");
      setShowMore(true);
      return;
    }
    if (pickupMissing) {
      setHasError(true);
      setErrorMsg("Data e horário de recolhimento dos utensílios são obrigatórios para Coffee Break.");
      setShowMore(true);
      return;
    }
    setHasError(false);
    setErrorMsg("");

    addOrder({
      id: orderId,
      category: "Coffee Break",
      type: eventName || "Coffee Break",
      mono: "CB",
      qty: `${people} pessoas`,
      peopleCount: people,
      datetime: `${eventDate} ${eventTime}`.trim(),
      status: needsApproval ? "Aguardando aprovação" : "Solicitado",
      value: money(total),
      valueNumber: total,
      items: cartItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.unitPrice, productId: ci.productId })),
      eventName,
      location: locations.find((l) => l.id === locationId)?.name,
      branchId,
      locationId,
      copaId,
      requestedByUserId: currentUser?.id,
      eventTime,
      pickupDate,
      pickupTime,
      coffeeInstructions,
      dietaryRestrictions: hasDietary ? dietaryDetails || "Sim, sem detalhes" : "Nenhuma",
      costCenters: selCodes.map((code) => ({ code, percent: multiSel ? costCenterPct[code] : 100 })),
      requiresApproval: needsApproval,
      attachments: attachments.length ? attachments : undefined,
    });
    showToast("Pedido confirmado!");
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Layout chat>
        <div className="page-container" style={{ paddingTop: 24 }}>
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
                  <div className="event-summary-item-value">{eventDate} &bull; {eventTime}</div>
                </div>
                <div>
                  <div className="event-summary-item-label">Local de entrega</div>
                  <div className="event-summary-item-value">{locationName || "Não informado"}{copaName ? ` · ${copaName}` : ""}</div>
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
                    <span style={{ fontWeight: 600 }}>{code} &bull; {costCenterLabel(code)}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{multiSel ? `${costCenterPct[code]}%` : "100%"}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn--outline" style={{ marginTop: 24 }} onClick={() => navigate("/")}>
                Voltar para a página inicial
              </button>
            </div>

            <div className="ticket-card">
              <div className="ticket-mono">
                <PathIcon path="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v4M10 2v4M14 2v4" strokeWidth={2} size={18} />
              </div>
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
        </div>
      </Layout>
    );
  }

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
            <div className="order-header-icon">CB</div>
            <div>
              <h1 className="order-title">Novo Coffee Break</h1>
              <div className="order-subtitle">Modelo · peça tudo numa tela só, sem etapas.</div>
            </div>
          </div>
          <div className="order-header-right">
            <span className="order-draft-badge">Rascunho salvo</span>
            <div className="order-id-label">Pedido {orderId}</div>
          </div>
        </div>

        <div className="step1-grid">
          <div style={{ minWidth: 0 }}>
            <div className="catalog-heading">1. Escolha um kit ou adicione itens avulsos</div>
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
                <div className="kits-grid">
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
                          <button className="link" style={{ fontSize: 12, marginBottom: 8 }} onClick={() => setDetailsKitId(k.id)}>
                            Detalhes
                          </button>
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
                    );
                  })}
                </div>
              </>
            )}

            <div className="catalog-heading">{activeCategory === "kits" ? "Produtos avulsos" : "Resultados"}</div>
            {avulsosList.length === 0 && <div className="empty-state">Nenhum produto encontrado.</div>}
            <div className="avulsos-grid">
              {avulsosList.map((p) => {
                const qty = qtys[p.id] || 0;
                return (
                  <div key={p.id} className="avulso-card">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} className="avulso-card__img" />
                    ) : (
                      <ImagePlaceholder label="Imagem" style={{ width: 56, height: 56 }} className="avulso-card__img" />
                    )}
                    <div className="avulso-card__body">
                      <div className="avulso-name">{p.name}</div>
                      <div className="avulso-unit">{p.description}</div>
                      <div className="avulso-footer">
                        <div className="avulso-price">{money(p.price)}</div>
                        <div className="qty-stepper">
                          <button onClick={() => decQty(p)}>&minus;</button>
                          <span>{qty}</span>
                          <button onClick={() => incQty(p)}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="quick-info-card">
              <div className="quick-info-header">
                <div className="quick-info-header-title">2. Data, local e centro de custo</div>
              </div>
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
                <label className="field-boxed">
                  Nº de pessoas
                  <input type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, parseInt(e.target.value) || 1))} />
                </label>
              </div>
              <CopaLocationFields
                date={eventDate}
                time={eventTime}
                onSuggestTime={(d, t) => {
                  setEventDate(d);
                  setEventTime(t);
                }}
                branchId={branchId}
                onBranchChange={setBranchId}
                locationId={locationId}
                onLocationChange={setLocationId}
                copaId={copaId}
                onCopaChange={setCopaId}
                onBlockedChange={setRoutingBlocked}
              />

              <label className="field-boxed" style={{ marginTop: 14 }}>
                Centro de custo
                {allowedCostCenters.length <= 1 ? (
                  <div className="field-boxed-value">
                    {allowedCostCenters[0] ? `${allowedCostCenters[0].code} · ${allowedCostCenters[0].name}` : "Nenhum centro de custo disponível para o seu usuário"}
                  </div>
                ) : (
                  !splitCostCenter && (
                    <select value={costCenterCode} onChange={(e) => setCostCenterCode(e.target.value)}>
                      {allowedCostCenters.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.code} · {cc.name}
                        </option>
                      ))}
                    </select>
                  )
                )}
              </label>
              {allowedCostCenters.length > 1 && !splitCostCenter && (
                <button type="button" className="link" style={{ fontSize: 12, marginTop: 4 }} onClick={() => setSplitCostCenter(true)}>
                  Dividir entre mais de um centro de custo
                </button>
              )}
              {splitCostCenter && (
                <div style={{ marginTop: 8 }}>
                  <div className="cost-center-list">
                    {allowedCostCenters.map((cc) => {
                      const code = cc.code;
                      const checked = !!costCenterSel[code];
                      return (
                        <div key={code} className="cost-center-item" style={{ borderColor: checked ? "var(--color-primary)" : "var(--color-border)", background: checked ? "#f4f6fc" : "#fff" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCostCenter(code)} />
                          <div style={{ flex: 1 }}>
                            <div className="cost-center-item__code">{code}</div>
                            <div className="cost-center-item__name">{cc.name}</div>
                          </div>
                          {checked && multiSel && (
                            <div className="cost-center-pct">
                              <input type="number" min={0} max={100} value={costCenterPct[code] ?? 0} onChange={(e) => setCostCenterPct((s) => ({ ...s, [code]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))} />
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
                  <button type="button" className="link" style={{ fontSize: 12, marginTop: 4 }} onClick={() => { setSplitCostCenter(false); setCostCenterSel({}); }}>
                    Usar só um centro de custo
                  </button>
                </div>
              )}
            </div>

            <button type="button" className="btn btn--outline btn--full" style={{ marginTop: 14 }} onClick={() => setShowMore((v) => !v)}>
              {showMore ? "− Ocultar mais opções" : "+ Mais opções (nome do evento, recolhimento, restrições, aprovação, anexos)"}
            </button>

            {showMore && (
              <div className="quick-info-card" style={{ marginTop: 14 }}>
                <div className="quick-info-header">
                  <div className="quick-info-header-title">Mais opções</div>
                  <label className="approval-check">
                    <input type="checkbox" checked={needsApproval} onChange={(e) => setNeedsApproval(e.target.checked)} />
                    <span>Requer aprovação</span>
                  </label>
                </div>
                <label className="field-boxed">
                  Nome do evento <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                  <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Ex.: Reunião de Diretoria, Confraternização..." />
                </label>
                <div className="field-boxed-grid">
                  <label className="field-boxed">
                    Data de recolhimento dos utensílios {svcParams?.requireScheduledPickup && <span style={{ color: "var(--color-danger)" }}>*</span>}
                    <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                  </label>
                  <label className="field-boxed">
                    Horário de recolhimento {svcParams?.requireScheduledPickup && <span style={{ color: "var(--color-danger)" }}>*</span>}
                    <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                  </label>
                </div>
                <label className="field-label" style={{ marginTop: 14 }}>
                  Instruções para o café <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                  <textarea rows={2} placeholder="Ex: montar às 8h30, servir gelo à parte..." value={coffeeInstructions} onChange={(e) => setCoffeeInstructions(e.target.value)} />
                </label>
                <div style={{ marginTop: 14 }}>
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
                    <textarea
                      rows={2}
                      placeholder="Descreva as restrições (ex: vegetariano, sem lactose, alergia a nozes...)"
                      value={dietaryDetails}
                      onChange={(e) => setDietaryDetails(e.target.value)}
                      style={{ width: "100%", marginTop: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border-input)", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", resize: "none" }}
                    />
                  )}
                </div>
                <div style={{ marginTop: 14 }}>
                  <AttachmentsField value={attachments} onChange={setAttachments} />
                </div>
              </div>
            )}
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
                    {ci.contents && (
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
                <span>Taxa de serviço (10%)</span>
                <span>{money(fee)}</span>
              </div>
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

            <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} onClick={confirm}>
              Confirmar pedido
            </button>
          </div>
        </div>
      </div>

      {detailsKitId &&
        (() => {
          const k = KITS.find((x) => x.id === detailsKitId)!;
          return <KitDetailsModal name={k.name} description={k.desc} contents={k.items} onClose={() => setDetailsKitId(null)} />;
        })()}
    </Layout>
  );
}
