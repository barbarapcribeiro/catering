import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { Brand } from "../../types";
import "./Marcas.css";

const EMPTY_FORM = { name: "", active: true };

export function Marcas() {
  const { brands, branches, addBrand, updateBrand, removeBrand, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const branchCount = (brandId: string) => branches.filter((b) => b.brandId === brandId).length;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditingId(b.id);
    setForm({ name: b.name, active: b.active });
    setModalOpen(true);
  };

  const canSave = form.name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = { name: form.name.trim(), active: form.active };
    if (editingId) {
      updateBrand(editingId, payload);
      showToast("Marca atualizada.");
    } else {
      addBrand(payload);
      showToast("Marca cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (b: Brand) => {
    if (branchCount(b.id) > 0) {
      showToast("Remova as filiais vinculadas antes de excluir a marca.");
      return;
    }
    removeBrand(b.id);
    showToast("Marca removida.");
  };

  return (
    <div className="marcas-page">
      <div className="marcas-header">
        <div>
          <h1 className="marcas-title">Marcas</h1>
          <div className="marcas-subtitle">Marcas operadas pelas filiais, usadas no cadastro de Filial.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Nova marca
        </button>
      </div>

      <div className="card marcas-table-card">
        <div className="marcas-table">
          <div className="marcas-table__head">
            <div>Nome</div>
            <div>Filiais</div>
            <div>Situação</div>
            <div>Ações</div>
          </div>
          {brands.map((b) => (
            <div key={b.id} className="marcas-table__row">
              <div className="marcas-table__name">{b.name}</div>
              <div className="marcas-table__muted">{branchCount(b.id)}</div>
              <div>
                <span className="status-pill" style={{ background: b.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: b.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {b.active ? "Ativa" : "Inativa"}
                </span>
              </div>
              <div className="marcas-table__actions">
                <button className="link" onClick={() => openEdit(b)}>
                  Editar
                </button>
                <button className="link" onClick={() => updateBrand(b.id, { active: !b.active })}>
                  {b.active ? "Desativar" : "Ativar"}
                </button>
                <button className="marcas-remove-btn" onClick={() => remove(b)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {brands.length === 0 && <div className="empty-state">Nenhuma marca cadastrada ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar marca" : "Nova marca"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Sabor Brasil" />
            </label>
            <label className="field-label" style={{ maxWidth: 220 }}>
              Situação
              <select value={form.active ? "ativo" : "inativo"} onChange={(e) => setForm({ ...form, active: e.target.value === "ativo" })}>
                <option value="ativo">Ativa</option>
                <option value="inativo">Inativa</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar marca"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
