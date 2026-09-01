import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { AttachmentsField } from "../../components/AttachmentsField";
import type { BusinessUnit, OrderAttachment } from "../../types";
import "./Unidades.css";

interface FormState {
  segmentId: string;
  name: string;
  contract: string;
  attachments: OrderAttachment[];
  active: boolean;
}

const EMPTY_FORM: FormState = { segmentId: "", name: "", contract: "", attachments: [], active: true };

export function Unidades() {
  const { segments, businessUnits, companies, addBusinessUnit, updateBusinessUnit, removeBusinessUnit, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const activeSegments = segments.filter((s) => s.active);
  const segmentName = (id: string) => segments.find((s) => s.id === id)?.name ?? "—";
  const companyCount = (unitId: string) => companies.filter((c) => c.unitId === unitId).length;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (u: BusinessUnit) => {
    setEditingId(u.id);
    setForm({ segmentId: u.segmentId, name: u.name, contract: u.contract, attachments: u.attachments ?? [], active: u.active });
    setModalOpen(true);
  };

  const canSave = form.segmentId && form.name.trim() && form.contract.trim();

  const save = () => {
    if (!canSave) return;
    const payload = {
      segmentId: form.segmentId,
      name: form.name.trim(),
      contract: form.contract.trim(),
      attachments: form.attachments.length ? form.attachments : undefined,
      active: form.active,
    };
    if (editingId) {
      updateBusinessUnit(editingId, payload);
      showToast("Unidade atualizada.");
    } else {
      addBusinessUnit(payload);
      showToast("Unidade cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (u: BusinessUnit) => {
    if (companyCount(u.id) > 0) {
      showToast("Remova as empresas vinculadas antes de excluir a unidade.");
      return;
    }
    removeBusinessUnit(u.id);
    showToast("Unidade removida.");
  };

  return (
    <div className="unidades-page">
      <div className="unidades-header">
        <div>
          <h1 className="unidades-title">Unidades</h1>
          <div className="unidades-subtitle">Unidades Direct Eventos, vinculadas a um segmento e a um contrato.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Nova unidade
        </button>
      </div>

      <div className="card unidades-table-card">
        <div className="unidades-table">
          <div className="unidades-table__head">
            <div>Segmento</div>
            <div>Nome</div>
            <div>Contrato</div>
            <div>Anexos</div>
            <div>Empresas</div>
            <div>Situação</div>
            <div>Ações</div>
          </div>
          {businessUnits.map((u) => (
            <div key={u.id} className="unidades-table__row">
              <div>
                <span className="pill-tag">{segmentName(u.segmentId)}</span>
              </div>
              <div className="unidades-table__name">{u.name}</div>
              <div className="unidades-table__muted">{u.contract}</div>
              <div className="unidades-table__muted">{u.attachments?.length ?? 0}</div>
              <div className="unidades-table__muted">{companyCount(u.id)}</div>
              <div>
                <span className="status-pill" style={{ background: u.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: u.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {u.active ? "Ativa" : "Inativa"}
                </span>
              </div>
              <div className="unidades-table__actions">
                <button className="link" onClick={() => openEdit(u)}>
                  Editar
                </button>
                <button className="link" onClick={() => updateBusinessUnit(u.id, { active: !u.active })}>
                  {u.active ? "Desativar" : "Ativar"}
                </button>
                <button className="unidades-remove-btn" onClick={() => remove(u)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {businessUnits.length === 0 && <div className="empty-state">Nenhuma unidade cadastrada ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={560}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar unidade" : "Nova unidade"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Segmento
              <select value={form.segmentId} onChange={(e) => setForm({ ...form, segmentId: e.target.value })}>
                <option value="">Selecione o segmento</option>
                {activeSegments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {activeSegments.length === 0 && <span className="field-hint">Nenhum segmento ativo cadastrado. Cadastre em Cadastros &rsaquo; Segmentos.</span>}
            <label className="field-label">
              Nome unidade Direct Eventos
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Unidade SP Corporativo" />
            </label>
            <label className="field-label">
              Contrato
              <input value={form.contract} onChange={(e) => setForm({ ...form, contract: e.target.value })} placeholder="Ex.: CT-2026-001" />
            </label>
            <AttachmentsField label="Anexo" value={form.attachments} onChange={(attachments) => setForm({ ...form, attachments })} />
            <label className="unidades-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Unidade ativa
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar unidade"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
