import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { COST_CENTER_LINKED_PROFILE_IDS, type AppUser } from "../../types";
import "./Usuarios.css";

const EMPTY_FORM = {
  name: "",
  email: "",
  profileId: "",
  costCenterCode: "",
  active: true,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Usuarios() {
  const { users, profiles, costCenters, addUser, updateUser, removeUser, resetUserPassword, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [profileFilter, setProfileFilter] = useState<string>("todos");

  const profileName = (id?: string) => profiles.find((p) => p.id === id)?.name;
  const costCenterLabel = (code?: string) => {
    const cc = costCenters.find((c) => c.code === code);
    return cc ? `${cc.code} · ${cc.name}` : undefined;
  };
  const needsCostCenter = COST_CENTER_LINKED_PROFILE_IDS.includes(form.profileId as (typeof COST_CENTER_LINKED_PROFILE_IDS)[number]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, profileId: u.profileId ?? "", costCenterCode: u.costCenterCode ?? "", active: u.active });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const payload = {
      name: form.name,
      email: form.email,
      profileId: form.profileId || undefined,
      costCenterCode: needsCostCenter ? form.costCenterCode || undefined : undefined,
      active: form.active,
    };
    if (editingId) {
      updateUser(editingId, payload);
      showToast("Usuário atualizado.");
    } else {
      addUser(payload);
      showToast("Usuário cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (u: AppUser) => {
    updateUser(u.id, { active: !u.active });
    showToast(u.active ? "Usuário desativado." : "Usuário ativado.");
  };

  const remove = (u: AppUser) => {
    removeUser(u.id);
    showToast("Usuário removido.");
  };

  const filtered = profileFilter === "todos" ? users : users.filter((u) => u.profileId === profileFilter);

  return (
    <div className="usuarios-page">
      <div className="usuarios-header">
        <div>
          <h1 className="usuarios-title">Usuários</h1>
          <div className="usuarios-subtitle">Crie usuários, atribua perfis e gerencie o acesso ao sistema.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Novo usuário
        </button>
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={profileFilter === "todos" ? "is-active" : ""} onClick={() => setProfileFilter("todos")}>
          Todos
        </button>
        {profiles.map((p) => (
          <button key={p.id} className={profileFilter === p.id ? "is-active" : ""} onClick={() => setProfileFilter(p.id)}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="card usuarios-table-card">
        <div className="usuarios-table">
          <div className="usuarios-table__head">
            <div>Nome</div>
            <div>Perfil</div>
            <div>Criado em</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {filtered.map((u) => (
            <div key={u.id} className="usuarios-table__row">
              <div>
                <div className="usuarios-table__name">{u.name}</div>
                <div className="usuarios-table__email">{u.email}</div>
                {u.lastPasswordResetAt && <div className="usuarios-table__reset-hint">Senha redefinida em {formatDateTime(u.lastPasswordResetAt)}</div>}
              </div>
              <div>
                {profileName(u.profileId) ? <span className="pill-tag">{profileName(u.profileId)}</span> : <span className="usuarios-table__muted">Sem perfil</span>}
                {costCenterLabel(u.costCenterCode) && <div className="usuarios-table__cc">{costCenterLabel(u.costCenterCode)}</div>}
              </div>
              <div className="usuarios-table__muted">{formatDate(u.createdAt)}</div>
              <div>
                <span className="status-pill" style={{ background: u.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: u.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {u.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="usuarios-table__actions">
                <button className="link" onClick={() => openEdit(u)}>
                  Editar
                </button>
                <button
                  className="link"
                  onClick={() => {
                    resetUserPassword(u.id);
                  }}
                >
                  Resetar senha
                </button>
                <button className="link" onClick={() => toggleActive(u)}>
                  {u.active ? "Desativar" : "Ativar"}
                </button>
                <button className="usuarios-remove-btn" onClick={() => remove(u)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhum usuário encontrado.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar usuário" : "Novo usuário"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome completo
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Ana Beatriz Lima" />
            </label>
            <label className="field-label">
              E-mail
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@empresa.com" />
            </label>
            <label className="field-label">
              Perfil <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(define as páginas que o usuário acessa)</span>
              <select value={form.profileId} onChange={(e) => setForm({ ...form, profileId: e.target.value })}>
                <option value="">Nenhum selecionado</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {needsCostCenter && (
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
            )}
            <label className="usuarios-active-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Usuário ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim() || !form.email.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar usuário"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
