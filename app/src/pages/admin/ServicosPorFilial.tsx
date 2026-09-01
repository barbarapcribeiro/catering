import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { SERVICES } from "../../mock/services";
import "./ServicosPorFilial.css";

const ALL_SERVICE_IDS = SERVICES.map((s) => s.id);

export function ServicosPorFilial() {
  const { companies, branches, updateBranch, showToast } = useAppData();
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");

  const activeCompanies = companies.filter((c) => c.active);
  const branchesForCompany = branches.filter((b) => b.active && b.companyId === companyId);
  const selectedBranch = branches.find((b) => b.id === branchId);

  const enabledIds = selectedBranch ? selectedBranch.enabledServiceIds ?? ALL_SERVICE_IDS : [];

  const setCompany = (id: string) => {
    setCompanyId(id);
    setBranchId("");
  };

  const toggleService = (serviceId: string) => {
    if (!selectedBranch) return;
    const current = selectedBranch.enabledServiceIds ?? ALL_SERVICE_IDS;
    const next = current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId];
    updateBranch(selectedBranch.id, { enabledServiceIds: next });
  };

  const enableAll = () => {
    if (!selectedBranch) return;
    updateBranch(selectedBranch.id, { enabledServiceIds: ALL_SERVICE_IDS });
    showToast("Todos os serviços habilitados para esta filial.");
  };

  const disableAll = () => {
    if (!selectedBranch) return;
    updateBranch(selectedBranch.id, { enabledServiceIds: [] });
    showToast("Todos os serviços ocultados para esta filial.");
  };

  return (
    <div className="servicosfilial-page">
      <div className="servicosfilial-header">
        <div>
          <h1 className="servicosfilial-title">Serviços por Filial</h1>
          <div className="servicosfilial-subtitle">Escolha quais serviços aparecem na Home do Cliente solicitante de cada empresa e filial.</div>
        </div>
      </div>

      <div className="card servicosfilial-picker">
        <label className="field-label">
          Empresa
          <select value={companyId} onChange={(e) => setCompany(e.target.value)}>
            <option value="">Selecione a empresa</option>
            {activeCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Filial
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!companyId}>
            <option value="">Selecione a filial</option>
            {branchesForCompany.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {companyId && branchesForCompany.length === 0 && <span className="field-hint">Nenhuma filial ativa cadastrada para esta empresa.</span>}
      </div>

      {selectedBranch ? (
        <div className="card servicosfilial-services-card">
          <div className="servicosfilial-services-head">
            <div className="servicosfilial-services-title">
              Serviços visíveis em <strong>{selectedBranch.name}</strong>
            </div>
            <div className="servicosfilial-services-actions">
              <button className="link" onClick={enableAll}>
                Habilitar todos
              </button>
              <button className="link" onClick={disableAll}>
                Ocultar todos
              </button>
            </div>
          </div>
          <div className="servicosfilial-grid">
            {SERVICES.map((sv) => (
              <button
                key={sv.id}
                type="button"
                className={`servicosfilial-chip ${enabledIds.includes(sv.id) ? "is-active" : ""}`}
                onClick={() => toggleService(sv.id)}
              >
                <span className="servicosfilial-chip__mono">{sv.mono}</span>
                {sv.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">Selecione uma empresa e uma filial para configurar os serviços visíveis.</div>
      )}
    </div>
  );
}
