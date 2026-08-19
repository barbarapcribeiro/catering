import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { PhotoUpload } from "../../components/PhotoUpload";
import { POPUP_TEXT_MAX_LENGTH, type Popup } from "../../types";
import "./Servicos.css";

const EMPTY_FORM = {
  text: "",
  imageUrl: undefined as string | undefined,
  active: true,
  profileIds: [] as string[],
};

export function Popups() {
  const { popups, profiles, addPopup, updatePopup, removePopup, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const profileName = (id: string) => profiles.find((p) => p.id === id)?.name ?? id;

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Popup) => {
    setEditingId(p.id);
    setForm({ text: p.text, imageUrl: p.imageUrl, active: p.active, profileIds: p.profileIds });
    setModalOpen(true);
  };

  const toggleProfile = (id: string) => {
    setForm((f) => ({
      ...f,
      profileIds: f.profileIds.includes(id) ? f.profileIds.filter((x) => x !== id) : [...f.profileIds, id],
    }));
  };

  const invalid = !form.text.trim() || form.text.length > POPUP_TEXT_MAX_LENGTH || form.profileIds.length === 0;

  const save = () => {
    if (invalid) return;
    const payload = { text: form.text.trim(), imageUrl: form.imageUrl, active: form.active, profileIds: form.profileIds };
    if (editingId) {
      updatePopup(editingId, payload);
      showToast("Pop-up atualizado.");
    } else {
      addPopup(payload);
      showToast("Pop-up cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (p: Popup) => {
    updatePopup(p.id, { active: !p.active });
    showToast(p.active ? "Pop-up desativado." : "Pop-up ativado.");
  };

  const remove = (p: Popup) => {
    removePopup(p.id);
    showToast("Pop-up removido.");
  };

  return (
    <div className="servicos-page">
      <div className="servicos-header">
        <div>
          <h1 className="servicos-title">Pop-ups</h1>
          <div className="servicos-subtitle">Cadastre avisos e comunicados exibidos para os perfis selecionados ao acessarem o app.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo pop-up
        </button>
      </div>

      <div className="card servicos-table-card">
        <div className="servicos-table" style={{ gridTemplateColumns: "2fr 1.4fr 0.8fr 1fr" }}>
          <div className="servicos-table__head" style={{ gridTemplateColumns: "2fr 1.4fr 0.8fr 1fr" }}>
            <div>Mensagem</div>
            <div>Perfis</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {popups.map((p) => (
            <div key={p.id} className="servicos-table__row" style={{ gridTemplateColumns: "2fr 1.4fr 0.8fr 1fr" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flex: "none" }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 8, border: "1px dashed var(--color-border)", flex: "none" }} />
                )}
                <div className="servicos-table__desc" style={{ maxWidth: 340 }}>{p.text}</div>
              </div>
              <div className="servicos-table__muted" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {p.profileIds.map((id) => (
                  <span key={id} className="pill-tag">{profileName(id)}</span>
                ))}
              </div>
              <div>
                <span className="status-pill" style={{ background: p.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: p.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="servicos-table__actions">
                <button className="link" onClick={() => openEdit(p)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(p)}>
                  {p.active ? "Desativar" : "Ativar"}
                </button>
                <button className="servicos-remove-btn" onClick={() => remove(p)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {popups.length === 0 && <div className="empty-state">Nenhum pop-up cadastrado.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar pop-up" : "Novo pop-up"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Texto do pop-up
              <textarea
                rows={4}
                value={form.text}
                maxLength={POPUP_TEXT_MAX_LENGTH}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Escreva o comunicado que será exibido..."
              />
            </label>
            <div style={{ fontSize: 11.5, color: form.text.length > POPUP_TEXT_MAX_LENGTH ? "var(--color-danger)" : "var(--color-text-muted)", marginTop: -10 }}>
              {form.text.length}/{POPUP_TEXT_MAX_LENGTH} caracteres
            </div>
            <PhotoUpload value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} label="Imagem do pop-up" />
            <div className="field-label">
              Aplicar ao(s) perfil(s)
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                {profiles.map((p) => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 400 }}>
                    <input type="checkbox" checked={form.profileIds.includes(p.id)} onChange={() => toggleProfile(p.id)} />
                    {p.name}
                  </label>
                ))}
              </div>
              {form.profileIds.length === 0 && <div className="error-text">Selecione ao menos um perfil.</div>}
            </div>
            <label className="servicos-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Pop-up ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={invalid} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar pop-up"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
