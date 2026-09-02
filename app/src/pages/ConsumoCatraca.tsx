import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { Layout } from "../components/Layout";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { AttachmentsField } from "../components/AttachmentsField";
import { KitDetailsModal } from "../components/KitDetailsModal";
import { useAppData } from "../mock/AppDataContext";
import { catracaEffectiveStatus, catracaCheckInDeadline } from "../mock/catraca";
import { money } from "../mock/money";
import { computeKitPrice } from "../mock/pricing";
import { kitContentsFromCatalog } from "../mock/kitContents";
import { MEAL_SERVICES, type CatracaEffectiveStatus, type CatracaRedemption, type Kit, type MealServiceName, type OrderAttachment } from "../types";
import "./OrderFlow.css";
import "./ConsumoCatraca.css";

const STATUS_STYLE: Record<CatracaEffectiveStatus, { bg: string; color: string }> = {
  "Aguardando retirada": { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  "Check-in realizado": { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  "Check-out realizado": { bg: "var(--color-success-soft)", color: "var(--color-success)" },
  Perda: { bg: "var(--color-danger-soft, #fbe4e4)", color: "var(--color-danger)" },
};

type TopTab = "novo" | "meus";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ConsumoCatraca() {
  const navigate = useNavigate();
  const { kits, products, serviceCatalog, costCenters, currentUser, addCatracaRedemption, checkOutCatraca, catracaRedemptions, showToast } = useAppData();

  const [topTab, setTopTab] = useState<TopTab>("novo");
  const [meal, setMeal] = useState<MealServiceName>(MEAL_SERVICES[0]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [detailsKitId, setDetailsKitId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState(todayISO());
  const [pickupTime, setPickupTime] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [confirmed, setConfirmed] = useState<CatracaRedemption | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrForId, setQrForId] = useState<string | null>(null);
  const [historyQrUrl, setHistoryQrUrl] = useState<string | null>(null);

  const activeCostCenters = costCenters.filter((c) => c.active);
  const mealKits = useMemo(
    () => kits.filter((k) => k.active && (k.pages ?? []).includes("Consumo Catraca") && (k.mealServices ?? []).includes(meal)),
    [kits, meal],
  );
  const kitById = useMemo(() => Object.fromEntries(kits.map((k) => [k.id, k])), [kits]);
  const selectedKit = selectedKitId ? kitById[selectedKitId] : undefined;

  const kitPrice = (k: Kit) => {
    const itemsTotal = k.items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);
    return computeKitPrice(itemsTotal, k.serviceFeePercent);
  };
  const total = selectedKit ? kitPrice(selectedKit) : 0;

  useEffect(() => {
    setSelectedKitId(null);
  }, [meal]);

  useEffect(() => {
    if (!confirmed) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(`DIRECT-EVENTOS:CATRACA:${confirmed.id}`, { width: 220, margin: 1 }).then(setQrDataUrl);
  }, [confirmed]);

  useEffect(() => {
    if (!qrForId) {
      setHistoryQrUrl(null);
      return;
    }
    QRCode.toDataURL(`DIRECT-EVENTOS:CATRACA:${qrForId}`, { width: 200, margin: 1 }).then(setHistoryQrUrl);
  }, [qrForId]);

  const canConfirm = !!selectedKit && !!pickupTime && !!costCenter;

  const confirm = () => {
    if (!selectedKit || !canConfirm) return;
    const created = addCatracaRedemption({
      mealService: meal,
      kitId: selectedKit.id,
      pickupDate,
      pickupTime,
      costCenterCode: costCenter,
      requestedBy: currentUser?.name,
      attachments: attachments.length ? attachments : undefined,
    });
    setConfirmed(created);
  };

  const newAnother = () => {
    setConfirmed(null);
    setSelectedKitId(null);
    setPickupTime("");
    setAttachments([]);
    setTopTab("novo");
  };

  const doCheckOut = (r: CatracaRedemption) => {
    checkOutCatraca(r.id);
    showToast("Check-out confirmado. Bom apetite!");
  };

  const sortedRedemptions = useMemo(
    () => [...catracaRedemptions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [catracaRedemptions],
  );

  if (confirmed) {
    const kit = kitById[confirmed.kitId];
    return (
      <Layout>
        <div className="page-container" style={{ paddingTop: 24, maxWidth: 560 }}>
          <div className="catraca-confirm-card card">
            <div className="catraca-confirm-card__title">Retirada confirmada!</div>
            <div className="catraca-confirm-card__sub">
              Apresente este QR code no restaurante para o check-in. Depois de retirar, confirme o check-out aqui no app em até 1 hora.
            </div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR code da retirada" width={200} height={200} className="catraca-confirm-card__qr" />}
            <div className="catraca-confirm-card__facts">
              <div>
                <span>Refeição</span>
                <strong>{confirmed.mealService}</strong>
              </div>
              <div>
                <span>Kit</span>
                <strong>{kit?.name ?? "—"}</strong>
              </div>
              <div>
                <span>Retirada</span>
                <strong>
                  {confirmed.pickupDate} &bull; {confirmed.pickupTime}
                </strong>
              </div>
            </div>
            <div className="catraca-confirm-card__actions">
              <button className="btn btn--outline" onClick={() => navigate("/")}>
                Voltar para a Home
              </button>
              <button className="btn btn--primary" onClick={newAnother}>
                Registrar outro consumo
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
          <div className="order-header-icon">CC</div>
          <div>
            <h1 className="order-title">Consumo Catraca</h1>
            <div className="order-subtitle">Escolha sua refeição, o horário de retirada, e apresente o QR code no restaurante.</div>
          </div>
        </div>

        <div className="tab-row" style={{ marginBottom: 18 }}>
          <button className={topTab === "novo" ? "is-active" : ""} onClick={() => setTopTab("novo")}>
            Novo consumo
          </button>
          <button className={topTab === "meus" ? "is-active" : ""} onClick={() => setTopTab("meus")}>
            Meus consumos ({sortedRedemptions.length})
          </button>
        </div>

        {topTab === "novo" && (
          <div className="step1-grid">
            <div style={{ minWidth: 0 }}>
              <div className="catalog-heading">1. Escolha a refeição</div>
              <div className="tab-row" style={{ marginBottom: 18 }}>
                {MEAL_SERVICES.map((m) => (
                  <button key={m} className={meal === m ? "is-active" : ""} onClick={() => setMeal(m)}>
                    {m}
                  </button>
                ))}
              </div>

              <div className="catalog-heading">2. Escolha o kit</div>
              <div className="catraca-kit-grid">
                {mealKits.map((k) => (
                  <div key={k.id} className={`kit-card catraca-kit-card ${selectedKitId === k.id ? "is-selected" : ""}`} onClick={() => setSelectedKitId(k.id)}>
                    {k.photoUrl ? (
                      <img src={k.photoUrl} alt="" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                    ) : (
                      <ImagePlaceholder label="Foto do kit" style={{ width: "100%", height: 130, borderRadius: 0 }} />
                    )}
                    <div className="kit-card__body">
                      <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{k.name}</div>
                      {k.description && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>{k.description}</div>}
                      <button
                        className="link"
                        style={{ fontSize: 12, marginBottom: 6 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsKitId(k.id);
                        }}
                      >
                        Detalhes
                      </button>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{money(kitPrice(k))}</div>
                    </div>
                  </div>
                ))}
                {mealKits.length === 0 && <div className="empty-state">Nenhum kit cadastrado para {meal} ainda. Cadastre em Catálogos › Kits.</div>}
              </div>

              <div className="step-card">
                <div className="step-heading">3. Data e horário de retirada</div>
                <div className="catraca-fields-grid">
                  <label className="field-label">
                    Data
                    <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                  </label>
                  <label className="field-label">
                    Horário de retirada
                    <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                  </label>
                  <label className="field-label">
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
                </div>
              </div>

              <div className="step-card">
                <AttachmentsField value={attachments} onChange={setAttachments} />
              </div>
            </div>

            <div className="cart-panel">
              <div className="cart-panel__header">
                <div className="cart-panel__title">Seu pedido</div>
                {selectedKit && (
                  <button className="cart-panel__clear" onClick={() => setSelectedKitId(null)}>
                    Limpar
                  </button>
                )}
              </div>

              {!selectedKit && (
                <div className="empty-state">
                  Nenhum kit selecionado.
                  <br />
                  Escolha um kit ao lado.
                </div>
              )}

              {selectedKit && (
                <div className="cart-items">
                  <div className="cart-item">
                    {selectedKit.photoUrl ? (
                      <img src={selectedKit.photoUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} className="cart-item__img" />
                    ) : (
                      <ImagePlaceholder label="" style={{ width: 44, height: 44 }} className="cart-item__img" />
                    )}
                    <div className="cart-item__body">
                      <div className="cart-item__name">{selectedKit.name}</div>
                      <div className="cart-item__sub">{meal}</div>
                      {(() => {
                        const contents = kitContentsFromCatalog(selectedKit, products, serviceCatalog);
                        return (
                          contents.length > 0 && (
                            <ul className="cart-item__contents">
                              {contents.map((c, i) => (
                                <li key={i}>
                                  {c.qty}x {c.label}
                                </li>
                              ))}
                            </ul>
                          )
                        );
                      })()}
                      <div className="cart-item__row">
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>1 kit</span>
                        <div className="cart-item__price">{money(kitPrice(selectedKit))}</div>
                      </div>
                    </div>
                    <button className="cart-item__remove" onClick={() => setSelectedKitId(null)}>
                      &times;
                    </button>
                  </div>
                </div>
              )}

              <div className="cart-totals">
                <div className="cart-totals__final">
                  <span>Total estimado</span>
                  <span style={{ color: "var(--color-primary)" }}>{money(total)}</span>
                </div>
              </div>
              <div className="cart-note">O valor final poderá ser ajustado conforme confirmação do pedido.</div>

              <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} disabled={!canConfirm} onClick={confirm}>
                Confirmar retirada e gerar QR code
              </button>
            </div>
          </div>
        )}

        {topTab === "meus" && (
          <div className="catraca-list">
            {sortedRedemptions.map((r) => {
              const status = catracaEffectiveStatus(r);
              const st = STATUS_STYLE[status];
              const kit = kitById[r.kitId];
              const deadline = catracaCheckInDeadline(r);
              return (
                <div key={r.id} className="card catraca-list-row">
                  <div className="catraca-list-row__main">
                    <div className="catraca-list-row__title">
                      {kit?.name ?? "Kit removido"} <span className="pill-tag">{r.mealService}</span>
                    </div>
                    <div className="catraca-list-row__meta">
                      {r.pickupDate} &bull; {r.pickupTime}
                      {status === "Check-in realizado" && deadline && ` · check-out até ${deadline.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                    </div>
                  </div>
                  <span className="status-pill" style={{ background: st.bg, color: st.color }}>
                    {status}
                  </span>
                  <div className="catraca-list-row__actions">
                    <button className="link" onClick={() => setQrForId(qrForId === r.id ? null : r.id)}>
                      {qrForId === r.id ? "Ocultar QR" : "Ver QR"}
                    </button>
                    {status === "Check-in realizado" && (
                      <button className="btn btn--primary btn--sm" onClick={() => doCheckOut(r)}>
                        Confirmar check-out
                      </button>
                    )}
                  </div>
                  {qrForId === r.id && historyQrUrl && (
                    <div className="catraca-list-row__qr">
                      <img src={historyQrUrl} alt="QR code" width={140} height={140} />
                    </div>
                  )}
                </div>
              );
            })}
            {sortedRedemptions.length === 0 && <div className="empty-state">Nenhum consumo registrado ainda.</div>}
          </div>
        )}
      </div>

      {detailsKitId &&
        (() => {
          const k = kitById[detailsKitId];
          if (!k) return null;
          return <KitDetailsModal name={k.name} description={k.description} contents={kitContentsFromCatalog(k, products, serviceCatalog)} onClose={() => setDetailsKitId(null)} />;
        })()}
    </Layout>
  );
}
