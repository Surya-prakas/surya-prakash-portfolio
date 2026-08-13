import Link from "next/link";

// Custom 404 in Nova's voice -- the anomaly/pattern framing she uses in the
// chat and the cinematic intro, rather than a generic "page not found".
// Static and dependency-free on purpose: no companion system, no animation.
export const metadata = {
  title: "404 — Surya Prakash",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
        gap: 0,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--accent-teal-bright)",
          margin: "0 0 18px",
        }}
      >
        Anomaly detected
      </p>

      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(56px, 12vw, 104px)",
          fontWeight: 200,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          margin: 0,
          color: "var(--text-primary)",
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: "clamp(18px, 3vw, 22px)",
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: "20px 0 0",
        }}
      >
        This page doesn&apos;t match any pattern I know.
      </p>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          margin: "10px 0 0",
          maxWidth: 440,
        }}
      >
        I&apos;m usually good at spotting the one thing that doesn&apos;t fit —
        this time it&apos;s the URL. Nothing lives here.
      </p>

      <div
        style={{
          height: 2,
          width: 36,
          background: "var(--accent-teal-bright)",
          borderRadius: 2,
          margin: "28px 0",
        }}
      />

      <Link
        href="/"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--accent-blue-pale)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 18px",
          textDecoration: "none",
          background: "var(--surface-1)",
        }}
      >
        ← Back to the homepage
      </Link>
    </main>
  );
}
