import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { SERVICES } from "../../mock/services";
import type { Promo } from "../../types";
import "./Servicos.css";

const THEMES = [
  { label: "Dourado (padrão)", color: "var(--color-primary)", bg: "var(--color-primary-soft)" },
  { label: "Verde", color: "#1a7a4f", bg: "#e6f5ec" },
  { label: "Laranja", color: "#b5690f", bg: "#faf0e3" },
  { label: "Azul", color: "#1e4fa3", bg: "#dfeaff" },
  { label: "Roxo", color: "#5a4a8a", bg: "#e9e5f4" },
] as const;

const EMPTY_FORM = {
  tag: "NOVIDADE" as Promo["tag"],
  themeIdx: 0,
  icon: "🎉",
  title: "",
  desc: "",
  discount: "",
  ctaLabel: "Ver opções",
  route: "",
  validity: "",
  terms: "",
  active: true,
};

export function NovidadesPromocoes() {
  const { promos, addPromo, updatePromo, removePromo, reorderPromo, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const themeIdxOf = (p: Promo) => Math.max(0, THEMES.findIndex((t) => t.color === p.color && t.bg === p.bg));
  const serviceName = (route?: string) => SERVICES.find((s) => s.route === route)?.name;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Promo) => {
    setEditingId(p.id);
    setForm({
      tag: p.tag,
      themeIdx: themeIdxOf(p),
      icon: p.icon ?? "🎉",
      title: p.title,
      desc: p.desc,
      discount: p.discount ?? "",
      ctaLabel: p.ctaLabel,
      route: p.route ?? "",
      validity: p.validity ?? "",
      terms: p.terms ?? "",
      active: p.active,
    });
    setModalOpen(true);
  };

  const canSave = form.title.trim() && form.desc.trim() && form.ctaLabel.trim();

  const save = () => {
    if (!canSave) return;
    const theme = THEMES[form.themeIdx];
    const payload = {
      tag: form.tag,
      color: theme.color,
      bg: theme.bg,
      icon: form.icon.trim() || "🎉",
      title: form.title.trim(),
      desc: form.desc.trim(),
      fullDesc: form.desc.trim(),
      discount: form.discount.trim() || undefined,
      ctaLabel: form.ctaLabel.trim(),
      route: form.route || undefined,
      validity: form.validity.trim() || undefined,
      terms: form.terms.trim() || undefined,
      active: form.active,
    };
    if (editingId) {
      updatePromo(editingId, payload);
      showToast("Novidade/promoção atualizada.");
    } else {
      addPromo(payload);
      showToast("Novidade/promoção cadastrada com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (p: Promo) => {
    updatePromo(p.id, { active: !p.active });
    showToast(p.active ? "Removida do carrossel." : "Adicionada ao carrossel.");
  };

  const remove = (p: Promo) => {
    removePromo(p.id);
    showToast("Novidade/promoção removida.");
  };

  return (
    <div className="servicos-page">
      <div className="servicos-header">
        <div>
          <h1 className="servicos-title">Novidades e Promoções</h1>
          <div className="servicos-subtitle">
            Gerencia o que aparece no carrossel da Home (Cliente solicitante) e na página Fique por Dentro. A ordem abaixo é a ordem de exibição.
          </div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo item
        </button>
      </div>

      <div className="card servicos-table-card">
        <div className="servicos-table" style={{ gridTemplateColumns: "0.5fr 2fr 1fr 1fr 0.8fr 1.4fr" }}>
          <div className="servicos-table__head" style={{ gridTemplateColumns: "0.5fr 2fr 1fr 1fr 0.8fr 1.4fr" }}>
            <div>Ordem</div>
            <div>Item</div>
            <div>Tipo</div>
            <div>Serviço vinculado</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {promos.map((p, idx) => (
            <div key={p.id} className="servicos-table__row" style={{ gridTemplateColumns: "0.5fr 2fr 1fr 1fr 0.8fr 1.4fr" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="link" disabled={idx === 0} onClick={() => reorderPromo(p.id, -1)} title="Mover para cima">
                  ↑
                </button>
                <button className="link" disabled={idx === promos.length - 1} onClick={() => reorderPromo(p.id, 1)} title="Mover para baixo">
                  ↓
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flex: "none" }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title}</div>
                  <div className="servicos-table__desc" style={{ maxWidth: 260 }}>{p.desc}</div>
                </div>
              </div>
              <div className="servicos-table__muted">
                <span className="pill-tag" style={{ color: p.color, background: p.bg }}>
                  {p.tag}
                  {p.discount ? ` · ${p.discount}` : ""}
                </span>
              </div>
              <div className="servicos-table__muted">{serviceName(p.route) ?? "—"}</div>
              <div>
                <span className="status-pill" style={{ background: p.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: p.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {p.active ? "No carrossel" : "Oculto"}
                </span>
              </div>
              <div className="servicos-table__actions">
                <button className="link" onClick={() => openEdit(p)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(p)}>
                  {p.active ? "Ocultar" : "Exibir"}
                </button>
                <button className="servicos-remove-btn" onClick={() => remove(p)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {promos.length === 0 && <div className="empty-state">Nenhuma novidade ou promoção cadastrada.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={520}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar item" : "Novo item"}
          </div>
          <div className="modal-form">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label className="field-label">
                Tipo
                <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value as Promo["tag"] })}>
                  <option value="NOVIDADE">Novidade</option>
                  <option value="PROMOÇÃO">Promoção</option>
                </select>
              </label>
              <label className="field-label">
                Cor do card
                <select value={form.themeIdx} onChange={(e) => setForm({ ...form, themeIdx: Number(e.target.value) })}>
                  {THEMES.map((t, i) => (
                    <option key={t.label} value={i}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field-label">
              Ícone (emoji)
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Ex.: ☕" maxLength={4} style={{ maxWidth: 100 }} />
            </label>
            <label className="field-label">
              Título
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Combo Reunião" />
            </label>
            <label className="field-label">
              Descrição
              <textarea rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="O que é a novidade ou promoção..." />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label className="field-label">
                Desconto <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="Ex.: 10% OFF" />
              </label>
              <label className="field-label">
                Válido até <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <input value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="Ex.: 31/12/2026" />
              </label>
            </div>
            <label className="field-label">
              Serviço vinculado <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(para onde o CTA leva)</span>
              <select value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })}>
                <option value="">Nenhum</option>
                {SERVICES.filter((s) => s.route).map((s) => (
                  <option key={s.id} value={s.route}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Texto do botão
              <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="Ex.: Ver opções" />
            </label>
            <label className="field-label">
              Termos e condições <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Regras de elegibilidade, restrições..." />
            </label>
            <label className="servicos-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Exibir no carrossel da Home e em Fique por Dentro
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar item"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
