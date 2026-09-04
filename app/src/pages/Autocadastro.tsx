import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PhoneNumberField } from "../components/PhoneNumberField";
import { useAppData } from "../mock/AppDataContext";
import type { PhoneNumber } from "../types";
import "./OrderFlow.css";
import "./Autocadastro.css";

const EMPTY_PHONE: PhoneNumber = { country: "+55", ddd: "", number: "" };

const EMPTY_FORM = { name: "", email: "", cargo: "", phone: EMPTY_PHONE, companyId: "", branchIds: [] as string[], costCenterCodes: [] as string[], copaIds: [] as string[] };

export function Autocadastro() {
  const navigate = useNavigate();
  const { companies, branches, costCenters, copas, addUser, setCurrentProfileId } = useAppData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [done, setDone] = useState(false);

  const activeCompanies = companies.filter((c) => c.active);
  const branchesForCompany = branches.filter((b) => b.active && b.companyId === form.companyId);
  const costCentersForBranches = costCenters.filter((cc) => cc.active && cc.branchId && form.branchIds.includes(cc.branchId));
  const copasForBranches = copas.filter((c) => c.active && form.branchIds.includes(c.branchId));

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

  const canSubmit =
    form.name.trim() &&
    form.email.trim() &&
    form.cargo.trim() &&
    form.phone.ddd.trim() &&
    form.phone.number.trim() &&
    form.companyId &&
    form.branchIds.length > 0 &&
    form.costCenterCodes.length > 0 &&
    form.copaIds.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    addUser({
      name: form.name,
      email: form.email,
      cargo: form.cargo,
      phone: form.phone,
      profileId: "prof-cliente",
      companyId: form.companyId,
      branchIds: form.branchIds,
      costCenterCodes: form.costCenterCodes,
      copaIds: form.copaIds,
      active: true,
    });
    setCurrentProfileId("prof-cliente");
    setDone(true);
  };

  if (done) {
    return (
      <Layout>
        <div className="page-container" style={{ paddingTop: 24, maxWidth: 560 }}>
          <div className="autocadastro-confirm-card card">
            <div className="autocadastro-confirm-card__title">Cadastro concluído!</div>
            <div className="autocadastro-confirm-card__sub">
              Sua conta foi criada com o perfil <strong>Cliente solicitante</strong>. Você já pode começar a fazer pedidos.
              Sua senha será enviada no e-mail informado.
            </div>
            <button className="btn btn--primary" onClick={() => navigate("/")}>
              Ir para o início
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container" style={{ paddingTop: 24, maxWidth: 640 }}>
        <button className="order-back-link" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar para a página inicial
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26 }}>
          <div className="order-header-icon">+</div>
          <div>
            <h1 className="order-title">Criar minha conta</h1>
            <div className="order-subtitle">Cadastre-se para solicitar pedidos em nome da sua empresa.</div>
          </div>
        </div>

        {activeCompanies.length === 0 && (
          <div className="empty-state">Nenhuma empresa cadastrada ainda. Peça para o administrador cadastrar sua empresa antes de se autocadastrar.</div>
        )}

        {activeCompanies.length > 0 && (
          <>
            <div className="step-card">
              <div className="step-heading">1. Seus dados</div>
              <div className="autocadastro-fields-grid">
                <label className="field-label">
                  Nome completo
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome completo" />
                </label>
                <label className="field-label">
                  E-mail corporativo
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@empresa.com" />
                </label>
                <label className="field-label">
                  Cargo
                  <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex.: Analista de Compras" />
                </label>
              </div>
              <PhoneNumberField value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            </div>

            <div className="step-card">
              <div className="step-heading">2. Empresa</div>
              <label className="field-label">
                Empresa
                <select value={form.companyId} onChange={(e) => setCompany(e.target.value)}>
                  <option value="">Selecione sua empresa</option>
                  {activeCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="step-card">
              <div className="step-heading">3. Filiais</div>
              {form.companyId ? (
                branchesForCompany.length > 0 ? (
                  <div className="autocadastro-chip-row">
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
            </div>

            <div className="step-card">
              <div className="step-heading">4. Centros de custo</div>
              {form.branchIds.length > 0 ? (
                costCentersForBranches.length > 0 ? (
                  <div className="autocadastro-chip-row">
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
            </div>

            <div className="step-card">
              <div className="step-heading">5. Copas</div>
              {form.branchIds.length > 0 ? (
                copasForBranches.length > 0 ? (
                  <div className="autocadastro-chip-row">
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
            </div>

            <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} disabled={!canSubmit} onClick={submit}>
              Criar minha conta
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
