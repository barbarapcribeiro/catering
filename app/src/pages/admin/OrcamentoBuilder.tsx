import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../../mock/AppDataContext";
import { money } from "../../mock/money";
import type { QuoteItem } from "../../types";
import "../OrderFlow.css";
import "./Kits.css";
import "./OrcamentoBuilder.css";

type PickerTab = "produtos" | "kits" | "servicos";

export function OrcamentoBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quoteRequests, updateQuoteRequest, products, kits, serviceCatalog, orders, addOrder, updateOrder, addNotification, showToast } = useAppData();

  const quote = quoteRequests.find((q) => q.id === id);

  const [tab, setTab] = useState<PickerTab>("kits");
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [qtyByKit, setQtyByKit] = useState<Record<string, number>>({});
  const [qtyByService, setQtyByService] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<QuoteItem[]>([]);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customPrice, setCustomPrice] = useState("");
  const [feePercent, setFeePercent] = useState("10");
  const [guNotes, setGuNotes] = useState("");

  const startedRef = useRef(false);
  useEffect(() => {
    if (quote && quote.status === "Solicitado" && !startedRef.current) {
      startedRef.current = true;
      updateQuoteRequest(quote.id, { status: "Em elaboração" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.id]);

  // Reabrindo um orçamento já montado (revisão pedida pelo cliente): traz de volta os
  // itens, taxa e observações enviados da última vez, em vez de começar do zero.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!quote || prefilledRef.current || !quote.items || quote.items.length === 0) return;
    prefilledRef.current = true;
    const nextProductQty: Record<string, number> = {};
    const nextKitQty: Record<string, number> = {};
    const nextServiceQty: Record<string, number> = {};
    const nextCustom: QuoteItem[] = [];
    quote.items.forEach((it) => {
      if (it.productId) {
        nextProductQty[it.productId] = it.qty;
        return;
      }
      const kit = kits.find((k) => k.name === it.name);
      if (kit) {
        nextKitQty[kit.id] = it.qty;
        return;
      }
      const svc = serviceCatalog.find((s) => s.name === it.name);
      if (svc) {
        nextServiceQty[svc.id] = it.qty;
        return;
      }
      nextCustom.push(it);
    });
    setQtyByProduct(nextProductQty);
    setQtyByKit(nextKitQty);
    setQtyByService(nextServiceQty);
    setCustomItems(nextCustom);
    if (quote.serviceFeePercent !== undefined) setFeePercent(String(quote.serviceFeePercent));
    if (quote.guNotes) setGuNotes(quote.guNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.id]);

  // All hooks must run on every render regardless of `quote`'s state, so the
  // item picker/cart memo lives above the early returns below (Rules of Hooks).
  const activeProducts = products.filter((p) => p.active);
  const activeKits = kits.filter((k) => k.active);
  const activeServices = serviceCatalog.filter((s) => s.active);

  const cartItems: QuoteItem[] = useMemo(() => {
    const items: QuoteItem[] = [];
    activeProducts.forEach((p) => {
      const qty = qtyByProduct[p.id] || 0;
      if (qty > 0) items.push({ name: p.name, qty, price: p.price, productId: p.id });
    });
    activeKits.forEach((k) => {
      const qty = qtyByKit[k.id] || 0;
      if (qty > 0) {
        const itemsTotal = k.items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);
        const price = itemsTotal * (1 + k.serviceFeePercent / 100);
        items.push({ name: k.name, qty, price });
      }
    });
    activeServices.forEach((sv) => {
      const qty = qtyByService[sv.id] || 0;
      if (qty > 0) items.push({ name: sv.name, qty, price: sv.price });
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qtyByProduct, qtyByKit, qtyByService, products, kits, serviceCatalog]);

  if (!quote) {
    return (
      <div className="orc-builder-page">
        <div className="empty-state">Solicitação de orçamento não encontrada.</div>
        <button className="btn btn--outline" onClick={() => navigate("/admin/orcamentos")}>
          Voltar
        </button>
      </div>
    );
  }

  if (quote.status === "Enviado para aprovação" || quote.status === "Aprovado" || quote.status === "Rejeitado" || quote.status === "Cancelado") {
    return (
      <div className="orc-builder-page">
        <div className="empty-state">Esse orçamento já foi enviado ao cliente. Acompanhe pelo pedido {quote.orderId} em Gerenciar Pedidos.</div>
        <button className="btn btn--outline" onClick={() => navigate("/admin/orcamentos")}>
          Voltar
        </button>
      </div>
    );
  }

  const setProductQty = (id: string, qty: number) => setQtyByProduct((s) => ({ ...s, [id]: Math.max(0, qty) }));
  const setKitQty = (id: string, qty: number) => setQtyByKit((s) => ({ ...s, [id]: Math.max(0, qty) }));
  const setServiceQty = (id: string, qty: number) => setQtyByService((s) => ({ ...s, [id]: Math.max(0, qty) }));

  const allItems: QuoteItem[] = [...cartItems, ...customItems];

  const subtotal = allItems.reduce((sum, it) => sum + it.qty * it.price, 0);
  const parsedFee = parseFloat(feePercent.replace(",", ".")) || 0;
  const fee = subtotal * (parsedFee / 100);
  const total = subtotal + fee;

  const addCustomItem = () => {
    const price = parseFloat(customPrice.replace(",", "."));
    const qty = Math.max(1, parseInt(customQty) || 1);
    if (!customName.trim() || !price || price <= 0) return;
    setCustomItems((c) => [...c, { name: customName.trim(), qty, price }]);
    setCustomName("");
    setCustomQty("1");
    setCustomPrice("");
  };
  const removeCustomItem = (idx: number) => setCustomItems((c) => c.filter((_, i) => i !== idx));

  const canSend = allItems.length > 0;

  const send = () => {
    if (!canSend) return;
    const existingOrder = quote.orderId ? orders.find((o) => o.id === quote.orderId) : undefined;
    const isRevision = quote.status === "Editado" && !!existingOrder;

    let orderId: string;
    if (isRevision && existingOrder) {
      orderId = existingOrder.id;
      updateOrder(existingOrder.id, {
        value: money(total),
        valueNumber: total,
        items: allItems,
        notes: guNotes || undefined,
        history: [
          ...(existingOrder.history ?? []),
          { label: "Orçamento revisado e reenviado pela nossa equipe", time: new Date().toLocaleString("pt-BR") },
        ],
      });
    } else {
      const created = addOrder({
        category: quote.serviceType,
        type: `${quote.serviceType} (Orçamento)`,
        mono: "OR",
        qty: `${quote.peopleCount} pessoas`,
        peopleCount: quote.peopleCount,
        datetime: `${new Date(`${quote.expectedDate}T00:00:00`).toLocaleDateString("pt-BR")}`,
        status: "Orçamento enviado",
        value: money(total),
        valueNumber: total,
        items: allItems,
        notes: guNotes || undefined,
        costCenters: quote.costCenterCode ? [{ code: quote.costCenterCode, percent: 100 }] : undefined,
        quoteRequestId: quote.id,
      });
      orderId = created.id;
    }

    updateQuoteRequest(quote.id, {
      status: "Enviado para aprovação",
      items: allItems,
      serviceFeePercent: parsedFee,
      guNotes: guNotes || undefined,
      sentAt: new Date().toISOString(),
      orderId,
      clientFeedback: undefined,
    });
    addNotification(`Orçamento enviado para aprovação — pedido ${orderId}.`);
    showToast("Orçamento enviado ao cliente!");
    navigate("/admin/orcamentos");
  };

  return (
    <div className="orc-builder-page">
      <div className="orc-builder-header">
        <div>
          <h1 className="orc-builder-title">Montar orçamento &middot; {quote.serviceType}</h1>
          <div className="orc-builder-subtitle">
            {quote.requestedBy ?? "Cliente"} &bull; {quote.peopleCount} pessoas &bull; {new Date(`${quote.expectedDate}T00:00:00`).toLocaleDateString("pt-BR")} &bull; experiência: {quote.experience}
          </div>
        </div>
        <button className="btn btn--outline" onClick={() => navigate("/admin/orcamentos")}>
          Voltar
        </button>
      </div>

      {quote.status === "Editado" && quote.clientFeedback && (
        <div className="card orc-builder-feedback-card">
          <div className="orc-builder-feedback-card__title">⚠️ Cliente pediu alterações</div>
          <div>{quote.clientFeedback}</div>
        </div>
      )}

      <div className="card orc-builder-request-card">
        <div className="orc-builder-request-card__row">
          <span>O que o cliente quer</span>
          <div>{quote.wants || "—"}</div>
        </div>
        <div className="orc-builder-request-card__row">
          <span>Dietas especiais</span>
          <div>{quote.specialDiet ? quote.specialDietDetails || "Sim, sem detalhes" : "Não"}</div>
        </div>
        <div className="orc-builder-request-card__row">
          <span>Decoração / outros itens</span>
          <div>{quote.decorationNotes || "—"}</div>
        </div>
      </div>

      <div className="orc-builder-grid">
        <div className="card orc-builder-picker">
          <div className="tab-row" style={{ marginBottom: 14 }}>
            <button className={tab === "kits" ? "is-active" : ""} onClick={() => setTab("kits")}>
              Kits
            </button>
            <button className={tab === "produtos" ? "is-active" : ""} onClick={() => setTab("produtos")}>
              Produtos
            </button>
            <button className={tab === "servicos" ? "is-active" : ""} onClick={() => setTab("servicos")}>
              Serviços
            </button>
          </div>

          {tab === "kits" && (
            <div className="kits-product-picker">
              {activeKits.map((k) => {
                const qty = qtyByKit[k.id] || 0;
                const itemsTotal = k.items.reduce((sum, it) => sum + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0);
                const price = itemsTotal * (1 + k.serviceFeePercent / 100);
                return (
                  <div key={k.id} className="kits-product-row">
                    <div className="kits-product-row__info">
                      <div className="kits-product-row__name">{k.name}</div>
                      <div className="kits-product-row__price">{money(price)}</div>
                    </div>
                    <div className="qty-stepper">
                      <button onClick={() => setKitQty(k.id, qty - 1)}>&minus;</button>
                      <span>{qty}</span>
                      <button onClick={() => setKitQty(k.id, qty + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
              {activeKits.length === 0 && <div className="empty-state">Nenhum kit cadastrado.</div>}
            </div>
          )}

          {tab === "produtos" && (
            <div className="kits-product-picker">
              {activeProducts.map((p) => {
                const qty = qtyByProduct[p.id] || 0;
                return (
                  <div key={p.id} className="kits-product-row">
                    <div className="kits-product-row__info">
                      <div className="kits-product-row__name">{p.name}</div>
                      <div className="kits-product-row__price">{money(p.price)}</div>
                    </div>
                    <div className="qty-stepper">
                      <button onClick={() => setProductQty(p.id, qty - 1)}>&minus;</button>
                      <span>{qty}</span>
                      <button onClick={() => setProductQty(p.id, qty + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
              {activeProducts.length === 0 && <div className="empty-state">Nenhum produto cadastrado.</div>}
            </div>
          )}

          {tab === "servicos" && (
            <div className="kits-product-picker">
              {activeServices.map((sv) => {
                const qty = qtyByService[sv.id] || 0;
                return (
                  <div key={sv.id} className="kits-product-row">
                    <div className="kits-product-row__info">
                      <div className="kits-product-row__name">{sv.name}</div>
                      <div className="kits-product-row__price">{money(sv.price)}</div>
                    </div>
                    <div className="qty-stepper">
                      <button onClick={() => setServiceQty(sv.id, qty - 1)}>&minus;</button>
                      <span>{qty}</span>
                      <button onClick={() => setServiceQty(sv.id, qty + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
              {activeServices.length === 0 && <div className="empty-state">Nenhum serviço cadastrado.</div>}
            </div>
          )}

          <div className="orc-builder-custom">
            <div className="orc-builder-custom__title">Item personalizado (ex.: decoração sob medida)</div>
            <div className="orc-builder-custom__row">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nome do item" />
              <input type="number" min={1} value={customQty} onChange={(e) => setCustomQty(e.target.value)} style={{ width: 70 }} />
              <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Preço unit." inputMode="decimal" style={{ width: 110 }} />
              <button className="btn btn--outline btn--sm" onClick={addCustomItem}>
                + Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="card orc-builder-cart">
          <div className="orc-builder-cart__title">Itens do orçamento</div>
          <div className="orc-builder-cart__list">
            {cartItems.map((it, i) => (
              <div key={`cat-${it.name}-${i}`} className="orc-builder-cart__row">
                <div>
                  <div className="orc-builder-cart__name">{it.name}</div>
                  <div className="orc-builder-cart__sub">
                    {it.qty} &times; {money(it.price)}
                  </div>
                </div>
                <div className="orc-builder-cart__row-right">
                  <div>{money(it.qty * it.price)}</div>
                </div>
              </div>
            ))}
            {customItems.map((it, i) => (
              <div key={`custom-${it.name}-${i}`} className="orc-builder-cart__row">
                <div>
                  <div className="orc-builder-cart__name">
                    {it.name} <span className="pill-tag">personalizado</span>
                  </div>
                  <div className="orc-builder-cart__sub">
                    {it.qty} &times; {money(it.price)}
                  </div>
                </div>
                <div className="orc-builder-cart__row-right">
                  <div>{money(it.qty * it.price)}</div>
                  <button className="orc-builder-cart__remove" onClick={() => removeCustomItem(i)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {allItems.length === 0 && <div className="empty-state">Nenhum item adicionado ainda.</div>}
          </div>

          <label className="field-label">
            Taxa de serviço (%)
            <input value={feePercent} onChange={(e) => setFeePercent(e.target.value)} inputMode="decimal" />
          </label>
          <label className="field-label">
            Observações internas <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
            <textarea rows={2} value={guNotes} onChange={(e) => setGuNotes(e.target.value)} />
          </label>

          <div className="orc-builder-totals">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Taxa ({parsedFee || 0}%)</span>
              <strong>{money(fee)}</strong>
            </div>
            <div className="orc-builder-totals__total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
          </div>

          <button className="btn btn--primary btn--full" disabled={!canSend} onClick={send}>
            Enviar orçamento ao cliente
          </button>
        </div>
      </div>
    </div>
  );
}
