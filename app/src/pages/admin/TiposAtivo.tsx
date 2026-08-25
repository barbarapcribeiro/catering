import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import type { AssetType, AssetUnitOfMeasure } from "../../types";
import "./TiposAtivo.css";

const EMPTY_UOM: AssetUnitOfMeasure = { id: "", qty: 1, unit: "" };

interface FormState {
  name: string;
  description: string;
  active: boolean;
  unitsOfMeasure: AssetUnitOfMeasure[];
}

const EMPTY_FORM: FormState = { name: "", description: "", active: true, unitsOfMeasure: [] };

export function TiposAtivo() {
  const { assetTypes, addAssetType, updateAssetType, removeAssetType, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [nameFilter, setNameFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [situationFilter, setSituationFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (t: AssetType) => {
    setEditingId(t.id);
    setForm({ name: t.name, description: t.description ?? "", active: t.active, unitsOfMeasure: t.unitsOfMeasure });
    setModalOpen(true);
  };

  const addUomRow = () => {
    setForm((f) => ({ ...f, unitsOfMeasure: [...f.unitsOfMeasure, { ...EMPTY_UOM, id: `uom${Date.now()}` }] }));
  };
  const updateUomRow = (id: string, patch: Partial<AssetUnitOfMeasure>) => {
    setForm((f) => ({ ...f, unitsOfMeasure: f.unitsOfMeasure.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  };
  const removeUomRow = (id: string) => {
    setForm((f) => ({ ...f, unitsOfMeasure: f.unitsOfMeasure.filter((u) => u.id !== id) }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description || undefined,
      active: form.active,
      unitsOfMeasure: form.unitsOfMeasure.filter((u) => u.unit.trim()),
    };
    if (editingId) {
      updateAssetType(editingId, payload);
      showToast("Tipo de ativo atualizado.");
    } else {
      addAssetType(payload);
      showToast("Tipo de ativo cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (t: AssetType) => {
    removeAssetType(t.id);
    showToast("Tipo de ativo removido.");
  };

  const filtered = assetTypes.filter((t) => {
    if (nameFilter && !t.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (descFilter && !(t.description ?? "").toLowerCase().includes(descFilter.toLowerCase())) return false;
    if (situationFilter === "ativo" && !t.active) return false;
    if (situationFilter === "inativo" && t.active) return false;
    return true;
  });

  const clearFilters = () => {
    setNameFilter("");
    setDescFilter("");
    setSituationFilter("todos");
  };

  return (
    <div className="tipos-ativo-page">
      <div className="tipos-ativo-header">
        <h1 className="tipos-ativo-title">Tipo de ativo</h1>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo tipo de ativo
        </button>
      </div>

      <div className="card tipos-ativo-filters">
        <div className="field-row">
          <label className="field-label">
            Nome
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Nome" />
          </label>
          <label className="field-label">
            Descrição
            <input value={descFilter} onChange={(e) => setDescFilter(e.target.value)} placeholder="Descrição" />
          </label>
        </div>
        <label className="field-label" style={{ maxWidth: 220 }}>
          Situação
          <select value={situationFilter} onChange={(e) => setSituationFilter(e.target.value as typeof situationFilter)}>
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>
        <div className="tipos-ativo-filters__actions">
          <button className="btn btn--outline" onClick={clearFilters}>
            Limpar
          </button>
        </div>
      </div>

      <div className="card tipos-ativo-table-card">
        <div className="tipos-ativo-list-title">Resultado da pesquisa &middot; {filtered.length} de {assetTypes.length}</div>
        <div className="tipos-ativo-table">
          <div className="tipos-ativo-table__head">
            <div>Nome</div>
            <div>Descrição</div>
            <div>Unidades de medida</div>
            <div>Situação</div>
            <div>Ações</div>
          </div>
          {filtered.map((t) => (
            <div key={t.id} className="tipos-ativo-table__row">
              <div className="tipos-ativo-table__name">{t.name}</div>
              <div className="tipos-ativo-table__muted">{t.description || "—"}</div>
              <div className="tipos-ativo-table__muted">
                {t.unitsOfMeasure.length > 0 ? t.unitsOfMeasure.map((u) => `${u.qty} ${u.unit}`).join(", ") : "—"}
              </div>
              <div>
                <span className="status-pill" style={{ background: t.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: t.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {t.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="tipos-ativo-table__actions">
                <button className="link" onClick={() => openEdit(t)}>
                  Editar
                </button>
                <button className="link" onClick={() => updateAssetType(t.id, { active: !t.active })}>
                  {t.active ? "Desativar" : "Ativar"}
                </button>
                <button className="tipos-ativo-remove-btn" onClick={() => remove(t)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhum tipo de ativo cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={620}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar tipo de ativo" : "Novo tipo de ativo"}
          </div>
          <div className="modal-form">
            <div className="field-row">
              <label className="field-label">
                Nome
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" />
              </label>
              <label className="field-label">
                Descrição
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" />
              </label>
            </div>
            <label className="field-label" style={{ maxWidth: 220 }}>
              Situação
              <select value={form.active ? "ativo" : "inativo"} onChange={(e) => setForm({ ...form, active: e.target.value === "ativo" })}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </label>

            <div className="tipos-ativo-uom-head">
              <div className="tipos-ativo-section-title">Unidades de medida</div>
              <button type="button" className="tipos-ativo-uom-add" onClick={addUomRow} aria-label="Adicionar unidade de medida">
                +
              </button>
            </div>
            <div className="tipos-ativo-uom-table">
              <div className="tipos-ativo-uom-table__head">
                <div>Quantidade</div>
                <div>Unidade de medida</div>
                <div>Ações</div>
              </div>
              {form.unitsOfMeasure.map((u) => (
                <div key={u.id} className="tipos-ativo-uom-table__row">
                  <input
                    type="number"
                    min={1}
                    value={u.qty}
                    onChange={(e) => updateUomRow(u.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                  <input value={u.unit} onChange={(e) => updateUomRow(u.id, { unit: e.target.value })} placeholder="Ex.: un, L, kg" />
                  <button type="button" className="tipos-ativo-remove-btn" onClick={() => removeUomRow(u.id)}>
                    Remover
                  </button>
                </div>
              ))}
              {form.unitsOfMeasure.length === 0 && <div className="empty-state">Nenhuma unidade de medida adicionada.</div>}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar tipo de ativo"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
