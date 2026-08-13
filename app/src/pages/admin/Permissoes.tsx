import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { APP_PAGES, EMPTY_PAGE_PERMISSION, type PagePermission, type Profile } from "../../types";
import "./Permissoes.css";

const GROUPS = ["Área do colaborador", "Painel Administrativo"] as const;

const EMPTY_PROFILE_FORM = { name: "", whoIs: "", responsibilities: "", active: true };

export function Permissoes() {
  const { profiles, addProfile, updateProfile, removeProfile, setProfilePagePermission, showToast } = useAppData();
  const [tab, setTab] = useState<"perfis" | "permissoes">("perfis");
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id ?? "");

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);

  const [accessModalProfileId, setAccessModalProfileId] = useState<string | null>(null);

  const openNewProfile = () => {
    setEditingProfileId(null);
    setProfileForm(EMPTY_PROFILE_FORM);
    setProfileModalOpen(true);
  };
  const openEditProfile = (p: Profile) => {
    setEditingProfileId(p.id);
    setProfileForm({ name: p.name, whoIs: p.whoIs ?? "", responsibilities: p.responsibilities ?? "", active: p.active });
    setProfileModalOpen(true);
  };
  const saveProfile = () => {
    if (!profileForm.name.trim()) return;
    const payload = {
      name: profileForm.name,
      whoIs: profileForm.whoIs || undefined,
      responsibilities: profileForm.responsibilities || undefined,
      active: profileForm.active,
    };
    if (editingProfileId) {
      updateProfile(editingProfileId, payload);
      showToast("Perfil atualizado.");
    } else {
      addProfile({ ...payload, permissions: {} });
      showToast("Perfil cadastrado com sucesso!");
    }
    setProfileModalOpen(false);
  };
  const removeProfileHandler = (p: Profile) => {
    removeProfile(p.id);
    showToast("Perfil removido.");
    if (selectedProfileId === p.id) setSelectedProfileId(profiles.find((x) => x.id !== p.id)?.id ?? "");
  };

  const pageCount = (p: Profile) => Object.values(p.permissions).filter((perm) => perm.ver).length;

  const accessModalProfile = profiles.find((p) => p.id === accessModalProfileId) ?? null;

  const toggleVer = (profileId: string, pageId: string, checked: boolean) => {
    setProfilePagePermission(profileId, pageId, checked ? { ver: true } : { ver: false, criarEditar: false, aprovar: false, excluir: false });
  };
  const toggleAction = (profileId: string, pageId: string, key: keyof PagePermission, checked: boolean) => {
    setProfilePagePermission(profileId, pageId, checked ? { [key]: true, ver: true } : { [key]: false });
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;

  return (
    <div className="permissoes-page">
      <div className="permissoes-header">
        <div>
          <h1 className="permissoes-title">Perfis e Permissões</h1>
          <div className="permissoes-subtitle">Perfis definem quais páginas cada persona acessa. Permissões detalham as ações permitidas em cada uma.</div>
        </div>
      </div>

      <div className="tab-row" style={{ marginBottom: 20 }}>
        <button className={tab === "perfis" ? "is-active" : ""} onClick={() => setTab("perfis")}>
          Perfis
        </button>
        <button className={tab === "permissoes" ? "is-active" : ""} onClick={() => setTab("permissoes")}>
          Permissões
        </button>
      </div>

      {tab === "perfis" && (
        <>
          <div className="permissoes-toolbar">
            <button className="btn btn--primary" onClick={openNewProfile}>
              + Novo perfil
            </button>
          </div>
          <div className="perfis-grid">
            {profiles.map((p) => (
              <div key={p.id} className="card perfil-card">
                <div className="perfil-card__head">
                  <div>
                    <div className="perfil-card__name">{p.name}</div>
                    {p.whoIs && <div className="perfil-card__who">{p.whoIs}</div>}
                  </div>
                  <span className="status-pill" style={{ background: p.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: p.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {p.responsibilities && <div className="perfil-card__resp">{p.responsibilities}</div>}
                <div className="perfil-card__pages-count">{pageCount(p)} de {APP_PAGES.length} páginas liberadas</div>
                <div className="perfil-card__footer">
                  <button className="link" onClick={() => setAccessModalProfileId(p.id)}>
                    Editar páginas com acesso
                  </button>
                  <button className="link" onClick={() => openEditProfile(p)}>
                    Editar perfil
                  </button>
                  <button className="perfis-remove-btn" onClick={() => removeProfileHandler(p)}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "permissoes" && (
        <>
          <div className="tab-row" style={{ marginBottom: 16 }}>
            {profiles.map((p) => (
              <button key={p.id} className={selectedProfileId === p.id ? "is-active" : ""} onClick={() => setSelectedProfileId(p.id)}>
                {p.name}
              </button>
            ))}
          </div>

          {selectedProfile ? (
            <div className="card permissoes-matrix-card">
              {GROUPS.map((group) => (
                <div key={group} className="permissoes-group">
                  <div className="permissoes-group__title">{group}</div>
                  <div className="permissoes-matrix">
                    <div className="permissoes-matrix__head">
                      <div>Página</div>
                      <div>Ver</div>
                      <div>Criar/Editar</div>
                      <div>Aprovar</div>
                      <div>Excluir</div>
                    </div>
                    {APP_PAGES.filter((pg) => pg.group === group).map((pg) => {
                      const perm = selectedProfile.permissions[pg.id] ?? EMPTY_PAGE_PERMISSION;
                      return (
                        <div key={pg.id} className="permissoes-matrix__row">
                          <div className="permissoes-matrix__label">{pg.label}</div>
                          <input type="checkbox" checked={perm.ver} onChange={(e) => toggleVer(selectedProfile.id, pg.id, e.target.checked)} />
                          <input type="checkbox" checked={perm.criarEditar} onChange={(e) => toggleAction(selectedProfile.id, pg.id, "criarEditar", e.target.checked)} />
                          <input type="checkbox" checked={perm.aprovar} onChange={(e) => toggleAction(selectedProfile.id, pg.id, "aprovar", e.target.checked)} />
                          <input type="checkbox" checked={perm.excluir} onChange={(e) => toggleAction(selectedProfile.id, pg.id, "excluir", e.target.checked)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Cadastre um perfil na aba "Perfis" primeiro.</div>
          )}
        </>
      )}

      {profileModalOpen && (
        <Modal onClose={() => setProfileModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingProfileId ? "Editar perfil" : "Novo perfil"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Nome do perfil
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Ex.: Gestor aprovador" />
            </label>
            <label className="field-label">
              Quem é <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={2} value={profileForm.whoIs} onChange={(e) => setProfileForm({ ...profileForm, whoIs: e.target.value })} placeholder="Ex.: Gestor vinculado ao centro de custo." />
            </label>
            <label className="field-label">
              O que faz na solução <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={2} value={profileForm.responsibilities} onChange={(e) => setProfileForm({ ...profileForm, responsibilities: e.target.value })} placeholder="Ex.: Aprova pedidos e alterações que aumentem valor." />
            </label>
            <label className="permissoes-active-check">
              <input type="checkbox" checked={profileForm.active} onChange={(e) => setProfileForm({ ...profileForm, active: e.target.checked })} />
              Perfil ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setProfileModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!profileForm.name.trim()} onClick={saveProfile}>
              {editingProfileId ? "Salvar alterações" : "Cadastrar perfil"}
            </button>
          </div>
        </Modal>
      )}

      {accessModalProfile && (
        <Modal onClose={() => setAccessModalProfileId(null)} width={480}>
          <div className="modal-title" style={{ marginBottom: 4 }}>
            Páginas de {accessModalProfile.name}
          </div>
          <div className="modal-subtitle" style={{ marginBottom: 16 }}>
            Marque as páginas que esse perfil pode acessar. Detalhes de ação ficam na aba "Permissões".
          </div>
          <div className="permissoes-access-list">
            {GROUPS.map((group) => (
              <div key={group}>
                <div className="permissoes-access-group-title">{group}</div>
                {APP_PAGES.filter((pg) => pg.group === group).map((pg) => {
                  const checked = accessModalProfile.permissions[pg.id]?.ver ?? false;
                  return (
                    <label key={pg.id} className="permissoes-access-item">
                      <input type="checkbox" checked={checked} onChange={(e) => toggleVer(accessModalProfile.id, pg.id, e.target.checked)} />
                      {pg.label}
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn btn--primary btn--full" onClick={() => setAccessModalProfileId(null)}>
              Concluído
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
