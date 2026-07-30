export default function NovaStatus() {
  const focus = [
    "M.Tech coursework — Software Engineering (JNTUH)",
    "Preparing research paper on fraud detection",
    "Open to Full-Time SWE / AI-ML / Research roles",
  ];

  return (
    <div
      className="card"
      style={{
        maxWidth: 340,
        fontFamily: "var(--font-mono)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
          NOVA / STATUS
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-teal-bright)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>online</span>
        </span>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px", letterSpacing: "0.03em" }}>
        CURRENT FOCUS
      </p>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--accent-teal-pale)", lineHeight: 2 }}>
        {focus.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: 14,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--text-muted)",
        }}
      >
        <span>Last updated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        <span>surya@mtech:~$</span>
      </div>
    </div>
  );
}
