import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { money } from "../../mock/money";
import { CONTRACT_PRICING_MODES, type Contract, type ContractPricingMode } from "../../types";
import "./Contratos.css";

const EMPTY_FORM = {
  costCenterCode: "",
  pricingMode: CONTRACT_PRICING_MODES[0] as ContractPricingMode,
  fixedPrice: "",
  requiresApprover: false,
  clientFocalPointName: "",
  clientFocalPointEmail: "",
  clientFocalPointPhone: "",
  startDate: "",
  endDate: "",
  paymentTerms: "",
  annualReadjustmentPercent: "",
  slaNotes: "",
  notes: "",
  active: true,
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function Contratos() {
  const { contracts, costCenters, addContract, updateContract, removeContract, showToast } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const costCenterLabel = (code: string) => {
    const cc = costCenters.find((c) => c.code === code);
    return cc ? `${cc.code} · ${cc.name}` : code;
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, costCenterCode: costCenters[0]?.code ?? "" });
    setModalOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditingId(c.id);
    setForm({
      costCenterCode: c.costCenterCode,
      pricingMode: c.pricingMode,
      fixedPrice: c.fixedPrice != null ? String(c.fixedPrice) : "",
      requiresApprover: c.requiresApprover,
      clientFocalPointName: c.clientFocalPointName ?? "",
      clientFocalPointEmail: c.clientFocalPointEmail ?? "",
      clientFocalPointPhone: c.clientFocalPointPhone ?? "",
      startDate: c.startDate ?? "",
      endDate: c.endDate ?? "",
      paymentTerms: c.paymentTerms ?? "",
      annualReadjustmentPercent: c.annualReadjustmentPercent != null ? String(c.annualReadjustmentPercent) : "",
      slaNotes: c.slaNotes ?? "",
      notes: c.notes ?? "",
      active: c.active,
    });
    setModalOpen(true);
  };

  const isFixedPrice = form.pricingMode === "Preço fixo";

  const save = () => {
    if (!form.costCenterCode) return;
    const payload = {
      costCenterCode: form.costCenterCode,
      pricingMode: form.pricingMode,
      fixedPrice: isFixedPrice ? parseFloat(form.fixedPrice.replace(",", ".")) || 0 : undefined,
      requiresApprover: form.requiresApprover,
      clientFocalPointName: form.clientFocalPointName || undefined,
      clientFocalPointEmail: form.clientFocalPointEmail || undefined,
      clientFocalPointPhone: form.clientFocalPointPhone || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      paymentTerms: form.paymentTerms || undefined,
      annualReadjustmentPercent: form.annualReadjustmentPercent ? parseFloat(form.annualReadjustmentPercent.replace(",", ".")) || 0 : undefined,
      slaNotes: form.slaNotes || undefined,
      notes: form.notes || undefined,
      active: form.active,
    };
    if (editingId) {
      updateContract(editingId, payload);
      showToast("Contrato atualizado.");
    } else {
      addContract(payload);
      showToast("Contrato cadastrado com sucesso!");
    }
    setModalOpen(false);
  };

  const toggleActive = (c: Contract) => {
    updateContract(c.id, { active: !c.active });
    showToast(c.active ? "Contrato encerrado." : "Contrato reativado.");
  };

  const remove = (c: Contract) => {
    removeContract(c.id);
    showToast("Contrato removido.");
  };

  return (
    <div className="contratos-page">
      <div className="contratos-header">
        <div>
          <h1 className="contratos-title">Contratos</h1>
          <div className="contratos-subtitle">
            Dados contratuais por centro de custo — preço, aprovação e ponto focal. Base para parametrizar novas regras no futuro.
          </div>
        </div>
        <button className="btn btn--primary" onClick={openNew} disabled={costCenters.length === 0}>
          + Novo contrato
        </button>
      </div>
      {costCenters.length === 0 && <div className="kits-empty-hint">Cadastre ao menos um centro de custo antes de criar um contrato.</div>}

      <div className="card contratos-table-card">
        <div className="contratos-table">
          <div className="contratos-table__head">
            <div>Centro de custo</div>
            <div>Modelo de preço</div>
            <div>Aprovador</div>
            <div>Ponto focal</div>
            <div>Vigência</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {contracts.map((c) => (
            <div key={c.id} className="contratos-table__row">
              <div className="contratos-table__cc">{costCenterLabel(c.costCenterCode)}</div>
              <div>
                <div>{c.pricingMode}</div>
                {c.pricingMode === "Preço fixo" && c.fixedPrice != null && (
                  <div className="contratos-table__muted">{money(c.fixedPrice)}/mês</div>
                )}
              </div>
              <div>
                <span className="pill-tag">{c.requiresApprover ? "Exige aprovador" : "Não exige"}</span>
              </div>
              <div className="contratos-table__muted">{c.clientFocalPointName || "—"}</div>
              <div className="contratos-table__muted">
                {formatDate(c.startDate)} — {c.endDate ? formatDate(c.endDate) : "sem fim"}
              </div>
              <div>
                <span className="status-pill" style={{ background: c.active ? "var(--color-success-soft)" : "var(--color-border-soft)", color: c.active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {c.active ? "Ativo" : "Encerrado"}
                </span>
              </div>
              <div className="contratos-table__actions">
                <button className="link" onClick={() => openEdit(c)}>
                  Editar
                </button>
                <button className="link" onClick={() => toggleActive(c)}>
                  {c.active ? "Encerrar" : "Reativar"}
                </button>
                <button className="contratos-remove-btn" onClick={() => remove(c)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {contracts.length === 0 && <div className="empty-state">Nenhum contrato cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={560}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar contrato" : "Novo contrato"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Centro de custo
              <select value={form.costCenterCode} onChange={(e) => setForm({ ...form, costCenterCode: e.target.value })}>
                {costCenters.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field-label">
                Modelo de preço
                <select value={form.pricingMode} onChange={(e) => setForm({ ...form, pricingMode: e.target.value as ContractPricingMode })}>
                  {CONTRACT_PRICING_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              {isFixedPrice && (
                <label className="field-label">
                  Valor fixo mensal (R$)
                  <input value={form.fixedPrice} onChange={(e) => setForm({ ...form, fixedPrice: e.target.value })} placeholder="0,00" inputMode="decimal" />
                </label>
              )}
            </div>

            <label className="contratos-check">
              <input type="checkbox" checked={form.requiresApprover} onChange={(e) => setForm({ ...form, requiresApprover: e.target.checked })} />
              Exige aprovador (gestor) para pedidos deste centro de custo
            </label>

            <div className="contratos-section-title">Ponto focal do cliente</div>
            <div className="field-row">
              <label className="field-label">
                Nome
                <input value={form.clientFocalPointName} onChange={(e) => setForm({ ...form, clientFocalPointName: e.target.value })} placeholder="Nome do responsável" />
              </label>
              <label className="field-label">
                Telefone
                <input value={form.clientFocalPointPhone} onChange={(e) => setForm({ ...form, clientFocalPointPhone: e.target.value })} placeholder="(11) 0000-0000" />
              </label>
            </div>
            <label className="field-label">
              E-mail
              <input value={form.clientFocalPointEmail} onChange={(e) => setForm({ ...form, clientFocalPointEmail: e.target.value })} placeholder="nome@empresa.com" />
            </label>

            <div className="contratos-section-title">Vigência e condições</div>
            <div className="field-row">
              <label className="field-label">
                Início
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </label>
              <label className="field-label">
                Fim <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </label>
            </div>
            <div className="field-row">
              <label className="field-label">
                Condições de pagamento
                <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="Ex.: Boleto, 28 dias" />
              </label>
              <label className="field-label">
                Reajuste anual (%)
                <input value={form.annualReadjustmentPercent} onChange={(e) => setForm({ ...form, annualReadjustmentPercent: e.target.value })} placeholder="0" inputMode="decimal" />
              </label>
            </div>
            <label className="field-label">
              SLA / nível de serviço <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={2} value={form.slaNotes} onChange={(e) => setForm({ ...form, slaNotes: e.target.value })} placeholder="Ex.: Entrega em até 24h para pedidos padrão." />
            </label>
            <label className="field-label">
              Observações <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>

            <label className="contratos-check">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Contrato ativo
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.costCenterCode} onClick={save}>
              {editingId ? "Salvar alterações" : "Cadastrar contrato"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
