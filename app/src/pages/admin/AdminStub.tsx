export function AdminStub({ title }: { title: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Em construção — disponível em breve.</div>
    </div>
  );
}
