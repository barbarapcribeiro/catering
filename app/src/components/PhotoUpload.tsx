import { useRef, useState } from "react";
import "./PhotoUpload.css";

interface PhotoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
}

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

/** Redimensiona/comprime a imagem no navegador antes de guardar — uma foto de celular direto da câmera
 * pode passar de 5–8MB em base64, o que estoura a cota do localStorage e derruba o app inteiro. */
function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível abrir essa imagem."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const keepsAlpha = file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif";
        resolve(keepsAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({ value, onChange, label = "Foto" }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      onChange(dataUrl);
    } catch {
      setError("Não foi possível carregar essa imagem. Tente outra foto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="field-label">
      {label} <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
      <div className="photo-upload">
        <div className="photo-upload__preview">
          {value ? <img src={value} alt="" /> : <span className="photo-upload__placeholder">{loading ? "Carregando..." : "Sem foto"}</span>}
        </div>
        <div className="photo-upload__actions">
          <button type="button" className="btn btn--outline btn--sm" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? "Carregando..." : value ? "Trocar foto" : "Escolher foto"}
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
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <div className="error-text" style={{ marginTop: 6 }}>{error}</div>}
    </div>
  );
}
