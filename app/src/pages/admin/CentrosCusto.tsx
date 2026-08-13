import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { CostCenter } from "../../types";
import "./CentrosCusto.css";

const EMPTY_FORM = { code: "", name: "", manager: "", active: true };

export function CentrosCusto() {
  const { costCenters, orders, addCostCenter, updateCostCenter, removeCostCenter, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const orderCount = (code: string) => orders.filter((o) => o.costCenters?.some((cc) => cc.code === code)).length;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: CostCenter) => {
    setEditingId(c.id);
    setForm({ code: c.code, name: c.name, manager: c.manager ?? "", active: c.active });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    const payload = { code: form.code, name: form.name, manager: form.manager || undefined, active: form.active };
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
        <button className="btn btn--primary" onClick={openNew}>
          + Novo centro de custo
        </button>
      </div>

      <div className="card centroscusto-table-card">
        <div className="centroscusto-table">
          <div className="centroscusto-table__head">
            <div>Código</div>
            <div>Nome</div>
            <div>Responsável</div>
            <div>Pedidos</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {costCenters.map((c) => (
            <div key={c.id} className="centroscusto-table__row">
              <div className="centroscusto-table__code">{c.code}</div>
              <div>{c.name}</div>
              <div className="centroscusto-table__muted">{c.manager || "—"}</div>
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
        <Modal onClose={() => setModalOpen(false)} width={440}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar centro de custo" : "Novo centro de custo"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Código
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex.: CC004" />
            </label>
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Marketing" />
            </label>
            <label className="field-label">
              Responsável <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="Nome do gestor responsável" />
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
            <button className="btn btn--primary" disabled={!form.code.trim() || !form.name.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar centro de custo"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
