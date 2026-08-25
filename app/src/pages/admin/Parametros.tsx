import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { PhotoUpload } from "../../components/PhotoUpload";
import { ORDER_CATEGORIES, ORDER_STATUS_LIST, type OrderStatus } from "../../types";
import "./Parametros.css";

type ParamTab = "geral" | "servico" | "fluxo";

const TABS: { id: ParamTab; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "servico", label: "Por Serviço" },
  { id: "fluxo", label: "Status do Fluxo" },
];

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHHMM(text: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return 0;
  return Math.max(0, parseInt(match[1], 10) * 60 + parseInt(match[2], 10));
}

export function Parametros() {
  const { operatingParameters, updateOperatingParameters, serviceParameters, updateServiceParameters, statusFlowVisibility, toggleStatusFlowVisibility, costCenters, showToast } =
    useAppData();
  const [tab, setTab] = useState<ParamTab>("geral");

  return (
    <div className="parametros-page">
      <div className="parametros-header">
        <div>
          <h1 className="parametros-title">Parâmetros</h1>
          <div className="parametros-subtitle">
            Regras operacionais aplicadas de verdade nos pedidos: o que aparece nas telas, SLA de preparo por tipo de pedido, e quais status entram no fluxo de produção.
          </div>
        </div>
      </div>

      <div className="tab-row" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "is-active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="parametros-geral-grid">
          <div className="card parametros-card">
            <div className="parametros-card__title">Identidade da unidade</div>
            <PhotoUpload
              value={operatingParameters.logoUrl}
              onChange={(v) => updateOperatingParameters({ logoUrl: v })}
              label="Logo da unidade"
            />
            <label className="param-toggle-row">
              <input
                type="checkbox"
                checked={operatingParameters.showLogoOnPrint}
                onChange={(e) => updateOperatingParameters({ showLogoOnPrint: e.target.checked })}
              />
              Exibir logo nas impressões (tickets de produção)
            </label>
            <label className="field-label">
              Ramal de atendimento
              <input
                value={operatingParameters.extensionNumber ?? ""}
                onChange={(e) => updateOperatingParameters({ extensionNumber: e.target.value })}
                placeholder="Ex.: 9090"
              />
            </label>
          </div>

          <div className="card parametros-card">
            <div className="parametros-card__title">Mensagem "De Acordo"</div>
            <div className="parametros-card__hint">Exibida em Aprovações enquanto houver pedidos aguardando aprovação do gestor.</div>
            <label className="param-toggle-row">
              <input
                type="checkbox"
                checked={operatingParameters.showAgreementMessage}
                onChange={(e) => updateOperatingParameters({ showAgreementMessage: e.target.checked })}
              />
              Exibir mensagem de aviso
            </label>
            <label className="field-label">
              Texto da mensagem
              <input
                value={operatingParameters.agreementMessage}
                disabled={!operatingParameters.showAgreementMessage}
                onChange={(e) => updateOperatingParameters({ agreementMessage: e.target.value })}
              />
            </label>
          </div>

          <div className="card parametros-card">
            <div className="parametros-card__title">Visualização no pedido</div>
            <div className="parametros-card__hint">Controla o que aparece em Gerenciar Pedidos e nos formulários de novo pedido.</div>
            <label className="param-toggle-row">
              <input
                type="checkbox"
                checked={operatingParameters.showUnitPriceInOrder}
                onChange={(e) => updateOperatingParameters({ showUnitPriceInOrder: e.target.checked })}
              />
              Visualização de valor unitário no pedido
            </label>
            <label className="param-toggle-row">
              <input
                type="checkbox"
                checked={operatingParameters.showTotalValueInOrder}
                onChange={(e) => updateOperatingParameters({ showTotalValueInOrder: e.target.checked })}
              />
              Visualização de valor total do pedido
            </label>
            <label className="param-toggle-row">
              <input
                type="checkbox"
                checked={operatingParameters.showDeliveryLocationField}
                onChange={(e) => updateOperatingParameters({ showDeliveryLocationField: e.target.checked })}
              />
              Visualização do campo Local de entrega
            </label>
            <label className="param-toggle-row">
              <input
                type="checkbox"
                checked={operatingParameters.showInstructionsField}
                onChange={(e) => updateOperatingParameters({ showInstructionsField: e.target.checked })}
              />
              Visualização do campo de Instruções/observações
            </label>
          </div>
        </div>
      )}

      {tab === "servico" && (
        <div className="card parametros-servico-card">
          <div className="parametros-card__title">Parâmetro por serviço</div>
          <div className="parametros-card__hint">
            Cada tipo de pedido obedece seu próprio SLA de preparo, exigência de retirada agendada, taxa de administração e centro de custo padrão.
          </div>
          <div className="parametros-servico-table">
            <div className="parametros-servico-table__head">
              <div>Serviço</div>
              <div>SLA de preparação</div>
              <div>Retirada agendada</div>
              <div>Taxa de administração</div>
              <div>Centro de custo vinculado</div>
            </div>
            {ORDER_CATEGORIES.map((category) => {
              const sp = serviceParameters.find((s) => s.category === category);
              if (!sp) return null;
              return (
                <div className="parametros-servico-table__row" key={category}>
                  <div className="parametros-servico-table__name">{category}</div>
                  <div>
                    <input
                      className="parametros-time-input"
                      defaultValue={formatMinutes(sp.slaPrepMinutes)}
                      onBlur={(e) => updateServiceParameters(category, { slaPrepMinutes: parseHHMM(e.target.value) })}
                      placeholder="00:00"
                    />
                  </div>
                  <div>
                    <label className="param-toggle-row param-toggle-row--compact">
                      <input
                        type="checkbox"
                        checked={sp.requireScheduledPickup}
                        onChange={(e) => updateServiceParameters(category, { requireScheduledPickup: e.target.checked })}
                      />
                      Obrigatória
                    </label>
                  </div>
                  <div className="parametros-fee-cell">
                    <input
                      className="parametros-fee-input"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={sp.adminFeePercent}
                      onBlur={(e) => updateServiceParameters(category, { adminFeePercent: Math.max(0, parseFloat(e.target.value) || 0) })}
                    />
                    <span>%</span>
                  </div>
                  <div>
                    <select
                      value={sp.linkedCostCenterCode ?? ""}
                      onChange={(e) => updateServiceParameters(category, { linkedCostCenterCode: e.target.value || undefined })}
                    >
                      <option value="">Sem padrão</option>
                      {costCenters.map((cc) => (
                        <option key={cc.id} value={cc.code}>
                          {cc.code} · {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "fluxo" && (
        <div className="card parametros-fluxo-card">
          <div className="parametros-card__title">Status visíveis na Produção</div>
          <div className="parametros-card__hint">
            Desmarque um status para que pedidos nele parem de aparecer na fila de Produção — útil para simplificar a operação do dia a dia.
          </div>
          <div className="parametros-fluxo-grid">
            {ORDER_STATUS_LIST.map((status: OrderStatus) => (
              <label key={status} className="param-toggle-row param-status-row">
                <input
                  type="checkbox"
                  checked={statusFlowVisibility[status]}
                  onChange={() => {
                    toggleStatusFlowVisibility(status);
                    showToast(`"${status}" ${statusFlowVisibility[status] ? "ocultado da" : "exibido na"} Produção.`);
                  }}
                />
                {status}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
