import { useAppData } from "../mock/AppDataContext";
import "./Toast.css";

export function Toast() {
  const { toast } = useAppData();
  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
