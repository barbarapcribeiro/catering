import { useRef } from "react";
import "./PhotoUpload.css";

interface PhotoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
}

export function PhotoUpload({ value, onChange, label = "Foto" }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="field-label">
      {label} <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
      <div className="photo-upload">
        <div className="photo-upload__preview">
          {value ? <img src={value} alt="" /> : <span className="photo-upload__placeholder">Sem foto</span>}
        </div>
        <div className="photo-upload__actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => inputRef.current?.click()}>
            {value ? "Trocar foto" : "Escolher foto"}
          </button>
          {value && (
            <button type="button" className="link" onClick={() => onChange(undefined)}>
              Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
