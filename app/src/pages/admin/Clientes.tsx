import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { Client } from "../../types";
import "./Clientes.css";

const EMPTY_FORM = { name: "", active: true };

export function Clientes() {
  const { clients, segments, addClient, updateClient, removeClient, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const segmentCount = (clientId: string) => segments.filter((s) => s.clientId === clientId).length;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingId(c.id);
    setForm({ name: c.name, active: c.active });
    setModalOpen(true);
  };

  const canSave = form.name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = { name: form.name.trim(), active: form.active };
    if (editingId) {
      updateClient(editingId, payload);
      showToast("Cliente atualizado.");
    } else {
      addClient(payload);
      showToast("Cliente cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (c: Client) => {
    if (segmentCount(c.id) > 0) {
      showToast("Remova os segmentos vinculados antes de excluir o cliente.");
      return;
    }
    removeClient(c.id);
    showToast("Cliente removido.");
  };

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <div>
          <h1 className="clientes-title">Clientes</h1>
          <div className="clientes-subtitle">Nível mais alto da hierarquia (Cliente → Segmento → Unidade → Empresa → Filial → Centro de Custo).</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo cliente
        </button>
      </div>

      <div className="card clientes-table-card">
        <div className="clientes-table">
          <div className="clientes-table__head">
            <div>Nome</div>
            <div>Segmentos</div>
            <div>Situação</div>
            <div>Ações</div>
          </div>
          {clients.map((c) => (
            <div key={c.id} className="clientes-table__row">
              <div className="clientes-table__name">{c.name}</div>
              <div className="clientes-table__muted">{segmentCount(c.id)}</div>
              <div>
                <span className="status-pill" style={{ background: c.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: c.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {c.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="clientes-table__actions">
                <button className="link" onClick={() => openEdit(c)}>
                  Editar
                </button>
                <button className="link" onClick={() => updateClient(c.id, { active: !c.active })}>
                  {c.active ? "Desativar" : "Ativar"}
                </button>
                <button className="clientes-remove-btn" onClick={() => remove(c)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {clients.length === 0 && <div className="empty-state">Nenhum cliente cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar cliente" : "Novo cliente"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Sodexo Brasil" />
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
              {editingId ? "Salvar alterações" : "Cadastrar cliente"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
