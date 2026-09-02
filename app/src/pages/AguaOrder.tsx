import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { AttachmentsField } from "../components/AttachmentsField";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { LOCATIONS } from "../mock/services";
import type { OrderAttachment } from "../types";
import "../pages/OrderFlow.css";
import "./AguaOrder.css";

export function AguaOrder() {
  const { addOrder, showToast, costCenters, products, serviceParameters, orders } = useAppData();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const repeatOrderId = (routerLocation.state as { repeatOrderId?: string } | null)?.repeatOrderId;
  const activeCostCenters = costCenters.filter((c) => c.active);
  const items = products.filter((p) => p.active && (p.pages ?? []).includes("Solicitação de Água"));
  const linkedCostCenterCode = serviceParameters.find((s) => s.category === "Solicitação de Água")?.linkedCostCenterCode;

  const [orderId] = useState(() => `#SA-${Math.floor(15200 + Math.random() * 800)}`);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliverTo, setDeliverTo] = useState("");
  const [local, setLocal] = useState("");
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [costCenter, setCostCenter] = useState("");

  useEffect(() => {
    if (!costCenter && linkedCostCenterCode) setCostCenter(linkedCostCenterCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedCostCenterCode]);
  const [costCenterMenuOpen, setCostCenterMenuOpen] = useState(false);
  const [observations, setObservations] = useState("");
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const change = (id: string, delta: number) => {
    setQty((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 0) + delta) }));
  };

  useEffect(() => {
    if (!repeatOrderId) return;
    const source = orders.find((o) => o.id === repeatOrderId);
    if (!source) return;
    const nextQty: Record<string, number> = {};
    (source.items ?? []).forEach((it) => {
      if (it.productId) nextQty[it.productId] = it.qty;
    });
    setQty(nextQty);
    if (source.location) setLocal(source.location);
    if (source.costCenters && source.costCenters.length > 0) setCostCenter(source.costCenters[0].code);
    showToast("Carrinho preenchido com os itens do pedido anterior. Revise e confirme.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOrderId]);

  const totalUnits = Object.values(qty).reduce((sum, v) => sum + v, 0);
  const total = items.reduce((sum, p) => sum + (qty[p.id] ?? 0) * p.price, 0);
  const cartItems = items.filter((p) => (qty[p.id] ?? 0) > 0);
  const cartEmpty = cartItems.length === 0;
  const clearAll = () => {
    setQty({});
    showToast("Carrinho limpo.");
  };

  const submitOrder = () => {
    if (totalUnits === 0) {
      setHasError(true);
      setErrorMsg("Selecione ao menos um item de água.");
      return;
    }
    if (!deliveryDate || !deliveryTime || !local || !deliverTo) {
      setHasError(true);
      setErrorMsg("Preencha data, horário e destino da entrega.");
      return;
    }
    if (!costCenter) {
      setHasError(true);
      setErrorMsg("Selecione o centro de custo.");
      return;
    }
    setHasError(false);
    setErrorMsg("");

    addOrder({
      id: orderId,
      category: "Solicitação de Água",
      type: "Solicitação de Água",
      mono: "SA",
      qty: `${totalUnits} item(ns)`,
      datetime: `${deliveryDate} ${deliveryTime}`.trim(),
      status: "Solicitado",
      value: money(total),
      valueNumber: total,
      items: items.filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ name: p.name, qty: qty[p.id], price: p.price, productId: p.id })),
      location: local,
      costCenters: [{ code: costCenter, percent: 100 }],
      notes: `Entregar para: ${deliverTo}${observations ? " • " + observations : ""}`,
      attachments: attachments.length ? attachments : undefined,
    });
    showToast("Pedido de água solicitado com sucesso!");
    navigate("/");
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
          <div className="order-header-icon">SA</div>
          <div>
            <h1 className="order-title">Solicitação de Água</h1>
            <div className="order-subtitle">Solicite água para eventos, reuniões e treinamentos.</div>
          </div>
        </div>

        <div className="step1-grid">
          <div style={{ minWidth: 0 }}>
            <div className="catalog-heading">1. Escolha os itens e quantidades</div>
            <div className="agua-items-grid">
              {items.map((p) => (
                <div key={p.id} className="kit-card">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
                  ) : (
                    <ImagePlaceholder label="Foto do produto" style={{ width: "100%", height: 140, borderRadius: 0 }} />
                  )}
                  <div className="kit-card__body">
                    <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>{p.description}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", marginBottom: 12 }}>{money(p.price)}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Quantidade</span>
                      <div className="qty-stepper">
                        <button onClick={() => change(p.id, -1)}>&minus;</button>
                        <span>{qty[p.id] ?? 0}</span>
                        <button onClick={() => change(p.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="empty-state">Nenhum produto de água ativo no catálogo.</div>}
            </div>

            <div className="step-card">
              <div className="step-heading">2. Data, horário e entrega</div>
              <div className="agua-fields-grid">
                <label className="field-label">
                  Data de entrega
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </label>
                <label className="field-label">
                  Horário de entrega
                  <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                </label>
                <div style={{ position: "relative" }}>
                  <label className="field-label" style={{ marginBottom: 6 }}>Local</label>
                  <div className="agua-local-box" onClick={() => setLocalMenuOpen((v) => !v)} style={{ color: local ? "var(--color-text)" : "var(--color-text-muted)" }}>
                    {local || "Selecionar local"}
                  </div>
                  {localMenuOpen && (
                    <div className="location-dropdown">
                      {LOCATIONS.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            setLocal(name);
                            setLocalMenuOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <label className="field-label">
                  Entregar para
                  <input value={deliverTo} onChange={(e) => setDeliverTo(e.target.value)} placeholder="Nome, setor ou sala" />
                </label>
                <div style={{ position: "relative" }}>
                  <label className="field-label" style={{ marginBottom: 6 }}>Centro de custo</label>
                  <div className="agua-local-box" onClick={() => setCostCenterMenuOpen((v) => !v)} style={{ color: costCenter ? "var(--color-text)" : "var(--color-text-muted)" }}>
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
              <label className="field-label" style={{ marginTop: 18 }}>
                Observações
                <textarea rows={3} placeholder="Alguma informação adicional sobre a entrega..." value={observations} onChange={(e) => setObservations(e.target.value)} style={{ resize: "vertical" }} />
              </label>
              <div style={{ marginTop: 18 }}>
                <AttachmentsField value={attachments} onChange={setAttachments} />
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

            {cartEmpty && (
              <div className="empty-state">
                Seu carrinho está vazio.
                <br />
                Adicione itens ao lado.
              </div>
            )}

            <div className="cart-items">
              {cartItems.map((p) => (
                <div key={p.id} className="cart-item">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} className="cart-item__img" />
                  ) : (
                    <ImagePlaceholder label="" style={{ width: 44, height: 44 }} className="cart-item__img" />
                  )}
                  <div className="cart-item__body">
                    <div className="cart-item__name">{p.name}</div>
                    <div className="cart-item__sub">
                      {qty[p.id]} {p.unit}
                    </div>
                    <div className="cart-item__row">
                      <div className="qty-stepper qty-stepper--sm">
                        <button onClick={() => change(p.id, -1)}>&minus;</button>
                        <span>{qty[p.id]}</span>
                        <button onClick={() => change(p.id, 1)}>+</button>
                      </div>
                      <div className="cart-item__price">{money((qty[p.id] ?? 0) * p.price)}</div>
                    </div>
                  </div>
                  <button className="cart-item__remove" onClick={() => setQty((s) => ({ ...s, [p.id]: 0 }))}>
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
              <div className="agua-error" style={{ marginTop: 12 }}>
                {errorMsg}
              </div>
            )}

            <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} disabled={cartEmpty} onClick={submitOrder}>
              Confirmar pedido
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
