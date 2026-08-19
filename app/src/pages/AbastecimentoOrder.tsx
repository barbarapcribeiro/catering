import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { LOCATIONS } from "../mock/services";
import "./OrderFlow.css";
import "./AbastecimentoOrder.css";

type ItemKey =
  | "cafe500"
  | "cafe1l"
  | "cafe3l"
  | "cafe5l"
  | "agua500"
  | "agua15"
  | "galao5"
  | "galao20"
  | "adocante"
  | "acucar"
  | "biscoitos"
  | "balas"
  | "bombons";

interface ItemDef {
  key: ItemKey;
  name: string;
  desc: string;
  price: number;
}

const CAFE_ITEMS: ItemDef[] = [
  { key: "cafe500", name: "Garrafa de Café 500ml", desc: "Térmica, mantém a temperatura por mais tempo.", price: 8 },
  { key: "cafe1l", name: "Garrafa de Café 1L", desc: "Ideal para grupos pequenos.", price: 14 },
  { key: "cafe3l", name: "Garrafa de Café 3L", desc: "Ideal para setores e salas de reunião.", price: 32 },
  { key: "cafe5l", name: "Garrafa de Café 5L", desc: "Ideal para andares e áreas maiores.", price: 48 },
];

const AGUA_ITEMS: ItemDef[] = [
  { key: "agua500", name: "Garrafa 500ml", desc: "Água mineral individual.", price: 3 },
  { key: "agua15", name: "Garrafa 1,5L", desc: "Água mineral, ideal para mesas de reunião.", price: 6 },
  { key: "galao5", name: "Galão 5L", desc: "Galão compacto, ideal para salas e escritórios.", price: 25 },
  { key: "galao20", name: "Galão 20L", desc: "Galão com suporte, ideal para eventos maiores.", price: 60 },
];

const OUTROS_ITEMS: ItemDef[] = [
  { key: "adocante", name: "Adoçante", desc: "Sachês individuais.", price: 5 },
  { key: "acucar", name: "Açúcar", desc: "Sachês individuais.", price: 4 },
  { key: "biscoitos", name: "Biscoitos Simples", desc: "Pacotes individuais, sabores variados.", price: 6 },
  { key: "balas", name: "Balas", desc: "Pacote sortido.", price: 7 },
  { key: "bombons", name: "Bombons", desc: "Unidade, sabores variados.", price: 2 },
];

const ALL_ITEMS = [...CAFE_ITEMS, ...AGUA_ITEMS, ...OUTROS_ITEMS];

const INITIAL_QTY = ALL_ITEMS.reduce((acc, it) => ({ ...acc, [it.key]: 0 }), {} as Record<ItemKey, number>);

export function AbastecimentoOrder() {
  const { addOrder, showToast, costCenters } = useAppData();
  const navigate = useNavigate();
  const activeCostCenters = costCenters.filter((c) => c.active);

  const [orderId] = useState(() => `#AS-${Math.floor(15200 + Math.random() * 800)}`);
  const [qty, setQty] = useState<Record<ItemKey, number>>(INITIAL_QTY);
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

  const change = (key: ItemKey, delta: number) => {
    setQty((s) => ({ ...s, [key]: Math.max(0, s[key] + delta) }));
  };

  const totalUnits = Object.values(qty).reduce((sum, v) => sum + v, 0);
  const total = ALL_ITEMS.reduce((sum, d) => sum + qty[d.key] * d.price, 0);

  const submitOrder = () => {
    if (totalUnits === 0) {
      setHasError(true);
      setErrorMsg("Selecione ao menos um item.");
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
      category: "Abastecimento Simples",
      type: "Abastecimento Simples",
      mono: "AS",
      qty: `${totalUnits} item(ns)`,
      datetime: `${deliveryDate} ${deliveryTime}`.trim(),
      status: "Solicitado",
      value: money(total),
      valueNumber: total,
      items: ALL_ITEMS.filter((d) => qty[d.key] > 0).map((d) => ({ name: d.name, qty: qty[d.key], price: d.price })),
      location: local,
      costCenters: [{ code: costCenter, percent: 100 }],
      notes: `Entregar para: ${deliverTo}${observations ? " • " + observations : ""}`,
    });
    showToast("Pedido de abastecimento solicitado com sucesso!");
    navigate("/");
  };

  const renderSection = (title: string, items: ItemDef[]) => (
    <>
      <div className="catalog-heading">{title}</div>
      <div className="abast-items-grid">
        {items.map((it) => (
          <div key={it.key} className="kit-card">
            <ImagePlaceholder label="Foto do produto" style={{ width: "100%", height: 120, borderRadius: 0 }} />
            <div className="kit-card__body">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{it.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginBottom: 6, minHeight: 30 }}>{it.desc}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-primary)", marginBottom: 12 }}>{money(it.price)}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Quantidade</span>
                <div className="qty-stepper">
                  <button onClick={() => change(it.key, -1)}>&minus;</button>
                  <span>{qty[it.key]}</span>
                  <button onClick={() => change(it.key, 1)}>+</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

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
          <div className="order-header-icon">AS</div>
          <div>
            <h1 className="order-title">Abastecimento Simples</h1>
            <div className="order-subtitle">Café, água e itens de copa para o dia a dia da sua unidade.</div>
          </div>
        </div>

        {renderSection("Café", CAFE_ITEMS)}
        {renderSection("Água", AGUA_ITEMS)}
        {renderSection("Outros itens", OUTROS_ITEMS)}

        <div className="step-card">
          <div className="step-heading">Data, horário e entrega</div>
          <div className="abast-fields-grid">
            <label className="field-label">
              Data de entrega
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </label>
            <label className="field-label">
              Horário de entrega
              <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
            </label>
            <div style={{ position: "relative" }}>
              <label className="field-label" style={{ marginBottom: 6 }}>
                Local
              </label>
              <div className="abast-local-box" onClick={() => setLocalMenuOpen((v) => !v)} style={{ color: local ? "var(--color-text)" : "var(--color-text-muted)" }}>
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
              <label className="field-label" style={{ marginBottom: 6 }}>
                Centro de custo
              </label>
              <div className="abast-local-box" onClick={() => setCostCenterMenuOpen((v) => !v)} style={{ color: costCenter ? "var(--color-text)" : "var(--color-text-muted)" }}>
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

        {hasError && <div className="abast-error">{errorMsg}</div>}

        <div className="abast-submit-bar">
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{totalUnits > 0 ? `${totalUnits} item(ns) selecionado(s) · ${money(total)}` : "Nenhum item selecionado ainda"}</div>
          <button className="btn btn--primary" onClick={submitOrder}>
            Confirmar pedido
          </button>
        </div>
      </div>
    </Layout>
  );
}
