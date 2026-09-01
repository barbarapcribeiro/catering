import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { UserChipSelect } from "../../components/UserChipSelect";
import type { Branch } from "../../types";
import "./Filiais.css";

const EMPTY_FORM = { companyId: "", name: "", cep: "", plantName: "", brandId: "", managerIds: [] as string[], active: true };

export function Filiais() {
  const { branches, companies, costCenters, users, brands, addBranch, updateBranch, removeBranch, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const activeCompanies = companies.filter((c) => c.active);
  const activeUsers = users.filter((u) => u.active);
  const activeBrands = brands.filter((b) => b.active);
  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "Empresa removida";
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? "—";
  const costCenterCount = (branchId: string) => costCenters.filter((cc) => cc.branchId === branchId).length;
  const managerNames = (ids: string[]) =>
    ids
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, companyId: activeCompanies[0]?.id ?? "" });
    setModalOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingId(b.id);
    setForm({ companyId: b.companyId, name: b.name, cep: b.cep, plantName: b.plantName, brandId: b.brandId, managerIds: b.managerIds, active: b.active });
    setModalOpen(true);
  };

  const toggleManager = (id: string) => {
    setForm((f) => ({ ...f, managerIds: f.managerIds.includes(id) ? f.managerIds.filter((x) => x !== id) : [...f.managerIds, id] }));
  };

  const canSave = form.companyId && form.name.trim() && form.cep.trim() && form.plantName.trim() && form.brandId && form.managerIds.length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = { companyId: form.companyId, name: form.name, cep: form.cep, plantName: form.plantName, brandId: form.brandId, managerIds: form.managerIds, active: form.active };
    if (editingId) {
      updateBranch(editingId, payload);
      showToast("Filial atualizada.");
    } else {
      addBranch(payload);
      showToast("Filial cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (b: Branch) => {
    updateBranch(b.id, { active: !b.active });
    showToast(b.active ? "Filial bloqueada." : "Filial desbloqueada.");
  };

  const remove = (b: Branch) => {
    if (costCenterCount(b.id) > 0) {
      showToast("Remova os centros de custo vinculados antes de excluir a filial.");
      return;
    }
    removeBranch(b.id);
    showToast("Filial removida.");
  };

  return (
    <div className="filiais-page">
      <div className="filiais-header">
        <div>
          <h1 className="filiais-title">Filiais</h1>
          <div className="filiais-subtitle">Cadastre as filiais/plantas de cada empresa.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew} disabled={activeCompanies.length === 0}>
          + Nova filial
        </button>
      </div>

      {activeCompanies.length === 0 && <div className="empty-state" style={{ marginBottom: 16 }}>Cadastre uma empresa ativa antes de criar filiais.</div>}

      <div className="card filiais-table-card">
        <div className="filiais-table">
          <div className="filiais-table__head">
            <div>Empresa</div>
            <div>Nome</div>
            <div>Planta</div>
            <div>CEP</div>
            <div>Marca</div>
            <div>Responsáveis</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {branches.map((b) => (
            <div key={b.id} className="filiais-table__row">
              <div className="filiais-table__muted">{companyName(b.companyId)}</div>
              <div className="filiais-table__name">{b.name}</div>
              <div className="filiais-table__muted">{b.plantName}</div>
              <div className="filiais-table__muted">{b.cep}</div>
              <div className="filiais-table__muted">{brandName(b.brandId)}</div>
              <div className="filiais-table__muted">{managerNames(b.managerIds) || "—"}</div>
              <div>
                <span className="status-pill" style={{ background: b.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: b.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {b.active ? "Ativa" : "Bloqueada"}
                </span>
              </div>
              <div className="filiais-table__actions">
                <button className="link" onClick={() => openEdit(b)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(b)}>
                  {b.active ? "Bloquear" : "Desbloquear"}
                </button>
                <button className="filiais-remove-btn" onClick={() => remove(b)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {branches.length === 0 && <div className="empty-state">Nenhuma filial cadastrada ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={520}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar filial" : "Nova filial"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Empresa
              <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                {activeCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Filial Campinas" />
            </label>
            <label className="field-label">
              CEP
              <input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" />
            </label>
            <label className="field-label">
              Nome da planta
              <input value={form.plantName} onChange={(e) => setForm({ ...form, plantName: e.target.value })} placeholder="Ex.: Planta CPS-1" />
            </label>
            <label className="field-label">
              Marca <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(cadastradas em Cadastros &rsaquo; Marcas)</span>
              <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                <option value="">Selecione a marca</option>
                {activeBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            {activeBrands.length === 0 && <span className="field-hint">Nenhuma marca ativa cadastrada. Cadastre em Cadastros &rsaquo; Marcas.</span>}
            <label className="field-label">
              Responsável pela filial <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(um ou mais, cadastrados em Usuários)</span>
              <UserChipSelect users={activeUsers} selectedIds={form.managerIds} onToggle={toggleManager} />
            </label>
            <label className="filiais-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Filial ativa
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar filial"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
