import { useState } from "react";
import { useAppData } from "../../mock/AppDataContext";
import { Modal } from "../../components/Modal";
import { OCCURRENCE_SEVERITIES, OCCURRENCE_STATUSES, OCCURRENCE_TYPES, type Occurrence, type OccurrenceSeverity, type OccurrenceStatus, type OccurrenceType } from "../../types";
import "./Ocorrencias.css";

const EMPTY_FORM = {
  orderId: "",
  type: OCCURRENCE_TYPES[0] as OccurrenceType,
  severity: "Média" as OccurrenceSeverity,
  status: "Aberta" as OccurrenceStatus,
  description: "",
  reportedBy: "",
  resolutionNotes: "",
};

const SEVERITY_STYLE: Record<OccurrenceSeverity, { bg: string; color: string }> = {
  Baixa: { bg: "var(--color-info-soft)", color: "var(--color-info)" },
  Média: { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  Alta: { bg: "var(--color-danger-soft-2)", color: "var(--color-danger)" },
};

const STATUS_STYLE: Record<OccurrenceStatus, { bg: string; color: string }> = {
  Aberta: { bg: "var(--color-danger-soft)", color: "var(--color-danger)" },
  "Em análise": { bg: "var(--color-warning-soft)", color: "var(--color-warning-dark)" },
  Resolvida: { bg: "var(--color-success-soft)", color: "var(--color-success)" },
  Cancelada: { bg: "var(--color-border-soft)", color: "var(--color-text-muted)" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Ocorrencias() {
  const { occurrences, orders, addOccurrence, updateOccurrence, removeOccurrence, showToast } = useAppData();
  const [statusFilter, setStatusFilter] = useState<"todas" | OccurrenceStatus>("todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (o: Occurrence) => {
    setEditingId(o.id);
    setForm({
      orderId: o.orderId ?? "",
      type: o.type,
      severity: o.severity,
      status: o.status,
      description: o.description,
      reportedBy: o.reportedBy ?? "",
      resolutionNotes: o.resolutionNotes ?? "",
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.description.trim()) return;
    const wasResolved = form.status === "Resolvida" || form.status === "Cancelada";
    const payload = {
      orderId: form.orderId || undefined,
      type: form.type,
      severity: form.severity,
      status: form.status,
      description: form.description,
      reportedBy: form.reportedBy || undefined,
      resolutionNotes: form.resolutionNotes || undefined,
      resolvedAt: wasResolved ? new Date().toISOString() : undefined,
    };
    if (editingId) {
      updateOccurrence(editingId, payload);
      showToast("Ocorrência atualizada.");
    } else {
      addOccurrence(payload);
      showToast("Ocorrência registrada com sucesso!");
    }
    setModalOpen(false);
  };

  const remove = (o: Occurrence) => {
    removeOccurrence(o.id);
    showToast("Ocorrência removida.");
  };

  const filtered = statusFilter === "todas" ? occurrences : occurrences.filter((o) => o.status === statusFilter);

  return (
    <div className="ocorrencias-page">
      <div className="ocorrencias-header">
        <div>
          <h1 className="ocorrencias-title">Ocorrências</h1>
          <div className="ocorrencias-subtitle">Registre e acompanhe problemas relatados em pedidos e entregas.</div>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          + Nova ocorrência
        </button>
      </div>

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button className={statusFilter === "todas" ? "is-active" : ""} onClick={() => setStatusFilter("todas")}>
          Todas
        </button>
        {OCCURRENCE_STATUSES.map((s) => (
          <button key={s} className={statusFilter === s ? "is-active" : ""} onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="card ocorrencias-table-card">
        <div className="ocorrencias-table">
          <div className="ocorrencias-table__head">
            <div>Ocorrência</div>
            <div>Pedido</div>
            <div>Severidade</div>
            <div>Criada em</div>
            <div>Status</div>
            <div>Ações</div>
          </div>
          {filtered.map((o) => (
            <div key={o.id} className="ocorrencias-table__row">
              <div>
                <div className="ocorrencias-table__type">{o.type}</div>
                <div className="ocorrencias-table__desc">{o.description}</div>
                {o.reportedBy && <div className="ocorrencias-table__reporter">Relatado por {o.reportedBy}</div>}
              </div>
              <div className="ocorrencias-table__muted">{o.orderId || "—"}</div>
              <div>
                <span className="status-pill" style={{ background: SEVERITY_STYLE[o.severity].bg, color: SEVERITY_STYLE[o.severity].color }}>
                  {o.severity}
                </span>
              </div>
              <div className="ocorrencias-table__muted">{formatDateTime(o.createdAt)}</div>
              <div>
                <span className="status-pill" style={{ background: STATUS_STYLE[o.status].bg, color: STATUS_STYLE[o.status].color }}>
                  {o.status}
                </span>
              </div>
              <div className="ocorrencias-table__actions">
                <button className="link" onClick={() => openEdit(o)}>
                  Editar
                </button>
                <button className="ocorrencias-remove-btn" onClick={() => remove(o)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state">Nenhuma ocorrência encontrada.</div>}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} width={480}>
          <div className="modal-title" style={{ marginBottom: 18 }}>
            {editingId ? "Editar ocorrência" : "Nova ocorrência"}
          </div>
          <div className="modal-form">
            <label className="field-label">
              Pedido relacionado <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                <option value="">Nenhum selecionado</option>
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.id} — {ord.type}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-row">
              <label className="field-label">
                Tipo
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OccurrenceType })}>
                  {OCCURRENCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Severidade
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as OccurrenceSeverity })}>
                  {OCCURRENCE_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field-label">
              Descrição
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o que aconteceu." />
            </label>
            <label className="field-label">
              Relatado por <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              <input value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} placeholder="Nome de quem relatou" />
            </label>
            <label className="field-label">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OccurrenceStatus })}>
                {OCCURRENCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {(form.status === "Resolvida" || form.status === "Cancelada") && (
              <label className="field-label">
                Notas de resolução <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
                <textarea rows={2} value={form.resolutionNotes} onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })} placeholder="O que foi feito para resolver." />
              </label>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn--primary" disabled={!form.description.trim()} onClick={save}>
              {editingId ? "Salvar alterações" : "Registrar ocorrência"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
