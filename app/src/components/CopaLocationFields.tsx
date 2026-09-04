import { useEffect } from "react";
import { useAppData } from "../mock/AppDataContext";
import { copaSlotStatus } from "../mock/copaAvailability";

interface CopaLocationFieldsProps {
  date: string;
  time: string;
  onSuggestTime: (date: string, time: string) => void;
  branchId: string;
  onBranchChange: (id: string) => void;
  locationId: string;
  onLocationChange: (id: string) => void;
  copaId: string;
  onCopaChange: (id: string) => void;
  onBlockedChange?: (blocked: boolean) => void;
}

/** Campos compartilhados de roteamento de pedido: Unidade (filial), Localização de entrega e Copa
 * responsável, todos filtrados pelo que o usuário logado tem permissão de usar. Também avisa quando
 * a Copa escolhida está no limite de capacidade no horário selecionado e sugere o próximo horário livre. */
export function CopaLocationFields({ date, time, onSuggestTime, branchId, onBranchChange, locationId, onLocationChange, copaId, onCopaChange, onBlockedChange }: CopaLocationFieldsProps) {
  const { branches, locations, copas, currentUser, orders } = useAppData();

  const allowedBranches = branches.filter((b) => b.active && (!currentUser?.branchIds?.length || currentUser.branchIds.includes(b.id)));

  useEffect(() => {
    if (!branchId && allowedBranches.length > 0) onBranchChange(allowedBranches[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedBranches.map((b) => b.id).join(","), branchId]);

  const branchLocations = locations.filter((l) => l.active && l.branchId === branchId);

  useEffect(() => {
    if (locationId && !branchLocations.some((l) => l.id === locationId)) onLocationChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const eligibleCopas = copas.filter(
    (c) => c.active && c.branchId === branchId && c.locationIds.includes(locationId) && (!currentUser?.copaIds?.length || currentUser.copaIds.includes(c.id)),
  );

  useEffect(() => {
    if (copaId && !eligibleCopas.some((c) => c.id === copaId)) onCopaChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, locationId]);

  const selectedCopa = eligibleCopas.find((c) => c.id === copaId);
  const status = selectedCopa ? copaSlotStatus(selectedCopa, date, time, orders) : { full: false as const };

  useEffect(() => {
    onBlockedChange?.(!!selectedCopa && status.full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCopa?.id, status.full, status.nextAvailable?.date, status.nextAvailable?.time]);

  return (
    <>
      {allowedBranches.length > 1 && (
        <label className="field-label">
          Unidade
          <select value={branchId} onChange={(e) => onBranchChange(e.target.value)}>
            <option value="">Selecione a unidade</option>
            {allowedBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field-label">
        Localização de entrega
        <select value={locationId} onChange={(e) => onLocationChange(e.target.value)} disabled={!branchId}>
          <option value="">Selecione a localização</option>
          {branchLocations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {branchId && branchLocations.length === 0 && <span className="field-hint">Nenhuma localização cadastrada para esta unidade ainda.</span>}
      </label>

      <label className="field-label">
        Copa responsável
        <select value={copaId} onChange={(e) => onCopaChange(e.target.value)} disabled={!locationId}>
          <option value="">Selecione a copa</option>
          {eligibleCopas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (SLA {c.slaHours}h)
            </option>
          ))}
        </select>
        {locationId && eligibleCopas.length === 0 && <span className="field-hint">Nenhuma copa disponível para essa localização.</span>}
      </label>

      {selectedCopa && status.full && (
        <div className="copa-capacity-warning">
          ⚠️ A copa <strong>{selectedCopa.name}</strong> está no limite de capacidade nesse horário.
          {status.nextAvailable ? (
            <>
              {" "}
              Próximo horário disponível: <strong>{status.nextAvailable.date === date ? status.nextAvailable.time : `${status.nextAvailable.date} às ${status.nextAvailable.time}`}</strong>.
              <button type="button" className="link" style={{ marginLeft: 8 }} onClick={() => onSuggestTime(status.nextAvailable!.date, status.nextAvailable!.time)}>
                Usar esse horário
              </button>
            </>
          ) : (
            " Escolha outra data, horário ou copa."
          )}
        </div>
      )}
    </>
  );
}
