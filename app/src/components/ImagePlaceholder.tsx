import type { CSSProperties } from "react";

export function ImagePlaceholder({
  label = "Imagem",
  style,
  className = "",
}: {
  label?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`image-placeholder ${className}`.trim()} style={style}>
      {label}
    </div>
  );
}
