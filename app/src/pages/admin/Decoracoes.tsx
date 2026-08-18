import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { PhotoUpload } from "../../components/PhotoUpload";
import { money } from "../../mock/money";
import { DECORATION_CATEGORIES, type Decoration, type DecorationCategory } from "../../types";
import "./Servicos.css";

const EMPTY_FORM = {
  name: "",
  category: DECORATION_CATEGORIES[0] as DecorationCategory,
  description: "",
  price: "",
  photoUrl: undefined as string | undefined,
  active: true,
};

export function Decoracoes() {
  const { decorations, addDecoration, updateDecoration, removeDecoration, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryFilter, setCategoryFilter] = useState<DecorationCategory | "todos">("todos");

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (d: Decoration) => {
    setEditingId(d.id);
    setForm({ name: d.name, category: d.category, description: d.description ?? "", price: String(d.price), photoUrl: d.photoUrl, active: d.active });
    setModalOpen(true);
  };

  const parsedPrice = parseFloat(form.price.replace(",", ".")) || 0;

  const save = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name, category: form.category, description: form.description || undefined, price: parsedPrice, photoUrl: form.photoUrl, active: form.active };
    if (editingId) {
      updateDecoration(editingId, payload);
      showToast("Decoração atualizada.");
    } else {
      addDecoration(payload);
      showToast("Decoração cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (d: Decoration) => {
    updateDecoration(d.id, { active: !d.active });
    showToast(d.active ? "Decoração desativada." : "Decoração ativada.");
  };

  const remove = (d: Decoration) => {
    removeDecoration(d.id);
    showToast("Decoração removida.");
  };

  const filtered = categoryFilter === "todos" ? decorations : decorations.filter((d) => d.category === categoryFilter);

  return (
    <div className="servicos-page">
      <div className="servicos-header">
        <div>
          <h1 className="servicos-title">Decorações</h1>
          <div className="servicos-subtitle">Cadastre itens de decoração usados em eventos e pedidos especiais.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Nova decoração
        </button>
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={categoryFilter === "todos" ? "is-active" : ""} onClick={() => setCategoryFilter("todos")}>
          Todos
        </button>
        {DECORATION_CATEGORIES.map((c) => (
          <button key={c} className={categoryFilter === c ? "is-active" : ""} onClick={() => setCategoryFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="card servicos-table-card">
        <div className="servicos-table">
          <div className="servicos-table__head">
            <div>Decoração</div>
            <div>Categoria</div>
            <div>Preço</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {filtered.map((d) => (
            <div key={d.id} className="servicos-table__row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {d.photoUrl ? (
                  <img src={d.photoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flex: "none" }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 8, border: "1px dashed var(--color-border)", flex: "none" }} />
                )}
                <div>
                  <div className="servicos-table__name">{d.name}</div>
                  {d.description && <div className="servicos-table__desc">{d.description}</div>}
                </div>
              </div>
              <div>
                <span className="pill-tag">{d.category}</span>
              </div>
              <div className="servicos-table__muted">{money(d.price)}</div>
              <div>
                <span className="status-pill" style={{ background: d.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: d.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {d.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="servicos-table__actions">
                <button className="link" onClick={() => openEdit(d)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(d)}>
                  {d.active ? "Desativar" : "Ativar"}
                </button>
                <button className="servicos-remove-btn" onClick={() => remove(d)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhuma decoração encontrada.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar decoração" : "Nova decoração"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome da decoração
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Arranjo de mesa sazonal" />
            </label>
            <label className="field-label">
              Categoria
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DecorationCategory })}>
                {DECORATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Preço (R$)
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" inputMode="decimal" />
            </label>
            <label className="field-label">
              Descrição <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <PhotoUpload value={form.photoUrl} onChange={(v) => setForm({ ...form, photoUrl: v })} label="Foto da decoração" />
            <label className="servicos-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Decoração ativa
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar decoração"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
