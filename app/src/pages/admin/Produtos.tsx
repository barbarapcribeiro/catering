import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { PhotoUpload } from "../../components/PhotoUpload";
import { money } from "../../mock/money";
import { computeProductPrice } from "../../mock/pricing";
import { CATALOG_PAGES, PRODUCT_TYPES, PRODUCT_UNITS, type CatalogPageName, type Product, type ProductType, type ProductUnit } from "../../types";
import "./Produtos.css";

const EMPTY_FORM = {
  name: "",
  type: PRODUCT_TYPES[0] as ProductType,
  unit: PRODUCT_UNITS[0] as ProductUnit,
  costPrice: "",
  marginPercent: "40",
  description: "",
  supplierId: "",
  photoUrl: undefined as string | undefined,
  pages: [] as CatalogPageName[],
  active: true,
};

export function Produtos() {
  const { products, suppliers, addProduct, updateProduct, removeProduct, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [typeFilter, setTypeFilter] = useState<ProductType | "todos">("todos");

  const supplierName = (id?: string) => suppliers.find((s) => s.id === id)?.name;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      type: p.type,
      unit: p.unit,
      costPrice: String(p.costPrice),
      marginPercent: String(p.marginPercent),
      description: p.description ?? "",
      supplierId: p.supplierId ?? "",
      photoUrl: p.photoUrl,
      pages: p.pages ?? [],
      active: p.active,
    });
    setModalOpen(true);
  };

  const togglePage = (page: CatalogPageName) => {
    setForm((f) => ({ ...f, pages: f.pages.includes(page) ? f.pages.filter((x) => x !== page) : [...f.pages, page] }));
  };

  const parsedCostPrice = parseFloat(form.costPrice.replace(",", ".")) || 0;
  const parsedMargin = parseFloat(form.marginPercent.replace(",", ".")) || 0;
  const previewPrice = computeProductPrice(parsedCostPrice, parsedMargin);

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      type: form.type,
      unit: form.unit,
      costPrice: parsedCostPrice,
      marginPercent: parsedMargin,
      description: form.description || undefined,
      supplierId: form.supplierId || undefined,
      photoUrl: form.photoUrl,
      pages: form.pages.length > 0 ? form.pages : undefined,
      active: form.active,
    };
    if (editingId) {
      updateProduct(editingId, payload);
      showToast("Produto atualizado.");
    } else {
      addProduct(payload);
      showToast("Produto cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (p: Product) => {
    updateProduct(p.id, { active: !p.active });
    showToast(p.active ? "Produto desativado." : "Produto ativado.");
  };

  const remove = (p: Product) => {
    removeProduct(p.id);
    showToast("Produto removido.");
  };

  const filtered = typeFilter === "todos" ? products : products.filter((p) => p.type === typeFilter);

  return (
    <div className="produtos-page">
      <div className="produtos-header">
        <div>
          <h1 className="produtos-title">Produtos</h1>
          <div className="produtos-subtitle">Cadastre os produtos avulsos usados nos pedidos e kits.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo produto
        </button>
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={typeFilter === "todos" ? "is-active" : ""} onClick={() => setTypeFilter("todos")}>
          Todos
        </button>
        {PRODUCT_TYPES.map((t) => (
          <button key={t} className={typeFilter === t ? "is-active" : ""} onClick={() => setTypeFilter(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="card produtos-table-card">
        <div className="produtos-table">
          <div className="produtos-table__head">
            <div>Produto</div>
            <div>Tipo</div>
            <div>Unidade</div>
            <div>Preço de venda</div>
            <div>Fornecedor</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {filtered.map((p) => (
            <div key={p.id} className="produtos-table__row">
              <div className="produtos-table__name-cell">
                {p.photoUrl ? (
                  <img className="produtos-table__thumb" src={p.photoUrl} alt="" />
                ) : (
                  <div className="produtos-table__thumb produtos-table__thumb--empty" />
                )}
                <div>
                  <div className="produtos-table__name">{p.name}</div>
                  {p.description && <div className="produtos-table__desc">{p.description}</div>}
                  {p.pages && p.pages.length > 0 && (
                    <div className="produtos-table__pages">
                      {p.pages.map((page) => (
                        <span key={page} className="pill-tag">
                          {page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="pill-tag">{p.type}</span>
              </div>
              <div className="produtos-table__muted">{p.unit}</div>
              <div>
                <div className="produtos-table__price">{money(p.price)}</div>
                <div className="produtos-table__cost">
                  custo {money(p.costPrice)} • margem {p.marginPercent}%
                </div>
              </div>
              <div className="produtos-table__muted">{supplierName(p.supplierId) || "Nenhum selecionado"}</div>
              <div>
                <span className="status-pill" style={{ background: p.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: p.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="produtos-table__actions">
                <button className="link" onClick={() => openEdit(p)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(p)}>
                  {p.active ? "Desativar" : "Ativar"}
                </button>
                <button className="produtos-remove-btn" onClick={() => remove(p)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhum produto encontrado.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar produto" : "Novo produto"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome do produto
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Coca-Cola lata 350ml" />
            </label>
            <div className="field-row">
              <label className="field-label">
                Tipo de produto
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })}>
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Unidade
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as ProductUnit })}>
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-row">
              <label className="field-label">
                Preço de custo (R$)
                <input value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0,00" inputMode="decimal" />
              </label>
              <label className="field-label">
                Margem negociada (%) <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(contrato)</span>
                <input value={form.marginPercent} onChange={(e) => setForm({ ...form, marginPercent: e.target.value })} placeholder="0" inputMode="decimal" />
              </label>
            </div>
            <div className="produtos-price-preview">
              Preço de venda no pedido: <strong>{money(previewPrice)}</strong>
            </div>
            <PhotoUpload value={form.photoUrl} onChange={(v) => setForm({ ...form, photoUrl: v })} label="Foto do produto" />
            <div className="field-label">
              Páginas onde aparece <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional — em quais pedidos esse produto pode ser oferecido)</span>
            </div>
            <div className="produtos-page-chips">
              {CATALOG_PAGES.map((page) => (
                <button key={page} type="button" className={form.pages.includes(page) ? "is-active" : ""} onClick={() => togglePage(page)}>
                  {page}
                </button>
              ))}
            </div>
            <label className="field-label">
              Fornecedor <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Nenhum selecionado</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Descrição
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional" />
            </label>
            <label className="produtos-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Produto ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar produto"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
