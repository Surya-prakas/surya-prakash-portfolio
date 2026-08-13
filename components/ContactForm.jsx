"use client";

import { useState } from "react";

/*
  ContactForm
  ----------------------------------------------------
  Posts to /api/contact, which relays the message over Resend. Field styling
  follows ChatWidget's inputs (surface-2 fill, border token, 8px radius) so this
  doesn't introduce a second input language on the site.

  The route returns a 503 with a readable message when RESEND_API_KEY is absent,
  so an unconfigured deployment shows the error state below rather than throwing.
*/

const FIELD = {
  width: "100%",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--text-primary)",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const LABEL = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  margin: "0 0 6px",
};

// Focus ring via the accent border rather than the UA outline, matching the
// hover treatment on ChatWidget's launcher. Applied through handlers because
// inline styles can't express :focus-visible.
const focusOn = (e) => {
  e.currentTarget.style.borderColor = "var(--accent-teal-bright)";
};
const focusOff = (e) => {
  e.currentTarget.style.borderColor = "var(--border)";
};

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  // "idle" | "sending" | "sent" | "error"
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // The route always answers with JSON, but a proxy or a crash could return
      // HTML -- parsing defensively keeps that from surfacing as a bare
      // "Unexpected token <" to the visitor.
      let data = null;
      try {
        data = await res.json();
      } catch {
        /* fall through to the status-code branch */
      }

      if (!res.ok) {
        setError(data?.error || "Couldn't send that. Please email me directly.");
        setStatus("error");
        return;
      }

      setForm({ name: "", email: "", message: "" });
      setStatus("sent");
    } catch {
      // Network-level failure (offline, DNS, blocked request).
      setError("Network error — check your connection, or email me directly.");
      setStatus("error");
    }
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={onSubmit}
      style={{
        marginTop: 28,
        maxWidth: 520,
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <label htmlFor="contact-name" style={LABEL}>
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
          onFocus={focusOn}
          onBlur={focusOff}
          disabled={sending}
          style={FIELD}
        />
      </div>

      <div>
        <label htmlFor="contact-email" style={LABEL}>
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          onFocus={focusOn}
          onBlur={focusOff}
          disabled={sending}
          style={FIELD}
        />
      </div>

      <div>
        <label htmlFor="contact-message" style={LABEL}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          value={form.message}
          onChange={set("message")}
          onFocus={focusOn}
          onBlur={focusOff}
          disabled={sending}
          style={{ ...FIELD, resize: "vertical", fontFamily: "var(--font-sans)" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={sending}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: sending ? "var(--text-muted)" : "var(--accent-blue-pale)",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: sending ? "default" : "pointer",
            transition: "border-color 0.2s ease, color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!sending) e.currentTarget.style.borderColor = "var(--accent-teal-bright)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {sending ? "Sending…" : "Send message"}
        </button>

        {/* Single live region for all three outcomes, so a screen reader hears
            the result without the focus moving. */}
        <p
          role="status"
          aria-live="polite"
          style={{
            margin: 0,
            fontSize: 13,
            color:
              status === "error"
                ? "var(--accent-blue-pale)"
                : "var(--accent-teal-bright)",
          }}
        >
          {status === "sent" && "Thanks — message sent. I'll get back to you."}
          {status === "error" && error}
        </p>
      </div>
    </form>
  );
}
