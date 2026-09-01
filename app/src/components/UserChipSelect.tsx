import type { AppUser } from "../types";
import "./UserChipSelect.css";

export function UserChipSelect({
  users,
  selectedIds,
  onToggle,
  emptyLabel = "Nenhum usuário cadastrado ainda. Cadastre em Pessoas › Usuários.",
}: {
  users: AppUser[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyLabel?: string;
}) {
  if (users.length === 0) return <div className="empty-state">{emptyLabel}</div>;
  return (
    <div className="user-chip-select">
      {users.map((u) => (
        <button key={u.id} type="button" className={selectedIds.includes(u.id) ? "is-active" : ""} onClick={() => onToggle(u.id)}>
          {u.name}
        </button>
      ))}
    </div>
  );
}
