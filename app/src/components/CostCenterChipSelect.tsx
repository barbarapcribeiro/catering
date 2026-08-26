import type { CostCenter } from "../types";
import "./CostCenterChipSelect.css";

export function CostCenterChipSelect({
  costCenters,
  selectedCodes,
  onToggle,
  emptyLabel = "Nenhum centro de custo cadastrado ainda. Cadastre em Cadastros › Centros de Custo.",
}: {
  costCenters: CostCenter[];
  selectedCodes: string[];
  onToggle: (code: string) => void;
  emptyLabel?: string;
}) {
  if (costCenters.length === 0) return <div className="empty-state">{emptyLabel}</div>;
  return (
    <div className="cc-chip-select">
      {costCenters.map((c) => (
        <button key={c.id} type="button" className={selectedCodes.includes(c.code) ? "is-active" : ""} onClick={() => onToggle(c.code)}>
          {c.code} · {c.name}
        </button>
      ))}
    </div>
  );
}
