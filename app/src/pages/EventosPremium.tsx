import { useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { Modal } from "../components/Modal";
import { useAppData } from "../mock/AppDataContext";
import { money } from "../mock/money";
import { computeKitPrice } from "../mock/pricing";
import { PREMIUM_EVENT_STATUSES, type PremiumEvent, type PremiumEventItem, type PremiumEventStatus } from "../types";
import "./EventosPremium.css";

interface EspacoLine {
  key: string;
  label: string;
  price: string;
}

interface FormState {
  name: string;
  clientName: string;
  costCenterCode: string;
  eventDate: string;
  location: string;
  guestCount: string;
  status: PremiumEventStatus;
  notes: string;
  itemsByProduct: Record<string, number>;
  itemsByKit: Record<string, number>;
  itemsByService: Record<string, number>;
  itemsByDecoration: Record<string, number>;
  espacoLines: EspacoLine[];
}

const EMPTY_FORM: FormState = {
  name: "",
  clientName: "",
  costCenterCode: "",
  eventDate: "",
  location: "",
  guestCount: "",
  status: "Rascunho",
  notes: "",
  itemsByProduct: {},
  itemsByKit: {},
  itemsByService: {},
  itemsByDecoration: {},
  espacoLines: [],
};

const STATUS_STYLE: Record<PremiumEventStatus, { bg: string; color: string }> = {
  Rascunho: { bg: "var(--color-border-soft)", color: "var(--color-text-muted)" },
  Confirmado: { bg: "var(--color-primary-soft)", color: "var(--color-primary)" },
  Concluído: { bg: "var(--color-success-soft)", color: "var(--color-success)" },
  Cancelado: { bg: "var(--color-danger-soft-2, #fbe6e4)", color: "var(--color-danger)" },
};

function eventTotal(items: PremiumEventItem[]) {
  return items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
}

export function EventosPremium() {
  const { premiumEvents, products, kits, serviceCatalog, decorations, costCenters, addPremiumEvent, updatePremiumEvent, removePremiumEvent, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const activeProducts = products.filter((p) => p.active);
  const activeKits = kits.filter((k) => k.active);
  const activeServices = serviceCatalog.filter((s) => s.active);
  const activeDecorations = decorations.filter((d) => d.active);

  const kitPrice = (kitId: string) => {
    const k = kits.find((kk) => kk.id === kitId);
    if (!k) return 0;
    const productsTotal = k.items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);
    const servicesTotal = (k.serviceItems ?? []).reduce((sum, it) => sum + (serviceCatalog.find((s) => s.id === it.serviceId)?.price ?? 0) * it.qty, 0);
    return computeKitPrice(productsTotal + servicesTotal, k.serviceFeePercent);
  };

  const costCenterLabel = (code?: string) => {
    if (!code) return null;
    const cc = costCenters.find((c) => c.code === code);
    return cc ? `${cc.code} · ${cc.name}` : code;
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ev: PremiumEvent) => {
    setEditingId(ev.id);
    const byProduct: Record<string, number> = {};
    const byKit: Record<string, number> = {};
    const byService: Record<string, number> = {};
    const byDecoration: Record<string, number> = {};
    const espacoLines: EspacoLine[] = [];
    ev.items.forEach((it) => {
      if (it.kind === "produto" && it.refId) byProduct[it.refId] = it.qty;
      else if (it.kind === "kit" && it.refId) byKit[it.refId] = it.qty;
      else if (it.kind === "servico" && it.refId) byService[it.refId] = it.qty;
      else if (it.kind === "decoracao" && it.refId) byDecoration[it.refId] = it.qty;
      else if (it.kind === "espaco") espacoLines.push({ key: `${Date.now()}-${espacoLines.length}`, label: it.label, price: String(it.unitPrice) });
    });
    setForm({
      name: ev.name,
      clientName: ev.clientName ?? "",
      costCenterCode: ev.costCenterCode ?? "",
      eventDate: ev.eventDate ?? "",
      location: ev.location ?? "",
      guestCount: ev.guestCount != null ? String(ev.guestCount) : "",
      status: ev.status,
      notes: ev.notes ?? "",
      itemsByProduct: byProduct,
      itemsByKit: byKit,
      itemsByService: byService,
      itemsByDecoration: byDecoration,
      espacoLines,
    });
    setModalOpen(true);
  };

  const setQty = (map: keyof FormState, id: string, qty: number) => {
    setForm((f) => {
      const next = { ...(f[map] as Record<string, number>) };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return { ...f, [map]: next };
    });
  };

  const addEspacoLine = () => {
    setForm((f) => ({ ...f, espacoLines: [...f.espacoLines, { key: `esp${Date.now()}`, label: "", price: "" }] }));
  };
  const updateEspacoLine = (key: string, patch: Partial<EspacoLine>) => {
    setForm((f) => ({ ...f, espacoLines: f.espacoLines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  };
  const removeEspacoLine = (key: string) => {
    setForm((f) => ({ ...f, espacoLines: f.espacoLines.filter((l) => l.key !== key) }));
  };

  const formItems: PremiumEventItem[] = useMemo(() => {
    const items: PremiumEventItem[] = [];
    Object.entries(form.itemsByProduct).forEach(([id, qty]) => {
      const p = products.find((pp) => pp.id === id);
      if (p) items.push({ kind: "produto", refId: id, label: p.name, qty, unitPrice: p.price });
    });
    Object.entries(form.itemsByKit).forEach(([id, qty]) => {
      const k = kits.find((kk) => kk.id === id);
      if (k) items.push({ kind: "kit", refId: id, label: k.name, qty, unitPrice: kitPrice(id) });
    });
    Object.entries(form.itemsByService).forEach(([id, qty]) => {
      const s = serviceCatalog.find((ss) => ss.id === id);
      if (s) items.push({ kind: "servico", refId: id, label: s.name, qty, unitPrice: s.price });
    });
    Object.entries(form.itemsByDecoration).forEach(([id, qty]) => {
      const d = decorations.find((dd) => dd.id === id);
      if (d) items.push({ kind: "decoracao", refId: id, label: d.name, qty, unitPrice: d.price });
    });
    form.espacoLines.forEach((l) => {
      if (l.label.trim()) items.push({ kind: "espaco", label: l.label, qty: 1, unitPrice: parseFloat(l.price.replace(",", ".")) || 0 });
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.itemsByProduct, form.itemsByKit, form.itemsByService, form.itemsByDecoration, form.espacoLines]);

  const formTotal = eventTotal(formItems);

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      clientName: form.clientName || undefined,
      costCenterCode: form.costCenterCode || undefined,
      eventDate: form.eventDate || undefined,
      location: form.location || undefined,
      guestCount: form.guestCount ? parseInt(form.guestCount, 10) || undefined : undefined,
      status: form.status,
      notes: form.notes || undefined,
      items: formItems,
    };
    if (editingId) {
      updatePremiumEvent(editingId, payload);
      showToast("Evento premium atualizado.");
    } else {
      addPremiumEvent(payload);
      showToast("Evento premium criado com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (ev: PremiumEvent) => {
    removePremiumEvent(ev.id);
    showToast("Evento premium removido.");
  };

  const formatDate = (iso?: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

  return (
    <Layout>
      <div className="page-container eventospremium-page">
        <div className="eventospremium-header">
          <div>
            <h1 className="eventospremium-title">Eventos Premium</h1>
            <div className="eventospremium-subtitle">
              Monte eventos personalizados combinando comida, decoração, serviços e aluguel de espaço em um único orçamento.
            </div>
          </div>
          <button className="btn btn--primary" onClick={openNew}>
            + Novo evento premium
          </button>
        </div>

        <div className="eventospremium-grid">
          {premiumEvents.map((ev) => (
            <div key={ev.id} className="card eventospremium-card">
              <div className="eventospremium-card__head">
                <div>
                  <div className="eventospremium-card__name">{ev.name}</div>
                  <div className="eventospremium-card__meta">
                    {ev.clientName || costCenterLabel(ev.costCenterCode) || "Sem cliente definido"}
                  </div>
                </div>
                <span className="status-pill" style={{ background: STATUS_STYLE[ev.status].bg, color: STATUS_STYLE[ev.status].color }}>
                  {ev.status}
                </span>
              </div>

              <div className="eventospremium-card__facts">
                <div>
                  <div className="eventospremium-card__fact-label">Data</div>
                  <div className="eventospremium-card__fact-value">{formatDate(ev.eventDate)}</div>
                </div>
                <div>
                  <div className="eventospremium-card__fact-label">Convidados</div>
                  <div className="eventospremium-card__fact-value">{ev.guestCount ?? "—"}</div>
                </div>
                <div>
                  <div className="eventospremium-card__fact-label">Local</div>
                  <div className="eventospremium-card__fact-value">{ev.location || "—"}</div>
                </div>
              </div>

              <div className="eventospremium-card__items">
                {ev.items.map((it, i) => (
                  <div key={i} className="eventospremium-card__item">
                    <span>
                      {it.label} <span className="eventospremium-card__item-tag">{it.kind}</span>
                    </span>
                    <span>x{it.qty}</span>
                  </div>
                ))}
                {ev.items.length === 0 && <div className="eventospremium-card__item-empty">Nenhum item adicionado ainda.</div>}
              </div>

              <div className="eventospremium-card__footer">
                <div className="eventospremium-card__total">{money(eventTotal(ev.items))}</div>
                <div className="eventospremium-card__actions">
                  <button className="link" onClick={() => openEdit(ev)}>
                    Editar
                  </button>
                  <button className="eventospremium-remove-btn" onClick={() => remove(ev)}>
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
          {premiumEvents.length === 0 && <div className="empty-state">Nenhum evento premium criado ainda.</div>}
        </div>

        {modalOpen && (
          <Modal onClose={() => setModalOpen(false)} width={640}>
            <div className="modal-title" style={{ marginBottom: 18 }}>
              {editingId ? "Editar evento premium" : "Novo evento premium"}
            </div>
            <div className="modal-form">
              <label className="field-label">
                Nome do evento
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Confraternização de fim de ano" />
              </label>
              <div className="field-row">
                <label className="field-label">
                  Cliente <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                  <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Ex.: Diretoria Administrativa" />
                </label>
                <label className="field-label">
                  Centro de custo <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                  <select value={form.costCenterCode} onChange={(e) => setForm({ ...form, costCenterCode: e.target.value })}>
                    <option value="">Nenhum selecionado</option>
                    {costCenters.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="field-row">
                <label className="field-label">
                  Data do evento
                  <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
                </label>
                <label className="field-label">
                  Nº de convidados
                  <input value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value.replace(/\D/g, "") })} placeholder="0" inputMode="numeric" />
                </label>
              </div>
              <div className="field-row">
                <label className="field-label">
                  Local
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex.: Salão de eventos - Unidade Matriz" />
                </label>
                <label className="field-label">
                  Status
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PremiumEventStatus })}>
                    {PREMIUM_EVENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="eventospremium-section-title">Comida — Kits</div>
              <div className="kits-product-picker">
                {activeKits.map((k) => {
                  const qty = form.itemsByKit[k.id] || 0;
                  return (
                    <div key={k.id} className="kits-product-row">
                      <div className="kits-product-row__info">
                        <div className="kits-product-row__name">{k.name}</div>
                        <div className="kits-product-row__price">{money(kitPrice(k.id))}</div>
                      </div>
                      <div className="qty-stepper">
                        <button onClick={() => setQty("itemsByKit", k.id, Math.max(0, qty - 1))}>&minus;</button>
                        <span>{qty}</span>
                        <button onClick={() => setQty("itemsByKit", k.id, qty + 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
                {activeKits.length === 0 && <div className="eventospremium-empty-hint">Nenhum kit ativo cadastrado.</div>}
              </div>

              <div className="eventospremium-section-title">Comida — Produtos avulsos</div>
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
                        <button onClick={() => setQty("itemsByProduct", p.id, Math.max(0, qty - 1))}>&minus;</button>
                        <span>{qty}</span>
                        <button onClick={() => setQty("itemsByProduct", p.id, qty + 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
                {activeProducts.length === 0 && <div className="eventospremium-empty-hint">Nenhum produto ativo cadastrado.</div>}
              </div>

              <div className="eventospremium-section-title">Decoração</div>
              <div className="kits-product-picker">
                {activeDecorations.map((d) => {
                  const qty = form.itemsByDecoration[d.id] || 0;
                  return (
                    <div key={d.id} className="kits-product-row">
                      <div className="kits-product-row__info">
                        <div className="kits-product-row__name">{d.name}</div>
                        <div className="kits-product-row__price">{money(d.price)}</div>
                      </div>
                      <div className="qty-stepper">
                        <button onClick={() => setQty("itemsByDecoration", d.id, Math.max(0, qty - 1))}>&minus;</button>
                        <span>{qty}</span>
                        <button onClick={() => setQty("itemsByDecoration", d.id, qty + 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
                {activeDecorations.length === 0 && <div className="eventospremium-empty-hint">Nenhuma decoração ativa cadastrada.</div>}
              </div>

              <div className="eventospremium-section-title">Serviços</div>
              <div className="kits-product-picker">
                {activeServices.map((sv) => {
                  const qty = form.itemsByService[sv.id] || 0;
                  return (
                    <div key={sv.id} className="kits-product-row">
                      <div className="kits-product-row__info">
                        <div className="kits-product-row__name">{sv.name}</div>
                        <div className="kits-product-row__price">{money(sv.price)}</div>
                      </div>
                      <div className="qty-stepper">
                        <button onClick={() => setQty("itemsByService", sv.id, Math.max(0, qty - 1))}>&minus;</button>
                        <span>{qty}</span>
                        <button onClick={() => setQty("itemsByService", sv.id, qty + 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
                {activeServices.length === 0 && <div className="eventospremium-empty-hint">Nenhum serviço ativo cadastrado.</div>}
              </div>

              <div className="eventospremium-section-title">Aluguel de espaço <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(item livre, sem catálogo)</span></div>
              <div className="eventospremium-espaco-list">
                {form.espacoLines.map((l) => (
                  <div key={l.key} className="eventospremium-espaco-row">
                    <input
                      value={l.label}
                      onChange={(e) => updateEspacoLine(l.key, { label: e.target.value })}
                      placeholder="Ex.: Aluguel do salão de eventos"
                    />
                    <input
                      value={l.price}
                      onChange={(e) => updateEspacoLine(l.key, { price: e.target.value })}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                    <button className="eventospremium-remove-btn" onClick={() => removeEspacoLine(l.key)}>
                      Remover
                    </button>
                  </div>
                ))}
                <button className="btn btn--outline btn--sm" onClick={addEspacoLine} style={{ alignSelf: "flex-start" }}>
                  + Adicionar item de espaço
                </button>
              </div>

              <label className="field-label">
                Observações <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>

              <div className="eventospremium-total-preview">
                Total do evento: <strong>{money(formTotal)}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
                {editingId ? "Salvar alterações" : "Criar evento premium"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
