import { useMemo, useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { money } from "../../mock/money";
import { computeKitPrice } from "../../mock/pricing";
import type { Kit, KitItem } from "../../types";
import "./Kits.css";

interface FormState {
  name: string;
  description: string;
  itemsByProduct: Record<string, number>;
  serviceFeePercent: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  itemsByProduct: {},
  serviceFeePercent: "10",
  active: true,
};

export function Kits() {
  const { kits, products, addKit, updateKit, removeKit, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const activeProducts = products.filter((p) => p.active);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Produto removido";
  // Kits são compostos pelos produtos já com o preço final (custo + margem), não pelo custo.
  const productFinalPrice = (id: string) => products.find((p) => p.id === id)?.price ?? 0;

  const itemsTotal = (items: KitItem[]) => items.reduce((sum, it) => sum + productFinalPrice(it.productId) * it.qty, 0);
  const kitPrice = (k: Kit) => computeKitPrice(itemsTotal(k.items), k.serviceFeePercent);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (k: Kit) => {
    setEditingId(k.id);
    const byProduct: Record<string, number> = {};
    k.items.forEach((it) => (byProduct[it.productId] = it.qty));
    setForm({
      name: k.name,
      description: k.description ?? "",
      itemsByProduct: byProduct,
      serviceFeePercent: String(k.serviceFeePercent),
      active: k.active,
    });
    setModalOpen(true);
  };

  const setQty = (productId: string, qty: number) => {
    setForm((f) => {
      const next = { ...f.itemsByProduct };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return { ...f, itemsByProduct: next };
    });
  };

  const formItems: KitItem[] = useMemo(
    () => Object.entries(form.itemsByProduct).map(([productId, qty]) => ({ productId, qty })),
    [form.itemsByProduct],
  );
  const formItemsTotal = itemsTotal(formItems);
  const parsedFee = parseFloat(form.serviceFeePercent.replace(",", ".")) || 0;
  const formKitPrice = computeKitPrice(formItemsTotal, parsedFee);

  const save = () => {
    if (!form.name.trim() || formItems.length === 0) return;
    const payload = {
      name: form.name,
      description: form.description || undefined,
      items: formItems,
      serviceFeePercent: parsedFee,
      active: form.active,
    };
    if (editingId) {
      updateKit(editingId, payload);
      showToast("Kit atualizado.");
    } else {
      addKit(payload);
      showToast("Kit cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (k: Kit) => {
    updateKit(k.id, { active: !k.active });
    showToast(k.active ? "Kit desativado." : "Kit ativado.");
  };

  const remove = (k: Kit) => {
    removeKit(k.id);
    showToast("Kit removido.");
  };

  return (
    <div className="kits-page">
      <div className="kits-header">
        <div>
          <h1 className="kits-title">Kits</h1>
          <div className="kits-subtitle">Monte combos a partir dos produtos já cadastrados (preço final) + taxa de serviço.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew} disabled={activeProducts.length === 0}>
          + Novo kit
        </button>
      </div>
      {activeProducts.length === 0 && <div className="kits-empty-hint">Cadastre ao menos um produto ativo antes de criar um kit.</div>}

      <div className="kits-grid">
        {kits.map((k) => (
          <div key={k.id} className="card kits-card">
            <div className="kits-card__head">
              <div>
                <div className="kits-card__name">{k.name}</div>
                {k.description && <div className="kits-card__desc">{k.description}</div>}
              </div>
              <span className="status-pill" style={{ background: k.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: k.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                {k.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="kits-card__items">
              {k.items.map((it) => (
                <div key={it.productId} className="kits-card__item">
                  <span>{productName(it.productId)}</span>
                  <span className="kits-card__item-qty">x{it.qty}</span>
                </div>
              ))}
            </div>
            <div className="kits-card__footer">
              <div>
                <div className="kits-card__price">{money(kitPrice(k))}</div>
                <div className="kits-card__fee">
                  itens {money(itemsTotal(k.items))} + taxa {k.serviceFeePercent}%
                </div>
              </div>
              <div className="kits-card__actions">
                <button className="link" onClick={() => openEdit(k)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(k)}>
                  {k.active ? "Desativar" : "Ativar"}
                </button>
                <button className="kits-remove-btn" onClick={() => remove(k)}>
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
        {kits.length === 0 && <div className="empty-state">Nenhum kit cadastrado ainda.</div>}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={560}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar kit" : "Novo kit"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome do kit
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Combo Reunião Rápida" />
            </label>
            <label className="field-label">
              Descrição <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="field-label">Produtos do kit (preço final já com margem)</div>
            <div className="kits-product-picker">
              {activeProducts.map((p) => {
                const qty = form.itemsByProduct[p.id] || 0;
                return (
                  <div key={p.id} className="kits-product-row">
                    <div className="kits-product-row__info">
                      <div className="kits-product-row__name">{p.name}</div>
                      <div className="kits-product-row__price">{money(p.price)}</div>
                    </div>
                    <div className="qty-stepper">
                      <button onClick={() => setQty(p.id, Math.max(0, qty - 1))}>&minus;</button>
                      <span>{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <label className="field-label">
              Taxa de serviço (%) <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(editável no MVP)</span>
              <input value={form.serviceFeePercent} onChange={(e) => setForm({ ...form, serviceFeePercent: e.target.value })} placeholder="10" inputMode="decimal" />
            </label>
            <div className="kits-price-preview">
              Itens: {money(formItemsTotal)} + taxa de serviço ({parsedFee || 0}%) = <strong>{money(formKitPrice)}</strong>
            </div>
            <label className="kits-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Kit ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim() || formItems.length === 0} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar kit"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
