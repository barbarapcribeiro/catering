import { useMemo, useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import type { Asset, AssetMovementKind } from "../../types";
import "./AtivoCheckInOut.css";

function parseAssetCode(raw: string): string {
  const text = raw.trim();
  const match = /DIRECT-EVENTOS:ATIVO:(\S+)/i.exec(text);
  return match ? match[1] : text;
}

export function AtivoCheckInOut() {
  const { assets, assetTypes, assetMovements, costCenters, addAssetMovement, currentUser, showToast } = useAppData();
  const [code, setCode] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [kind, setKind] = useState<AssetMovementKind>("checkout");
  const [costCenterCode, setCostCenterCode] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [notFound, setNotFound] = useState(false);

  const typeById = useMemo(() => Object.fromEntries(assetTypes.map((t) => [t.id, t])), [assetTypes]);
  const ccByCode = useMemo(() => Object.fromEntries(costCenters.map((c) => [c.code, c])), [costCenters]);
  const activeCostCenters = costCenters.filter((c) => c.active);

  const selectedAsset: Asset | null = assets.find((a) => a.id === selectedAssetId) ?? null;

  const lookup = () => {
    const id = parseAssetCode(code);
    const found = assets.find((a) => a.id === id || a.id === `asset${id}` || a.id.endsWith(id));
    if (found) {
      setSelectedAssetId(found.id);
      setNotFound(false);
      setKind(found.lastMovementKind === "checkout" ? "checkin" : "checkout");
      setCostCenterCode(found.costCenterCode ?? "");
      setLocation(found.currentLocation ?? "");
    } else {
      setSelectedAssetId(null);
      setNotFound(true);
    }
  };

  const pickAsset = (a: Asset) => {
    setSelectedAssetId(a.id);
    setCode(a.id);
    setNotFound(false);
    setKind(a.lastMovementKind === "checkout" ? "checkin" : "checkout");
    setCostCenterCode(a.costCenterCode ?? "");
    setLocation(a.currentLocation ?? "");
  };

  const canSubmit = !!selectedAsset && !!costCenterCode && !!location.trim();

  const submit = () => {
    if (!selectedAsset || !canSubmit) return;
    addAssetMovement({
      assetId: selectedAsset.id,
      kind,
      costCenterCode,
      location: location.trim(),
      notes: notes.trim() || undefined,
      performedBy: currentUser?.name,
    });
    showToast(kind === "checkin" ? `Check-in registrado para ${selectedAsset.name}.` : `Check-out registrado para ${selectedAsset.name}.`);
    setCode("");
    setSelectedAssetId(null);
    setNotes("");
    setNotFound(false);
  };

  const history = selectedAsset ? assetMovements.filter((m) => m.assetId === selectedAsset.id).slice(0, 10) : [];

  return (
    <div className="checkinout-page">
      <div className="checkinout-header">
        <h1 className="checkinout-title">Check-in / Check-out de ativos</h1>
        <div className="checkinout-subtitle">Leia o QR code colado no ativo (ou digite o código/nome) para registrar sua movimentação.</div>
      </div>

      <div className="card checkinout-lookup-card">
        <label className="field-label">
          Código do ativo (QR)
          <div className="checkinout-lookup-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="Cole o conteúdo do QR ou digite o ID do ativo"
            />
            <button className="btn btn--primary" onClick={lookup} disabled={!code.trim()}>
              Buscar
            </button>
          </div>
        </label>
        {notFound && <div className="checkinout-not-found">Nenhum ativo encontrado para esse código.</div>}

        {!selectedAsset && (
          <div className="checkinout-quicklist">
            <div className="checkinout-quicklist__label">Ou selecione da lista de ativos</div>
            <div className="checkinout-quicklist__items">
              {assets.slice(0, 8).map((a) => (
                <button key={a.id} className="checkinout-quicklist__item" onClick={() => pickAsset(a)}>
                  {a.name}
                </button>
              ))}
              {assets.length === 0 && <span className="checkinout-quicklist__empty">Nenhum ativo cadastrado ainda.</span>}
            </div>
          </div>
        )}
      </div>

      {selectedAsset && (
        <div className="checkinout-grid">
          <div className="card checkinout-asset-card">
            <div className="checkinout-asset-card__title">{selectedAsset.name}</div>
            <div className="checkinout-fact">
              <span>Tipo</span>
              <strong>{typeById[selectedAsset.assetTypeId]?.name ?? "—"}</strong>
            </div>
            <div className="checkinout-fact">
              <span>Status</span>
              <strong>{selectedAsset.status}</strong>
            </div>
            <div className="checkinout-fact">
              <span>Departamento atual</span>
              <strong>{selectedAsset.costCenterCode ? ccByCode[selectedAsset.costCenterCode]?.name ?? selectedAsset.costCenterCode : "—"}</strong>
            </div>
            <div className="checkinout-fact">
              <span>Localização atual</span>
              <strong>{selectedAsset.currentLocation ?? "—"}</strong>
            </div>
            <div className="checkinout-fact">
              <span>Último movimento</span>
              <strong>{selectedAsset.lastMovementKind === "checkin" ? "Check-in" : selectedAsset.lastMovementKind === "checkout" ? "Check-out" : "—"}</strong>
            </div>

            {history.length > 0 && (
              <>
                <div className="checkinout-history-title">Histórico recente</div>
                <div className="checkinout-history">
                  {history.map((m) => (
                    <div key={m.id} className="checkinout-history-row">
                      <span className={`checkinout-history-badge ${m.kind}`}>{m.kind === "checkin" ? "Check-in" : "Check-out"}</span>
                      <div className="checkinout-history-row__body">
                        <div>
                          {m.location || "—"} {m.costCenterCode && `· ${ccByCode[m.costCenterCode]?.name ?? m.costCenterCode}`}
                        </div>
                        <div className="checkinout-history-row__meta">
                          {new Date(m.createdAt).toLocaleString("pt-BR")} {m.performedBy && `· ${m.performedBy}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card checkinout-form-card">
            <div className="checkinout-kind-toggle">
              <button className={kind === "checkout" ? "is-active" : ""} onClick={() => setKind("checkout")}>
                ↗ Check-out (retirada)
              </button>
              <button className={kind === "checkin" ? "is-active" : ""} onClick={() => setKind("checkin")}>
                ↘ Check-in (devolução)
              </button>
            </div>

            <label className="field-label">
              Unidade (departamento)
              <select value={costCenterCode} onChange={(e) => setCostCenterCode(e.target.value)}>
                <option value="">Selecione a unidade</option>
                {activeCostCenters.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Localização
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Copa do 3º andar, Sala de reuniões B" />
            </label>
            <label className="field-label">
              Observações <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <button className="btn btn--primary checkinout-submit" disabled={!canSubmit} onClick={submit}>
              {kind === "checkin" ? "Registrar check-in" : "Registrar check-out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
