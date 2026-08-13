import { useAppData } from "../mock/AppDataContext";
import "./ProfileSwitcher.css";

export function ProfileSwitcher() {
  const { profiles, currentProfileId, setCurrentProfileId } = useAppData();

  return (
    <label className="profile-switcher">
      <span className="profile-switcher__label">Ver como</span>
      <select value={currentProfileId} onChange={(e) => setCurrentProfileId(e.target.value)}>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
