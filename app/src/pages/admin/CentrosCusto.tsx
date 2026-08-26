import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { CostCenter } from "../../types";
import "./CentrosCusto.css";

const EMPTY_FORM = { code: "", name: "", companyId: "", branchId: "", areaName: "", managerUserId: "", physicalLocation: "", active: true };

export function CentrosCusto() {
  const { costCenters, orders, companies, branches, users, addCostCenter, updateCostCenter, removeCostCenter, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const activeCompanies = companies.filter((c) => c.active);
  const branchesForCompany = branches.filter((b) => b.active && b.companyId === form.companyId);
  const approverUsers = users.filter((u) => u.active && u.profileId === "prof-gestor");

  const orderCount = (code: string) => orders.filter((o) => o.costCenters?.some((cc) => cc.code === code)).length;
  const companyName = (id?: string) => companies.find((c) => c.id === id)?.name;
  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name;
  const managerName = (id?: string) => users.find((u) => u.id === id)?.name;

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, companyId: activeCompanies[0]?.id ?? "" });
    setModalOpen(true);
  };

  const openEdit = (c: CostCenter) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      name: c.name,
      companyId: c.companyId ?? "",
      branchId: c.branchId ?? "",
      areaName: c.areaName ?? "",
      managerUserId: c.managerUserId ?? "",
      physicalLocation: c.physicalLocation ?? "",
      active: c.active,
    });
    setModalOpen(true);
  };

  const setCompany = (companyId: string) => {
    setForm((f) => ({ ...f, companyId, branchId: "" }));
  };

  const canSave = form.code.trim() && form.name.trim() && form.companyId && form.branchId && form.areaName.trim();

  const save = () => {
    if (!canSave) return;
    const payload = {
      code: form.code,
      name: form.name,
      companyId: form.companyId,
      branchId: form.branchId,
      areaName: form.areaName,
      managerUserId: form.managerUserId || undefined,
      physicalLocation: form.physicalLocation || undefined,
      active: form.active,
    };
    if (editingId) {
      updateCostCenter(editingId, payload);
      showToast("Centro de custo atualizado.");
    } else {
      addCostCenter(payload);
      showToast("Centro de custo cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (c: CostCenter) => {
    updateCostCenter(c.id, { active: !c.active });
    showToast(c.active ? "Centro de custo bloqueado." : "Centro de custo desbloqueado.");
  };

  const remove = (c: CostCenter) => {
    removeCostCenter(c.id);
    showToast("Centro de custo removido.");
  };

  return (
    <div className="centroscusto-page">
      <div className="centroscusto-header">
        <div>
          <h1 className="centroscusto-title">Centros de Custo</h1>
          <div className="centroscusto-subtitle">Cadastre os centros de custo disponíveis para rateio nos pedidos.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew} disabled={activeCompanies.length === 0}>
          + Novo centro de custo
        </button>
      </div>

      {activeCompanies.length === 0 && <div className="empty-state" style={{ marginBottom: 16 }}>Cadastre uma empresa e uma filial ativas antes de criar centros de custo.</div>}

      <div className="card centroscusto-table-card">
        <div className="centroscusto-table">
          <div className="centroscusto-table__head">
            <div>Código</div>
            <div>Nome</div>
            <div>Empresa / Filial</div>
            <div>Responsável</div>
            <div>Pedidos</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {costCenters.map((c) => (
            <div key={c.id} className="centroscusto-table__row">
              <div className="centroscusto-table__code">{c.code}</div>
              <div>
                {c.name}
                {c.areaName && <div className="centroscusto-table__muted">{c.areaName}</div>}
              </div>
              <div className="centroscusto-table__muted">
                {companyName(c.companyId) ?? "—"}
                {c.branchId && <div>{branchName(c.branchId)}</div>}
              </div>
              <div className="centroscusto-table__muted">{managerName(c.managerUserId) || "—"}</div>
              <div className="centroscusto-table__muted">{orderCount(c.code)}</div>
              <div>
                <span className="status-pill" style={{ background: c.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: c.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {c.active ? "Ativo" : "Bloqueado"}
                </span>
              </div>
              <div className="centroscusto-table__actions">
                <button className="link" onClick={() => openEdit(c)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(c)}>
                  {c.active ? "Bloquear" : "Desbloquear"}
                </button>
                <button className="centroscusto-remove-btn" onClick={() => remove(c)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {costCenters.length === 0 && <div className="empty-state">Nenhum centro de custo cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar centro de custo" : "Novo centro de custo"}
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
              Nome da área
              <input value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} placeholder="Ex.: Administração" />
            </label>
            <label className="field-label">
              Código
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex.: CC004" />
            </label>
            <label className="field-label">
              Nome do centro de custo
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Marketing" />
            </label>
            <label className="field-label">
              Responsável pelo centro de custo <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(precisa ter perfil Gestor aprovador)</span>
              <select value={form.managerUserId} onChange={(e) => setForm({ ...form, managerUserId: e.target.value })}>
                <option value="">Selecione o responsável</option>
                {approverUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {approverUsers.length === 0 && <span className="field-hint">Nenhum usuário com perfil Gestor aprovador cadastrado ainda.</span>}
            </label>
            <label className="field-label">
              Local físico <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <input value={form.physicalLocation} onChange={(e) => setForm({ ...form, physicalLocation: e.target.value })} placeholder="Ex.: Torre A, 5º andar" />
            </label>
            <label className="centroscusto-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Centro de custo ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar centro de custo"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
