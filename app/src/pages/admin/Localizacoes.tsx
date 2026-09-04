import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { DeliveryLocation } from "../../types";
import "./CentrosCusto.css";

const EMPTY_FORM = { name: "", companyId: "", branchId: "", active: true };

export function Localizacoes() {
  const { locations, companies, branches, addLocation, updateLocation, removeLocation, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const activeCompanies = companies.filter((c) => c.active);
  const branchesForCompany = branches.filter((b) => b.active && b.companyId === form.companyId);

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "—";
  const companyOfBranch = (branchId: string) => branches.find((b) => b.id === branchId)?.companyId ?? "";

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, companyId: activeCompanies[0]?.id ?? "" });
    setModalOpen(true);
  };

  const openEdit = (l: DeliveryLocation) => {
    setEditingId(l.id);
    setForm({ name: l.name, companyId: companyOfBranch(l.branchId), branchId: l.branchId, active: l.active });
    setModalOpen(true);
  };

  const setCompany = (companyId: string) => {
    setForm((f) => ({ ...f, companyId, branchId: "" }));
  };

  const canSave = form.name.trim() && form.branchId;

  const save = () => {
    if (!canSave) return;
    const payload = { name: form.name, branchId: form.branchId, active: form.active };
    if (editingId) {
      updateLocation(editingId, payload);
      showToast("Localização atualizada.");
    } else {
      addLocation(payload);
      showToast("Localização cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (l: DeliveryLocation) => {
    updateLocation(l.id, { active: !l.active });
    showToast(l.active ? "Localização bloqueada." : "Localização desbloqueada.");
  };

  const remove = (l: DeliveryLocation) => {
    removeLocation(l.id);
    showToast("Localização removida.");
  };

  return (
    <div className="centroscusto-page">
      <div className="centroscusto-header">
        <div>
          <h1 className="centroscusto-title">Localizações</h1>
          <div className="centroscusto-subtitle">Cadastre os locais de entrega dentro de cada filial (salas, recepção, auditório...). Aparecem nos pedidos que exigem entrega.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew} disabled={activeCompanies.length === 0}>
          + Nova localização
        </button>
      </div>

      {activeCompanies.length === 0 && <div className="empty-state" style={{ marginBottom: 16 }}>Cadastre uma empresa e uma filial ativas antes de criar localizações.</div>}

      <div className="card centroscusto-table-card">
        <div className="centroscusto-table" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}>
          <div className="centroscusto-table__head" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}>
            <div>Nome</div>
            <div>Filial</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {locations.map((l) => (
            <div key={l.id} className="centroscusto-table__row" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr" }}>
              <div>{l.name}</div>
              <div className="centroscusto-table__muted">{branchName(l.branchId)}</div>
              <div>
                <span className="status-pill" style={{ background: l.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: l.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {l.active ? "Ativa" : "Bloqueada"}
                </span>
              </div>
              <div className="centroscusto-table__actions">
                <button className="link" onClick={() => openEdit(l)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(l)}>
                  {l.active ? "Bloquear" : "Desbloquear"}
                </button>
                <button className="centroscusto-remove-btn" onClick={() => remove(l)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {locations.length === 0 && <div className="empty-state">Nenhuma localização cadastrada ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar localização" : "Nova localização"}
          </div>
          <div className="modal-form">
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
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} disabled={branchesForCompany.length === 0}>
                <option value="">Selecione a filial</option>
                {branchesForCompany.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {branchesForCompany.length === 0 && <span className="field-hint">Cadastre uma filial ativa para esta empresa.</span>}
            </label>
            <label className="field-label">
              Nome da localização
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Sala 1, Recepção, Auditório" />
            </label>
            <label className="centroscusto-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Localização ativa
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar localização"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
