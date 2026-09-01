import { useRef, useState } from "react";
import type { OrderAttachment } from "../types";
import "./AttachmentsField.css";

interface AttachmentsFieldProps {
  value: OrderAttachment[];
  onChange: (files: OrderAttachment[]) => void;
  label?: string;
}

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/** Anexo genérico (PDF, imagem, planilha etc.) em pedidos. Limita o tamanho por arquivo pra não
 * repetir o estouro de cota do localStorage que já aconteceu com fotos grandes. */
export function AttachmentsField({ value, onChange, label = "Anexar arquivo" }: AttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setLoading(true);
    const accepted: OrderAttachment[] = [];
    let rejected = false;
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        rejected = true;
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        accepted.push({ id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, size: file.size, type: file.type, dataUrl });
      } catch {
        rejected = true;
      }
    }
    if (rejected) setError(`Alguns arquivos não foram anexados (limite de ${formatSize(MAX_FILE_BYTES)} por arquivo).`);
    if (accepted.length > 0) onChange([...value, ...accepted]);
    setLoading(false);
  };

  const removeAt = (id: string) => onChange(value.filter((f) => f.id !== id));

  return (
    <div className="field-label">
      {label} <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
      <div className="attachments-field">
        {value.length > 0 && (
          <ul className="attachments-field__list">
            {value.map((f) => (
              <li key={f.id} className="attachments-field__item">
                <span className="attachments-field__icon">📎</span>
                <span className="attachments-field__name" title={f.name}>{f.name}</span>
                <span className="attachments-field__size">{formatSize(f.size)}</span>
                <button type="button" className="attachments-field__remove" onClick={() => removeAt(f.id)} aria-label={`Remover ${f.name}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn--outline btn--sm" disabled={loading} onClick={() => inputRef.current?.click()}>
          {loading ? "Carregando..." : "Escolher arquivo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <div className="error-text" style={{ marginTop: 6 }}>{error}</div>}
    </div>
  );
}
