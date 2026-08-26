import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { CostCenterChipSelect } from "../../components/CostCenterChipSelect";
import { money } from "../../mock/money";
import { SERVICE_CATALOG_CATEGORIES, type ServiceCatalogCategory, type ServiceCatalogItem } from "../../types";
import "./Servicos.css";

const EMPTY_FORM = {
  name: "",
  category: SERVICE_CATALOG_CATEGORIES[0] as ServiceCatalogCategory,
  description: "",
  price: "",
  allowedCostCenterCodes: [] as string[],
  active: true,
};

export function Servicos() {
  const { serviceCatalog, costCenters, addServiceCatalogItem, updateServiceCatalogItem, removeServiceCatalogItem, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryFilter, setCategoryFilter] = useState<ServiceCatalogCategory | "todos">("todos");

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: ServiceCatalogItem) => {
    setEditingId(s.id);
    setForm({ name: s.name, category: s.category, description: s.description ?? "", price: String(s.price), allowedCostCenterCodes: s.allowedCostCenterCodes ?? [], active: s.active });
    setModalOpen(true);
  };

  const toggleCostCenter = (code: string) => {
    setForm((f) => ({ ...f, allowedCostCenterCodes: f.allowedCostCenterCodes.includes(code) ? f.allowedCostCenterCodes.filter((c) => c !== code) : [...f.allowedCostCenterCodes, code] }));
  };

  const parsedPrice = parseFloat(form.price.replace(",", ".")) || 0;

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description || undefined,
      price: parsedPrice,
      allowedCostCenterCodes: form.allowedCostCenterCodes.length > 0 ? form.allowedCostCenterCodes : undefined,
      active: form.active,
    };
    if (editingId) {
      updateServiceCatalogItem(editingId, payload);
      showToast("Serviço atualizado.");
    } else {
      addServiceCatalogItem(payload);
      showToast("Serviço cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (s: ServiceCatalogItem) => {
    updateServiceCatalogItem(s.id, { active: !s.active });
    showToast(s.active ? "Serviço desativado." : "Serviço ativado.");
  };

  const remove = (s: ServiceCatalogItem) => {
    removeServiceCatalogItem(s.id);
    showToast("Serviço removido.");
  };

  const filtered = categoryFilter === "todos" ? serviceCatalog : serviceCatalog.filter((s) => s.category === categoryFilter);

  return (
    <div className="servicos-page">
      <div className="servicos-header">
        <div>
          <h1 className="servicos-title">Serviços</h1>
          <div className="servicos-subtitle">Cadastre os serviços disponíveis, como limpeza, retirada de itens e recepção.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo serviço
        </button>
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={categoryFilter === "todos" ? "is-active" : ""} onClick={() => setCategoryFilter("todos")}>
          Todos
        </button>
        {SERVICE_CATALOG_CATEGORIES.map((c) => (
          <button key={c} className={categoryFilter === c ? "is-active" : ""} onClick={() => setCategoryFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="card servicos-table-card">
        <div className="servicos-table">
          <div className="servicos-table__head">
            <div>Serviço</div>
            <div>Categoria</div>
            <div>Preço</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {filtered.map((s) => (
            <div key={s.id} className="servicos-table__row">
              <div>
                <div className="servicos-table__name">{s.name}</div>
                {s.description && <div className="servicos-table__desc">{s.description}</div>}
                {s.allowedCostCenterCodes && s.allowedCostCenterCodes.length > 0 && (
                  <div className="servicos-table__cc-restrict">Restrito: {s.allowedCostCenterCodes.join(", ")}</div>
                )}
              </div>
              <div>
                <span className="pill-tag">{s.category}</span>
              </div>
              <div className="servicos-table__muted">{money(s.price)}</div>
              <div>
                <span className="status-pill" style={{ background: s.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: s.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {s.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="servicos-table__actions">
                <button className="link" onClick={() => openEdit(s)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(s)}>
                  {s.active ? "Desativar" : "Ativar"}
                </button>
                <button className="servicos-remove-btn" onClick={() => remove(s)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhum serviço encontrado.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar serviço" : "Novo serviço"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome do serviço
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Limpeza pós-evento" />
            </label>
            <label className="field-label">
              Categoria
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCatalogCategory })}>
                {SERVICE_CATALOG_CATEGORIES.map((c) => (
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
            <div className="field-label">
              Centros de custo autorizados <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional — vazio libera para todos)</span>
            </div>
            <CostCenterChipSelect costCenters={costCenters.filter((c) => c.active)} selectedCodes={form.allowedCostCenterCodes} onToggle={toggleCostCenter} />
            <label className="servicos-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Serviço ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar serviço"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
