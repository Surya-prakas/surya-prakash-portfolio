"use client";

import ClickSpark from "./ClickSpark";
import ScrollReveal from "./ScrollReveal";
import SpotlightTilt from "./SpotlightTilt";

export default function AchievementCard({ title, detail, delay = 0 }) {
  return (
    <ScrollReveal variant="scale" delay={delay}>
      {/* SpotlightTilt outside ClickSpark so the spark canvas tilts with the
          card rather than staying flat over a tilted surface. The card is not an
          interactive control -- the spark is a decorative response to a click on
          a "Unlocked" badge, so nothing here is keyboard-reachable by design. */}
      <SpotlightTilt>
        <ClickSpark sparkOnClick>
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              // Tighter than .card's 28 because this is a compact one-line row, not
              // a rich card -- but uniform, and on the same step as 28 rather than
              // the asymmetric "16px 20px" this drifted to.
              padding: 20,
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
        </ClickSpark>
      </SpotlightTilt>
    </ScrollReveal>
  );
}
