import { useAppData } from "../mock/AppDataContext";
import { Modal } from "./Modal";

export function PopupDisplay() {
  const { popups, currentProfileId, dismissedPopupIds, dismissPopup } = useAppData();

  const current = popups.find(
    (p) => p.active && p.profileIds.includes(currentProfileId) && !dismissedPopupIds.has(p.id),
  );

  if (!current) return null;

  const close = () => dismissPopup(current.id);

  return (
    <Modal onClose={close} width={420}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: current.imageUrl ? -4 : -8 }}>
        <button
          onClick={close}
          aria-label="Fechar"
          style={{ border: "none", background: "none", color: "var(--color-text-muted)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
        >
          &times;
        </button>
      </div>
      {current.imageUrl && (
        <img
          src={current.imageUrl}
          alt=""
          style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 10, marginBottom: 16 }}
        />
      )}
      <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", color: "var(--color-text)" }}>{current.text}</div>
      <button className="btn btn--primary btn--full" style={{ marginTop: 20 }} onClick={close}>
        Entendi
      </button>
    </Modal>
  );
}
