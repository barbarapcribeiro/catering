import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { SUPPLIER_CATEGORIES, type Supplier, type SupplierCategory } from "../../types";
import "./Fornecedores.css";

const EMPTY_FORM = {
  name: "",
  category: SUPPLIER_CATEGORIES[0] as SupplierCategory,
  cnpj: "",
  contactName: "",
  phone: "",
  email: "",
  active: true,
};

export function Fornecedores() {
  const { suppliers, addSupplier, updateSupplier, removeSupplier, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      cnpj: s.cnpj ?? "",
      contactName: s.contactName ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      active: s.active,
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateSupplier(editingId, form);
      showToast("Fornecedor atualizado.");
    } else {
      addSupplier(form);
      showToast("Fornecedor cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (s: Supplier) => {
    updateSupplier(s.id, { active: !s.active });
    showToast(s.active ? "Fornecedor desativado." : "Fornecedor ativado.");
  };

  const remove = (s: Supplier) => {
    removeSupplier(s.id);
    showToast("Fornecedor removido.");
  };

  return (
    <div className="fornecedores-page">
      <div className="fornecedores-header">
        <div>
          <h1 className="fornecedores-title">Fornecedores</h1>
          <div className="fornecedores-subtitle">Cadastre e gerencie os fornecedores usados no catálogo de produtos.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo fornecedor
        </button>
      </div>

      <div className="card fornecedores-table-card">
        <div className="fornecedores-table">
          <div className="fornecedores-table__head">
            <div>Nome</div>
            <div>Categoria</div>
            <div>Contato</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {suppliers.map((s) => (
            <div key={s.id} className="fornecedores-table__row">
              <div>
                <div className="fornecedores-table__name">{s.name}</div>
                {s.cnpj && <div className="fornecedores-table__cnpj">{s.cnpj}</div>}
              </div>
              <div>
                <span className="pill-tag">{s.category}</span>
              </div>
              <div className="fornecedores-table__contact">
                <div>{s.contactName || "—"}</div>
                <div className="fornecedores-table__contact-sub">
                  {s.phone || ""}
                  {s.phone && s.email ? " • " : ""}
                  {s.email || ""}
                </div>
              </div>
              <div>
                <span className={`status-pill ${s.active ? "is-active" : "is-inactive"}`} style={{ background: s.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: s.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {s.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="fornecedores-table__actions">
                <button className="link" onClick={() => openEdit(s)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(s)}>
                  {s.active ? "Desativar" : "Ativar"}
                </button>
                <button className="fornecedores-remove-btn" onClick={() => remove(s)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {suppliers.length === 0 && <div className="empty-state">Nenhum fornecedor cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar fornecedor" : "Novo fornecedor"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome do fornecedor
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Distribuidora Boa Mesa Ltda." />
            </label>
            <label className="field-label">
              Categoria
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SupplierCategory })}>
                {SUPPLIER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-row">
              <label className="field-label">
                CNPJ
                <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
              </label>
              <label className="field-label">
                Contato
                <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Nome do contato" />
              </label>
            </div>
            <div className="field-row">
              <label className="field-label">
                Telefone
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 0000-0000" />
              </label>
              <label className="field-label">
                E-mail
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@fornecedor.com.br" />
              </label>
            </div>
            <label className="fornecedores-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Fornecedor ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar fornecedor"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
