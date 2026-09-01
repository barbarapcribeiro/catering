import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { UserChipSelect } from "../../components/UserChipSelect";
import { COMPANY_TYPES, type Company } from "../../types";
import "./Empresas.css";

const EMPTY_FORM = { type: COMPANY_TYPES[0] as (typeof COMPANY_TYPES)[number], name: "", tradeName: "", cnpj: "", accountManagerIds: [] as string[], active: true };

export function Empresas() {
  const { companies, branches, users, addCompany, updateCompany, removeCompany, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const activeUsers = users.filter((u) => u.active);
  const branchCount = (companyId: string) => branches.filter((b) => b.companyId === companyId).length;
  const managerNames = (ids: string[]) =>
    ids
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditingId(c.id);
    setForm({ type: c.type, name: c.name, tradeName: c.tradeName ?? "", cnpj: c.cnpj, accountManagerIds: c.accountManagerIds, active: c.active });
    setModalOpen(true);
  };

  const toggleManager = (id: string) => {
    setForm((f) => ({ ...f, accountManagerIds: f.accountManagerIds.includes(id) ? f.accountManagerIds.filter((x) => x !== id) : [...f.accountManagerIds, id] }));
  };

  const canSave = form.name.trim() && form.cnpj.trim() && form.accountManagerIds.length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = { type: form.type, name: form.name, tradeName: form.tradeName || undefined, cnpj: form.cnpj, accountManagerIds: form.accountManagerIds, active: form.active };
    if (editingId) {
      updateCompany(editingId, payload);
      showToast("Empresa atualizada.");
    } else {
      addCompany(payload);
      showToast("Empresa cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (c: Company) => {
    updateCompany(c.id, { active: !c.active });
    showToast(c.active ? "Empresa bloqueada." : "Empresa desbloqueada.");
  };

  const remove = (c: Company) => {
    if (branchCount(c.id) > 0) {
      showToast("Remova as filiais vinculadas antes de excluir a empresa.");
      return;
    }
    removeCompany(c.id);
    showToast("Empresa removida.");
  };

  return (
    <div className="empresas-page">
      <div className="empresas-header">
        <div>
          <h1 className="empresas-title">Empresas</h1>
          <div className="empresas-subtitle">Cadastre as empresas clientes e seus responsáveis de conta.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Nova empresa
        </button>
      </div>

      <div className="card empresas-table-card">
        <div className="empresas-table">
          <div className="empresas-table__head">
            <div>Tipo</div>
            <div>Nome</div>
            <div>CNPJ</div>
            <div>Responsáveis</div>
            <div>Filiais</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {companies.map((c) => (
            <div key={c.id} className="empresas-table__row">
              <div>
                <span className="pill-tag">{c.type}</span>
              </div>
              <div>
                <div className="empresas-table__name">{c.name}</div>
                {c.tradeName && <div className="empresas-table__muted">{c.tradeName}</div>}
              </div>
              <div className="empresas-table__muted">{c.cnpj}</div>
              <div className="empresas-table__muted">{managerNames(c.accountManagerIds) || "—"}</div>
              <div className="empresas-table__muted">{branchCount(c.id)}</div>
              <div>
                <span className="status-pill" style={{ background: c.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: c.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {c.active ? "Ativa" : "Bloqueada"}
                </span>
              </div>
              <div className="empresas-table__actions">
                <button className="link" onClick={() => openEdit(c)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(c)}>
                  {c.active ? "Bloquear" : "Desbloquear"}
                </button>
                <button className="empresas-remove-btn" onClick={() => remove(c)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && <div className="empty-state">Nenhuma empresa cadastrada ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={520}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar empresa" : "Nova empresa"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Tipo
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as (typeof COMPANY_TYPES)[number] })}>
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Razão social" />
            </label>
            <label className="field-label">
              Nome Fantasia <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <input value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} placeholder="Nome fantasia" />
            </label>
            <label className="field-label">
              CNPJ
              <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
            </label>
            <label className="field-label">
              Responsável pela conta <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(um ou mais, cadastrados em Usuários)</span>
              <UserChipSelect users={activeUsers} selectedIds={form.accountManagerIds} onToggle={toggleManager} />
            </label>
            <label className="empresas-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Empresa ativa
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar empresa"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
