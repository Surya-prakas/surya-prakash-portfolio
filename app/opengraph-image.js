import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "./site";

// File-convention OG image. Next's App Router picks this up automatically and
// emits both og:image and twitter:image pointing at /opengraph-image, so
// layout.js deliberately does NOT set openGraph.images -- see the note there.
export const runtime = "edge";
export const alt = "Surya Prakash — AI & Full-Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pulled from the real tokens in globals.css rather than the hexes in the
// brief. Satori resolves no CSS variables and inherits no stylesheet, so the
// values have to be literal here -- keep them in sync with :root if the
// palette changes.
const BG = "#0a0b0a"; // --bg
const TEXT_PRIMARY = "#e6f1fb"; // --text-primary
const TEXT_SECONDARY = "#9ba3a0"; // --text-secondary
const TEXT_MUTED = "#5f6663"; // --text-muted
const ACCENT_TEAL_BRIGHT = "#5dcaa5"; // --accent-teal-bright
const BORDER = "#262a28"; // --border

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BG,
          color: TEXT_PRIMARY,
          padding: "0 88px",
          // Satori has no default font-family to fall back on for a bare div,
          // so an explicit stack keeps text from silently failing to render.
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Teal wash echoing the site's accent, kept far from the text so it
            reads as depth rather than a gradient behind the words. */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -200,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(93,202,165,0.16) 0%, rgba(93,202,165,0) 70%)",
          }}
        />

        {/* Eyebrow: mono-ish, letterspaced, teal — the same treatment the
            section labels use on the site itself. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            letterSpacing: 3,
            color: ACCENT_TEAL_BRIGHT,
            fontFamily: "monospace",
          }}
        >
          <div style={{ width: 34, height: 2, background: ACCENT_TEAL_BRIGHT }} />
          PORTFOLIO
        </div>

        <div
          style={{
            fontSize: 82,
            fontWeight: 600,
            letterSpacing: -2,
            marginTop: 22,
            lineHeight: 1.05,
          }}
        >
          Surya Prakash
        </div>

        <div style={{ fontSize: 34, color: TEXT_SECONDARY, marginTop: 14 }}>
          AI &amp; Full-Stack Developer
        </div>

        <div
          style={{
            fontSize: 21,
            color: TEXT_MUTED,
            marginTop: 26,
            maxWidth: 830,
            lineHeight: 1.45,
          }}
        >
          {SITE_DESCRIPTION}
        </div>

        {/* Footer rule + stack line, so the card carries a little proof rather
            than just a name. */}
        <div
          style={{
            display: "flex",
            marginTop: 40,
            paddingTop: 24,
            borderTop: `1px solid ${BORDER}`,
            fontSize: 19,
            color: TEXT_MUTED,
            fontFamily: "monospace",
            letterSpacing: 1,
          }}
        >
          Python · TensorFlow · React · FastAPI
        </div>
      </div>
    ),
    { ...size }
  );
}
