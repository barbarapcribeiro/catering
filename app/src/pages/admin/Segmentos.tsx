import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { Segment } from "../../types";
import "./Segmentos.css";

const EMPTY_FORM = { name: "", active: true };

export function Segmentos() {
  const { segments, businessUnits, addSegment, updateSegment, removeSegment, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const unitCount = (segmentId: string) => businessUnits.filter((u) => u.segmentId === segmentId).length;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Segment) => {
    setEditingId(s.id);
    setForm({ name: s.name, active: s.active });
    setModalOpen(true);
  };

  const canSave = form.name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = { name: form.name.trim(), active: form.active };
    if (editingId) {
      updateSegment(editingId, payload);
      showToast("Segmento atualizado.");
    } else {
      addSegment(payload);
      showToast("Segmento cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (s: Segment) => {
    if (unitCount(s.id) > 0) {
      showToast("Remova as unidades vinculadas antes de excluir o segmento.");
      return;
    }
    removeSegment(s.id);
    showToast("Segmento removido.");
  };

  return (
    <div className="segmentos-page">
      <div className="segmentos-header">
        <div>
          <h1 className="segmentos-title">Segmentos</h1>
          <div className="segmentos-subtitle">Segmentos de mercado atendidos, usados no cadastro de Unidades.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo segmento
        </button>
      </div>

      <div className="card segmentos-table-card">
        <div className="segmentos-table">
          <div className="segmentos-table__head">
            <div>Nome</div>
            <div>Unidades</div>
            <div>Situação</div>
            <div>Ações</div>
          </div>
          {segments.map((s) => (
            <div key={s.id} className="segmentos-table__row">
              <div className="segmentos-table__name">{s.name}</div>
              <div className="segmentos-table__muted">{unitCount(s.id)}</div>
              <div>
                <span className="status-pill" style={{ background: s.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: s.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {s.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="segmentos-table__actions">
                <button className="link" onClick={() => openEdit(s)}>
                  Editar
                </button>
                <button className="link" onClick={() => updateSegment(s.id, { active: !s.active })}>
                  {s.active ? "Desativar" : "Ativar"}
                </button>
                <button className="segmentos-remove-btn" onClick={() => remove(s)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {segments.length === 0 && <div className="empty-state">Nenhum segmento cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar segmento" : "Novo segmento"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Corporativo" />
            </label>
            <label className="field-label" style={{ maxWidth: 220 }}>
              Situação
              <select value={form.active ? "ativo" : "inativo"} onChange={(e) => setForm({ ...form, active: e.target.value === "ativo" })}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar segmento"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
