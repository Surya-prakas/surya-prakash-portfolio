"use client";

import { useEffect } from "react";
import Link from "next/link";

// Global error boundary in Nova's voice — matches the not-found page tone.
// Receives `reset` from Next.js to attempt recovery, plus a link home.
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error for debugging — don't swallow it silently.
    console.error("[Global Error Boundary]", error);
  }, [error]);

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
        System error
      </p>

      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(48px, 10vw, 88px)",
          fontWeight: 200,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          margin: 0,
          color: "var(--text-primary)",
        }}
      >
        500
      </h1>

      <p
        style={{
          fontSize: "clamp(18px, 3vw, 22px)",
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: "20px 0 0",
        }}
      >
        Something unexpected happened.
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
        I caught an anomaly in the pattern — a render path I didn&apos;t
        anticipate. It&apos;s not you, it&apos;s me.
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

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => reset()}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 18px",
            textDecoration: "none",
            background: "var(--surface-1)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>

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
      </div>
    </main>
  );
}