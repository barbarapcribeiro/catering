import { useMemo, useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { catracaEffectiveStatus, catracaCheckInDeadline } from "../../mock/catraca";
import type { CatracaEffectiveStatus, CatracaRedemption } from "../../types";
import "./CatracaCheckIn.css";

const STATUS_STYLE: Record<CatracaEffectiveStatus, { bg: string; color: string }> = {
  "Aguardando retirada": { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  "Check-in realizado": { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  "Check-out realizado": { bg: "var(--color-success-soft)", color: "var(--color-success)" },
  Perda: { bg: "var(--color-danger-soft, #fbe4e4)", color: "var(--color-danger)" },
};

function parseCode(raw: string): string {
  const match = /DIRECT-EVENTOS:CATRACA:(\S+)/i.exec(raw.trim());
  return match ? match[1] : raw.trim();
}

export function CatracaCheckIn() {
  const { catracaRedemptions, kits, costCenters, checkInCatraca, showToast } = useAppData();
  const [code, setCode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const kitById = useMemo(() => Object.fromEntries(kits.map((k) => [k.id, k])), [kits]);
  const ccByCode = useMemo(() => Object.fromEntries(costCenters.map((c) => [c.code, c])), [costCenters]);

  const pending = useMemo(
    () => catracaRedemptions.filter((r) => r.status === "Aguardando retirada").sort((a, b) => a.pickupTime.localeCompare(b.pickupTime)),
    [catracaRedemptions],
  );
  const inProgress = useMemo(
    () =>
      catracaRedemptions
        .filter((r) => catracaEffectiveStatus(r) === "Check-in realizado")
        .sort((a, b) => new Date(b.checkInAt ?? 0).getTime() - new Date(a.checkInAt ?? 0).getTime()),
    [catracaRedemptions],
  );

  const selected: CatracaRedemption | null = catracaRedemptions.find((r) => r.id === selectedId) ?? null;

  const lookup = () => {
    const id = parseCode(code);
    const found = catracaRedemptions.find((r) => r.id === id || r.id.endsWith(id));
    if (found) {
      setSelectedId(found.id);
      setNotFound(false);
    } else {
      setSelectedId(null);
      setNotFound(true);
    }
  };

  const doCheckIn = (r: CatracaRedemption) => {
    checkInCatraca(r.id);
    showToast(`Check-in confirmado para ${kitById[r.kitId]?.name ?? r.id}.`);
    setSelectedId(null);
    setCode("");
  };

  return (
    <div className="catraca-checkin-page">
      <div className="catraca-checkin-header">
        <h1 className="catraca-checkin-title">Check-in Consumo Catraca</h1>
        <div className="catraca-checkin-subtitle">Leia o QR code apresentado pela pessoa (ou digite o código) para liberar a retirada da refeição.</div>
      </div>

      <div className="card catraca-checkin-lookup">
        <label className="field-label">
          Código do consumo (QR)
          <div className="catraca-checkin-lookup__row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="Cole o conteúdo do QR ou digite o código do consumo"
            />
            <button className="btn btn--primary" onClick={lookup} disabled={!code.trim()}>
              Buscar
            </button>
          </div>
        </label>
        {notFound && <div className="catraca-checkin-not-found">Nenhum consumo encontrado para esse código.</div>}

        {selected && (
          <div className="catraca-checkin-selected">
            <div className="catraca-checkin-selected__title">{kitById[selected.kitId]?.name ?? "Kit removido"}</div>
            <div className="catraca-checkin-selected__facts">
              <span>{selected.mealService}</span>
              <span>
                {selected.pickupDate} &bull; {selected.pickupTime}
              </span>
              {selected.costCenterCode && <span>{ccByCode[selected.costCenterCode]?.name ?? selected.costCenterCode}</span>}
              {selected.requestedBy && <span>{selected.requestedBy}</span>}
            </div>
            <span className="status-pill" style={{ background: STATUS_STYLE[catracaEffectiveStatus(selected)].bg, color: STATUS_STYLE[catracaEffectiveStatus(selected)].color }}>
              {catracaEffectiveStatus(selected)}
            </span>
            {selected.status === "Aguardando retirada" ? (
              <button className="btn btn--primary" onClick={() => doCheckIn(selected)}>
                Confirmar check-in (liberar refeição)
              </button>
            ) : (
              <div className="catraca-checkin-hint">Esse consumo já teve check-in registrado.</div>
            )}
          </div>
        )}
      </div>

      <div className="card catraca-checkin-list-card">
        <div className="catraca-checkin-list-title">Aguardando retirada hoje ({pending.length})</div>
        <div className="catraca-checkin-list">
          {pending.map((r) => (
            <div key={r.id} className="catraca-checkin-row">
              <div>
                <div className="catraca-checkin-row__name">{kitById[r.kitId]?.name ?? "Kit removido"}</div>
                <div className="catraca-checkin-row__meta">
                  {r.mealService} &bull; {r.pickupDate} &bull; {r.pickupTime} {r.requestedBy && `· ${r.requestedBy}`}
                </div>
              </div>
              <button className="btn btn--outline btn--sm" onClick={() => doCheckIn(r)}>
                Confirmar check-in
              </button>
            </div>
          ))}
          {pending.length === 0 && <div className="empty-state">Nenhuma retirada pendente.</div>}
        </div>
      </div>

      <div className="card catraca-checkin-list-card">
        <div className="catraca-checkin-list-title">Aguardando check-out do cliente ({inProgress.length})</div>
        <div className="catraca-checkin-list">
          {inProgress.map((r) => {
            const deadline = catracaCheckInDeadline(r);
            return (
              <div key={r.id} className="catraca-checkin-row">
                <div>
                  <div className="catraca-checkin-row__name">{kitById[r.kitId]?.name ?? "Kit removido"}</div>
                  <div className="catraca-checkin-row__meta">
                    {r.mealService} &bull; check-in às {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    {deadline && ` · prazo até ${deadline.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                  </div>
                </div>
                <span className="pill-tag">Aguardando check-out</span>
              </div>
            );
          })}
          {inProgress.length === 0 && <div className="empty-state">Nenhum consumo aguardando check-out.</div>}
        </div>
      </div>
    </div>
  );
}
