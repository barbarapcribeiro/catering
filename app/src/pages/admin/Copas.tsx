import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { UserChipSelect } from "../../components/UserChipSelect";
import { WEEKDAYS, type Copa, type CopaOperatingHours } from "../../types";
import "./Copas.css";

function defaultHours(): CopaOperatingHours[] {
  return WEEKDAYS.map((weekday) => ({ weekday, enabled: !["Sábado", "Domingo"].includes(weekday), start: "07:00", end: "19:00" }));
}

const EMPTY_FORM = {
  name: "",
  companyId: "",
  branchId: "",
  physicalLocation: "",
  locationIds: [] as string[],
  costCenterCodes: [] as string[],
  responsibleUserIds: [] as string[],
  slaHours: 2,
  operatingHours: defaultHours(),
  nonBusinessDays: [] as string[],
  capacityPer30min: 10,
  active: true,
};

export function Copas() {
  const { copas, companies, branches, costCenters, locations, users, addCopa, updateCopa, removeCopa, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newHoliday, setNewHoliday] = useState("");

  const activeCompanies = companies.filter((c) => c.active);
  const branchesForCompany = branches.filter((b) => b.active && b.companyId === form.companyId);
  const costCentersForBranch = costCenters.filter((cc) => cc.active && cc.branchId === form.branchId);
  const locationsForBranch = locations.filter((l) => l.active && l.branchId === form.branchId);
  const activeUsers = users.filter((u) => u.active);
  const locationName = (id: string) => locations.find((l) => l.id === id)?.name ?? "—";

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "—";
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "—";
  const enabledDaysLabel = (c: Copa) => c.operatingHours.filter((h) => h.enabled).map((h) => h.weekday.slice(0, 3)).join(", ") || "—";

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, companyId: activeCompanies[0]?.id ?? "", operatingHours: defaultHours() });
    setNewHoliday("");
    setModalOpen(true);
  };

  const openEdit = (c: Copa) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      companyId: c.companyId,
      branchId: c.branchId,
      physicalLocation: c.physicalLocation,
      locationIds: c.locationIds ?? [],
      costCenterCodes: c.costCenterCodes,
      responsibleUserIds: c.responsibleUserIds,
      slaHours: c.slaHours,
      operatingHours: c.operatingHours,
      nonBusinessDays: c.nonBusinessDays,
      capacityPer30min: c.capacityPer30min,
      active: c.active,
    });
    setNewHoliday("");
    setModalOpen(true);
  };

  const setCompany = (companyId: string) => {
    setForm((f) => ({ ...f, companyId, branchId: "", costCenterCodes: [], locationIds: [] }));
  };
  const setBranch = (branchId: string) => {
    setForm((f) => ({ ...f, branchId, costCenterCodes: [], locationIds: [] }));
  };

  const toggleCostCenter = (code: string) => {
    setForm((f) => ({ ...f, costCenterCodes: f.costCenterCodes.includes(code) ? f.costCenterCodes.filter((x) => x !== code) : [...f.costCenterCodes, code] }));
  };
  const toggleLocation = (id: string) => {
    setForm((f) => ({ ...f, locationIds: f.locationIds.includes(id) ? f.locationIds.filter((x) => x !== id) : [...f.locationIds, id] }));
  };
  const toggleResponsible = (id: string) => {
    setForm((f) => ({ ...f, responsibleUserIds: f.responsibleUserIds.includes(id) ? f.responsibleUserIds.filter((x) => x !== id) : [...f.responsibleUserIds, id] }));
  };

  const patchHours = (weekday: string, patch: Partial<CopaOperatingHours>) => {
    setForm((f) => ({ ...f, operatingHours: f.operatingHours.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)) }));
  };

  const addHoliday = () => {
    if (!newHoliday || form.nonBusinessDays.includes(newHoliday)) return;
    setForm((f) => ({ ...f, nonBusinessDays: [...f.nonBusinessDays, newHoliday].sort() }));
    setNewHoliday("");
  };
  const removeHoliday = (date: string) => {
    setForm((f) => ({ ...f, nonBusinessDays: f.nonBusinessDays.filter((d) => d !== date) }));
  };

  const canSave = form.name.trim() && form.companyId && form.branchId && form.physicalLocation.trim() && form.responsibleUserIds.length > 0 && form.slaHours > 0 && form.capacityPer30min > 0;

  const save = () => {
    if (!canSave) return;
    const payload = { ...form, physicalLocation: form.physicalLocation.trim() };
    if (editingId) {
      updateCopa(editingId, payload);
      showToast("Copa atualizada.");
    } else {
      addCopa(payload);
      showToast("Copa cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (c: Copa) => {
    updateCopa(c.id, { active: !c.active });
    showToast(c.active ? "Copa bloqueada." : "Copa desbloqueada.");
  };

  const remove = (c: Copa) => {
    removeCopa(c.id);
    showToast("Copa removida.");
  };

  return (
    <div className="copas-page">
      <div className="copas-header">
        <div>
          <h1 className="copas-title">Copas</h1>
          <div className="copas-subtitle">Cadastre os espaços Direct Eventos responsáveis pela produção, com SLA, horários e capacidade.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew} disabled={activeCompanies.length === 0}>
          + Nova copa
        </button>
      </div>

      {activeCompanies.length === 0 && <div className="empty-state" style={{ marginBottom: 16 }}>Cadastre uma empresa e uma filial ativas antes de criar copas.</div>}

      <div className="copas-list">
        {copas.map((c) => (
          <div key={c.id} className="card copas-card">
            <div className="copas-card__head">
              <div>
                <div className="copas-card__name">{c.name}</div>
                <div className="copas-card__muted">
                  {companyName(c.companyId)} · {branchName(c.branchId)} · {c.physicalLocation}
                </div>
              </div>
              <span className="status-pill" style={{ background: c.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: c.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                {c.active ? "Ativa" : "Bloqueada"}
              </span>
            </div>
            <div className="copas-card__facts">
              <div>
                <span>SLA mínimo</span>
                <strong>{c.slaHours}h</strong>
              </div>
              <div>
                <span>Capacidade</span>
                <strong>{c.capacityPer30min} pedidos / 30min</strong>
              </div>
              <div>
                <span>Dias de funcionamento</span>
                <strong>{enabledDaysLabel(c)}</strong>
              </div>
              <div>
                <span>Feriados cadastrados</span>
                <strong>{c.nonBusinessDays.length}</strong>
              </div>
              <div>
                <span>Localizações atendidas</span>
                <strong>{(c.locationIds ?? []).length > 0 ? c.locationIds.map(locationName).join(", ") : "—"}</strong>
              </div>
              <div>
                <span>Centros de custo atendidos</span>
                <strong>{c.costCenterCodes.length > 0 ? c.costCenterCodes.join(", ") : "—"}</strong>
              </div>
              <div>
                <span>Responsáveis Direct Eventos</span>
                <strong>{c.responsibleUserIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(", ") || "—"}</strong>
              </div>
            </div>
            <div className="copas-card__actions">
              <button className="link" onClick={() => openEdit(c)}>
                Editar
              </button>
              <button className="link" onClick={() => toggleActive(c)}>
                {c.active ? "Bloquear" : "Desbloquear"}
              </button>
              <button className="copas-remove-btn" onClick={() => remove(c)}>
                Remover
              </button>
            </div>
          </div>
        ))}
        {copas.length === 0 && <div className="empty-state">Nenhuma copa cadastrada ainda.</div>}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={620}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar copa" : "Nova copa"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Copa Matriz SP" />
            </label>
            <div className="copas-fields-grid">
              <label className="field-label">
                Empresa
                <select value={form.companyId} onChange={(e) => setCompany(e.target.value)}>
                  {activeCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Filial
                <select value={form.branchId} onChange={(e) => setBranch(e.target.value)} disabled={branchesForCompany.length === 0}>
                  <option value="">Selecione a filial</option>
                  {branchesForCompany.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field-label">
              Local físico <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(onde fica o restaurante)</span>
              <input value={form.physicalLocation} onChange={(e) => setForm({ ...form, physicalLocation: e.target.value })} placeholder="Ex.: Térreo, ala leste" />
            </label>

            <label className="field-label">
              Localizações atendidas <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(o cliente só vê esta copa se escolher uma dessas localizações no pedido)</span>
              {form.branchId ? (
                locationsForBranch.length > 0 ? (
                  <div className="copas-chip-row">
                    {locationsForBranch.map((l) => (
                      <button key={l.id} type="button" className={form.locationIds.includes(l.id) ? "is-active" : ""} onClick={() => toggleLocation(l.id)}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="field-hint">Nenhuma localização ativa nesta filial ainda. Cadastre em Cadastros › Localizações.</span>
                )
              ) : (
                <span className="field-hint">Selecione a filial para listar as localizações.</span>
              )}
            </label>

            <label className="field-label">
              Centros de custo atendidos
              {form.branchId ? (
                costCentersForBranch.length > 0 ? (
                  <div className="copas-chip-row">
                    {costCentersForBranch.map((cc) => (
                      <button key={cc.id} type="button" className={form.costCenterCodes.includes(cc.code) ? "is-active" : ""} onClick={() => toggleCostCenter(cc.code)}>
                        {cc.code} · {cc.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="field-hint">Nenhum centro de custo ativo nesta filial ainda.</span>
                )
              ) : (
                <span className="field-hint">Selecione a filial para listar os centros de custo.</span>
              )}
            </label>

            <label className="field-label">
              Responsável Sodexo <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(um ou mais, cadastrados em Usuários)</span>
              <UserChipSelect users={activeUsers} selectedIds={form.responsibleUserIds} onToggle={toggleResponsible} />
            </label>

            <div className="copas-fields-grid">
              <label className="field-label">
                SLA <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(horas mínimas de antecedência)</span>
                <input type="number" min={0} value={form.slaHours} onChange={(e) => setForm({ ...form, slaHours: Number(e.target.value) })} />
              </label>
              <label className="field-label">
                Capacidade produtiva <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(pedidos a cada 30min)</span>
                <input type="number" min={0} value={form.capacityPer30min} onChange={(e) => setForm({ ...form, capacityPer30min: Number(e.target.value) })} />
              </label>
            </div>

            <div className="field-label">
              Dias e horário de funcionamento
              <div className="copas-hours-table">
                {form.operatingHours.map((h) => (
                  <div key={h.weekday} className={`copas-hours-row ${h.enabled ? "" : "is-disabled"}`}>
                    <label className="copas-hours-day">
                      <input type="checkbox" checked={h.enabled} onChange={(e) => patchHours(h.weekday, { enabled: e.target.checked })} />
                      {h.weekday}
                    </label>
                    <input type="time" value={h.start} disabled={!h.enabled} onChange={(e) => patchHours(h.weekday, { start: e.target.value })} />
                    <span className="copas-hours-sep">até</span>
                    <input type="time" value={h.end} disabled={!h.enabled} onChange={(e) => patchHours(h.weekday, { end: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="field-label">
              Dias não úteis e feriados
              <div className="copas-holiday-add">
                <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} />
                <button type="button" className="btn btn--outline btn--sm" onClick={addHoliday} disabled={!newHoliday}>
                  + Adicionar
                </button>
              </div>
              {form.nonBusinessDays.length > 0 ? (
                <div className="copas-holiday-list">
                  {form.nonBusinessDays.map((d) => (
                    <span key={d} className="copas-holiday-chip">
                      {new Date(d + "T00:00:00").toLocaleDateString("pt-BR")}
                      <button type="button" onClick={() => removeHoliday(d)} aria-label="Remover data">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="field-hint">Nenhuma data cadastrada.</span>
              )}
            </div>

            <label className="copas-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Copa ativa
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar copa"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
