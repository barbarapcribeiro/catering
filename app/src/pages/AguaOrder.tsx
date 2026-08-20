import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { LOCATIONS } from "../mock/services";
import "../pages/OrderFlow.css";
import "./AguaOrder.css";

const WATER_PRODUCT_IDS = ["prod10", "prod11", "prod12", "prod13"];

export function AguaOrder() {
  const { addOrder, showToast, costCenters, products } = useAppData();
  const navigate = useNavigate();
  const activeCostCenters = costCenters.filter((c) => c.active);
  const items = products.filter((p) => WATER_PRODUCT_IDS.includes(p.id) && p.active);

  const [orderId] = useState(() => `#SA-${Math.floor(15200 + Math.random() * 800)}`);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliverTo, setDeliverTo] = useState("");
  const [local, setLocal] = useState("");
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [costCenter, setCostCenter] = useState("");
  const [costCenterMenuOpen, setCostCenterMenuOpen] = useState(false);
  const [observations, setObservations] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const change = (id: string, delta: number) => {
    setQty((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 0) + delta) }));
  };

  const totalUnits = Object.values(qty).reduce((sum, v) => sum + v, 0);
  const total = items.reduce((sum, p) => sum + (qty[p.id] ?? 0) * p.price, 0);

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
    });
    showToast("Pedido de água solicitado com sucesso!");
    navigate("/");
  };

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
          <div className="order-header-icon">SA</div>
          <div>
            <h1 className="order-title">Solicitação de Água</h1>
            <div className="order-subtitle">Solicite água para eventos, reuniões e treinamentos.</div>
          </div>
        </div>

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
        </div>

        {hasError && <div className="agua-error">{errorMsg}</div>}

        <div className="agua-submit-bar">
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {totalUnits > 0 ? `${totalUnits} item(ns) selecionado(s) · ${money(total)}` : "Nenhum item selecionado ainda"}
          </div>
          <button className="btn btn--primary" onClick={submitOrder}>
            Confirmar pedido
          </button>
        </div>
      </div>
    </Layout>
  );
}
