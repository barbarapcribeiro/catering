export function PathIcon({
  path,
  size = 18,
  color = "currentColor",
  strokeWidth = 1.8,
}: {
  path: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
