import { Modal } from "./Modal";
import type { KitContentLine } from "../mock/kitContents";
import "./KitDetailsModal.css";

export function KitDetailsModal({
  name,
  description,
  contents,
  onClose,
}: {
  name: string;
  description?: string;
  contents: KitContentLine[];
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} width={440}>
      <div className="modal-title" style={{ marginBottom: 6 }}>
        {name}
      </div>
      {description && (
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>{description}</div>
      )}
      <div className="kit-details-heading">O que vem no kit</div>
      <div className="kit-details-list">
        {contents.map((c, i) => (
          <div key={i} className="kit-details-list__row">
            <span>{c.label}</span>
            <span className="kit-details-list__qty">{c.qty}x</span>
          </div>
        ))}
        {contents.length === 0 && <div className="empty-state">Nenhum item cadastrado para este kit.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn btn--outline" onClick={onClose}>
          Fechar
        </button>
      </div>
    </Modal>
  );
}
