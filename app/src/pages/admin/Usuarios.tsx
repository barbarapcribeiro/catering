import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { PhoneNumberField } from "../../components/PhoneNumberField";
import { COST_CENTER_LINKED_PROFILE_IDS, formatPhoneNumber, type AppUser, type PhoneNumber } from "../../types";
import "./Usuarios.css";

const EMPTY_PHONE: PhoneNumber = { country: "+55", ddd: "", number: "" };

const EMPTY_FORM = {
  name: "",
  email: "",
  cpf: "",
  matricula: "",
  cargo: "",
  phone: EMPTY_PHONE,
  password: "",
  profileId: "",
  companyId: "",
  branchIds: [] as string[],
  costCenterCodes: [] as string[],
  copaIds: [] as string[],
  active: true,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Usuarios() {
  const { users, profiles, companies, branches, costCenters, copas, addUser, updateUser, removeUser, resetUserPassword, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [profileFilter, setProfileFilter] = useState<string>("todos");

  const profileName = (id?: string) => profiles.find((p) => p.id === id)?.name;
  const companyName = (id?: string) => companies.find((c) => c.id === id)?.name;
  const costCenterLabel = (code: string) => {
    const cc = costCenters.find((c) => c.code === code);
    return cc ? `${cc.code} · ${cc.name}` : code;
  };
  const needsCostCenter = COST_CENTER_LINKED_PROFILE_IDS.includes(form.profileId as (typeof COST_CENTER_LINKED_PROFILE_IDS)[number]);

  const activeCompanies = companies.filter((c) => c.active);
  const branchesForCompany = branches.filter((b) => b.active && b.companyId === form.companyId);
  const costCentersForBranches = costCenters.filter((cc) => cc.active && cc.branchId && form.branchIds.includes(cc.branchId));
  const copasForBranches = copas.filter((c) => c.active && form.branchIds.includes(c.branchId));

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditingId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      cpf: u.cpf ?? "",
      matricula: u.matricula ?? "",
      cargo: u.cargo ?? "",
      phone: u.phone ?? EMPTY_PHONE,
      password: "",
      profileId: u.profileId ?? "",
      companyId: u.companyId ?? "",
      branchIds: u.branchIds ?? [],
      costCenterCodes: u.costCenterCodes ?? [],
      copaIds: u.copaIds ?? [],
      active: u.active,
    });
    setModalOpen(true);
  };

  const setCompany = (companyId: string) => {
    setForm((f) => ({ ...f, companyId, branchIds: [], costCenterCodes: [], copaIds: [] }));
  };

  const toggleBranch = (branchId: string) => {
    setForm((f) => {
      const branchIds = f.branchIds.includes(branchId) ? f.branchIds.filter((id) => id !== branchId) : [...f.branchIds, branchId];
      const validCodes = costCenters.filter((cc) => cc.branchId && branchIds.includes(cc.branchId)).map((cc) => cc.code);
      const validCopaIds = copas.filter((c) => branchIds.includes(c.branchId)).map((c) => c.id);
      return { ...f, branchIds, costCenterCodes: f.costCenterCodes.filter((code) => validCodes.includes(code)), copaIds: f.copaIds.filter((id) => validCopaIds.includes(id)) };
    });
  };

  const toggleCostCenter = (code: string) => {
    setForm((f) => ({ ...f, costCenterCodes: f.costCenterCodes.includes(code) ? f.costCenterCodes.filter((c) => c !== code) : [...f.costCenterCodes, code] }));
  };
  const toggleCopa = (id: string) => {
    setForm((f) => ({ ...f, copaIds: f.copaIds.includes(id) ? f.copaIds.filter((c) => c !== id) : [...f.copaIds, id] }));
  };

  const canSave =
    form.name.trim() &&
    form.email.trim() &&
    form.cpf.trim() &&
    form.phone.ddd.trim() &&
    form.phone.number.trim() &&
    form.cargo.trim() &&
    form.companyId &&
    form.branchIds.length > 0 &&
    (editingId || form.password.trim());

  const save = () => {
    if (!canSave) return;
    const payload = {
      name: form.name,
      email: form.email,
      cpf: form.cpf,
      matricula: form.matricula || undefined,
      cargo: form.cargo,
      phone: form.phone,
      ...(form.password.trim() ? { password: form.password } : {}),
      profileId: form.profileId || undefined,
      companyId: form.companyId,
      branchIds: form.branchIds,
      costCenterCodes: needsCostCenter && form.costCenterCodes.length > 0 ? form.costCenterCodes : undefined,
      copaIds: needsCostCenter && form.copaIds.length > 0 ? form.copaIds : undefined,
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
            <div>Empresa / Filiais / CC</div>
            <div>Criado em</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {filtered.map((u) => (
            <div key={u.id} className="usuarios-table__row">
              <div>
                <div className="usuarios-table__name">{u.name}</div>
                <div className="usuarios-table__email">
                  {u.email}
                  {formatPhoneNumber(u.phone) && ` · ${formatPhoneNumber(u.phone)}`}
                  {u.cargo && ` · ${u.cargo}`}
                </div>
                {u.lastPasswordResetAt && <div className="usuarios-table__reset-hint">Senha redefinida em {formatDateTime(u.lastPasswordResetAt)}</div>}
              </div>
              <div>{profileName(u.profileId) ? <span className="pill-tag">{profileName(u.profileId)}</span> : <span className="usuarios-table__muted">Sem perfil</span>}</div>
              <div className="usuarios-table__muted">
                {companyName(u.companyId) ? (
                  <>
                    <div>{companyName(u.companyId)}</div>
                    {(u.costCenterCodes?.length ?? 0) > 0 && <div className="usuarios-table__cc">{u.costCenterCodes!.map(costCenterLabel).join(", ")}</div>}
                  </>
                ) : (
                  "—"
                )}
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
        <Modal onClose={() => setModalOpen(false)} width={520}>
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
            <div className="usuarios-fields-grid">
              <label className="field-label">
                CPF
                <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </label>
              <label className="field-label">
                Matrícula <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} placeholder="Ex.: 20345" />
              </label>
            </div>
            <div className="usuarios-fields-grid">
              <label className="field-label">
                Cargo
                <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex.: Analista de Compras" />
              </label>
              <label className="field-label">
                Senha {editingId && <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(deixe em branco para manter a atual)</span>}
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? "••••••••" : "Defina uma senha"} />
              </label>
            </div>
            <PhoneNumberField value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
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

            <label className="field-label">
              Empresa <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(obrigatório para todo usuário)</span>
              <select value={form.companyId} onChange={(e) => setCompany(e.target.value)}>
                <option value="">Nenhuma selecionada</option>
                {activeCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Filiais <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(uma ou mais)</span>
              {form.companyId ? (
                branchesForCompany.length > 0 ? (
                  <div className="usuarios-chip-row">
                    {branchesForCompany.map((b) => (
                      <button key={b.id} type="button" className={form.branchIds.includes(b.id) ? "is-active" : ""} onClick={() => toggleBranch(b.id)}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="field-hint">Nenhuma filial ativa cadastrada para esta empresa.</span>
                )
              ) : (
                <span className="field-hint">Selecione a empresa para listar as filiais.</span>
              )}
            </label>

            {needsCostCenter && (
              <label className="field-label">
                Centros de custo <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(um ou mais)</span>
                {form.branchIds.length > 0 ? (
                  costCentersForBranches.length > 0 ? (
                    <div className="usuarios-chip-row">
                      {costCentersForBranches.map((cc) => (
                        <button key={cc.id} type="button" className={form.costCenterCodes.includes(cc.code) ? "is-active" : ""} onClick={() => toggleCostCenter(cc.code)}>
                          {cc.code} · {cc.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="field-hint">Nenhum centro de custo ativo nas filiais selecionadas.</span>
                  )
                ) : (
                  <span className="field-hint">Selecione ao menos uma filial para listar os centros de custo.</span>
                )}
              </label>
            )}

            {needsCostCenter && (
              <label className="field-label">
                Copas <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(uma ou mais — de onde o usuário poderá solicitar pedidos; vazio libera todas as copas das filiais selecionadas)</span>
                {form.branchIds.length > 0 ? (
                  copasForBranches.length > 0 ? (
                    <div className="usuarios-chip-row">
                      {copasForBranches.map((c) => (
                        <button key={c.id} type="button" className={form.copaIds.includes(c.id) ? "is-active" : ""} onClick={() => toggleCopa(c.id)}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="field-hint">Nenhuma copa ativa nas filiais selecionadas.</span>
                  )
                ) : (
                  <span className="field-hint">Selecione ao menos uma filial para listar as copas.</span>
                )}
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
            <button className="btn btn--primary" disabled={!canSave} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar usuário"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
