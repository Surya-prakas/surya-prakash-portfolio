"use client";

import ScrollReveal from "./ScrollReveal";

export default function AchievementCard({ title, detail, delay = 0 }) {
  return (
    <ScrollReveal variant="scale" delay={delay}>
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--accent-teal-bright)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🏆
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.03em",
              color: "var(--accent-teal-bright)",
              textTransform: "uppercase",
            }}
          >
            Unlocked · {title}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            {detail}
          </p>
        </div>
      </div>
    </ScrollReveal>
  );
}
