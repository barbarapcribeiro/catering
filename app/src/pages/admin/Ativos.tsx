import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { ASSET_STATUSES, type Asset, type AssetStatus } from "../../types";
import "./Ativos.css";

interface FormState {
  name: string;
  description: string;
  status: AssetStatus;
  assetTypeId: string;
  unitOfMeasureId: string;
  costCenterCode: string;
}

const EMPTY_FORM: FormState = { name: "", description: "", status: ASSET_STATUSES[0], assetTypeId: "", unitOfMeasureId: "", costCenterCode: "" };

export function Ativos() {
  const { assets, assetTypes, costCenters, addAsset, updateAsset, removeAsset, showToast } = useAppData();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [nameFilter, setNameFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "todos">("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [ccFilter, setCcFilter] = useState("todos");

  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const activeCostCenters = costCenters.filter((c) => c.active);
  const activeAssetTypes = assetTypes.filter((t) => t.active);
  const typeById = useMemo(() => Object.fromEntries(assetTypes.map((t) => [t.id, t])), [assetTypes]);
  const ccByCode = useMemo(() => Object.fromEntries(costCenters.map((c) => [c.code, c])), [costCenters]);

  const selectedType = form.assetTypeId ? typeById[form.assetTypeId] : undefined;

  useEffect(() => {
    if (!qrAsset) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(`DIRECT-EVENTOS:ATIVO:${qrAsset.id}`, { width: 220, margin: 1 }).then(setQrDataUrl);
  }, [qrAsset]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (a: Asset) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      description: a.description ?? "",
      status: a.status,
      assetTypeId: a.assetTypeId,
      unitOfMeasureId: a.unitOfMeasureId ?? "",
      costCenterCode: a.costCenterCode ?? "",
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description || undefined,
      status: form.status,
      assetTypeId: form.assetTypeId,
      unitOfMeasureId: form.unitOfMeasureId || undefined,
      costCenterCode: form.costCenterCode || undefined,
    };
    if (editingId) {
      updateAsset(editingId, payload);
      showToast("Ativo atualizado.");
      setModalOpen(false);
    } else {
      const created = addAsset(payload);
      showToast("Ativo cadastrado com sucesso!");
      setModalOpen(false);
      setQrAsset(created);
    }
  };

  const remove = (a: Asset) => {
    removeAsset(a.id);
    showToast("Ativo removido.");
  };

  const clearFilters = () => {
    setNameFilter("");
    setDescFilter("");
    setStatusFilter("todos");
    setTypeFilter("todos");
    setCcFilter("todos");
  };

  const filtered = assets.filter((a) => {
    if (nameFilter && !a.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (descFilter && !(a.description ?? "").toLowerCase().includes(descFilter.toLowerCase())) return false;
    if (statusFilter !== "todos" && a.status !== statusFilter) return false;
    if (typeFilter !== "todos" && a.assetTypeId !== typeFilter) return false;
    if (ccFilter !== "todos" && a.costCenterCode !== ccFilter) return false;
    return true;
  });

  const printLabel = () => {
    window.print();
  };

  return (
    <div className="ativos-page">
      <div className="ativos-header">
        <h1 className="ativos-title">Gestão de ativos</h1>
        <div className="ativos-header__actions">
          <button className="btn btn--outline" onClick={() => navigate("/admin/tipos-ativo")}>
            Tipos de ativo
          </button>
          <button className="btn btn--outline" onClick={() => navigate("/admin/ativos/checkin")}>
            Check-in / Check-out
          </button>
          <button className="btn btn--primary" onClick={openNew}>
            + Novo ativo
          </button>
        </div>
      </div>

      <div className="card ativos-filters">
        <div className="field-row">
          <label className="field-label">
            Nome
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Nome" />
          </label>
          <label className="field-label">
            Descrição
            <input value={descFilter} onChange={(e) => setDescFilter(e.target.value)} placeholder="Descrição" />
          </label>
        </div>
        <div className="field-row">
          <label className="field-label">
            Status do ativo
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "todos")}>
              <option value="todos">Todos</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Tipo do ativo
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="todos">Todos</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Departamento do ativo
            <select value={ccFilter} onChange={(e) => setCcFilter(e.target.value)}>
              <option value="todos">Todos</option>
              {costCenters.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} · {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="ativos-filters__actions">
          <button className="btn btn--outline" onClick={clearFilters}>
            Limpar
          </button>
        </div>
      </div>

      <div className="card ativos-table-card">
        <div className="ativos-list-title">Resultado da pesquisa &middot; visualizando {filtered.length} de {assets.length} registros</div>
        <div className="ativos-table">
          <div className="ativos-table__head">
            <div>ID</div>
            <div>Nome</div>
            <div>Descrição</div>
            <div>Departamento</div>
            <div>Tipo ativo</div>
            <div>Status</div>
            <div>QR</div>
            <div>Ações</div>
          </div>
          {filtered.map((a) => (
            <div key={a.id} className="ativos-table__row">
              <div className="ativos-table__muted">{a.id.replace(/^asset/, "#")}</div>
              <div className="ativos-table__name">{a.name}</div>
              <div className="ativos-table__muted">{a.description || "—"}</div>
              <div className="ativos-table__muted">{a.costCenterCode ? ccByCode[a.costCenterCode]?.name ?? a.costCenterCode : "—"}</div>
              <div className="ativos-table__muted">{typeById[a.assetTypeId]?.name ?? "—"}</div>
              <div>
                <span className="pill-tag">{a.status}</span>
              </div>
              <div>
                <button className="ativos-qr-btn" onClick={() => setQrAsset(a)} aria-label="Ver QR code do ativo" title="Ver QR code">
                  ⊞
                </button>
              </div>
              <div className="ativos-table__actions">
                <button className="link" onClick={() => openEdit(a)}>
                  Editar
                </button>
                <button className="ativos-remove-btn" onClick={() => remove(a)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhum ativo cadastrado ainda.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={620}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar ativo" : "Novo ativo"}
          </div>
          <div className="modal-form">
            <div className="field-row">
              <label className="field-label">
                Nome
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" />
              </label>
              <label className="field-label">
                Descrição
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" />
              </label>
            </div>
            <div className="field-row">
              <label className="field-label">
                Status do ativo
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}>
                  {ASSET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Tipo do ativo
                <select
                  value={form.assetTypeId}
                  onChange={(e) => setForm({ ...form, assetTypeId: e.target.value, unitOfMeasureId: "" })}
                >
                  <option value="">Selecione o tipo de ativo</option>
                  {activeAssetTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-row">
              <label className="field-label">
                Unidade de medida do ativo
                <select
                  value={form.unitOfMeasureId}
                  disabled={!selectedType || selectedType.unitsOfMeasure.length === 0}
                  onChange={(e) => setForm({ ...form, unitOfMeasureId: e.target.value })}
                >
                  <option value="">{selectedType ? "Selecione a unidade de medida" : "Selecione o tipo de ativo primeiro"}</option>
                  {selectedType?.unitsOfMeasure.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.qty} {u.unit}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Departamento do ativo
                <select value={form.costCenterCode} onChange={(e) => setForm({ ...form, costCenterCode: e.target.value })}>
                  <option value="">Selecione o departamento</option>
                  {activeCostCenters.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.name.trim()} onClick={save}>
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {qrAsset && (
        <Modal onClose={() => setQrAsset(null)} width={360}>
          <div className="ativos-qr-modal">
            <div className="modal-title">Etiqueta do ativo</div>
            <div className="ativos-qr-print-area">
              {qrDataUrl && <img src={qrDataUrl} alt={`QR code do ativo ${qrAsset.name}`} width={200} height={200} />}
              <div className="ativos-qr-modal__name">{qrAsset.name}</div>
              <div className="ativos-qr-modal__id">{qrAsset.id.replace(/^asset/, "#")}</div>
            </div>
            <div className="ativos-qr-modal__hint">Cole essa etiqueta no ativo físico. A leitura do código abre o ativo direto na tela de check-in / check-out.</div>
            <div className="modal-actions">
              <button className="btn btn--outline" onClick={() => setQrAsset(null)}>
                Fechar
              </button>
              <button className="btn btn--primary" onClick={printLabel}>
                Imprimir etiqueta
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
