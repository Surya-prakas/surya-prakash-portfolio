"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseLinks } from "./linkify";

/*
  ChatWidget
  ----------------------------------------------------
  A floating chat panel that talks to your /api/chat route
  (see route.js). Pair it with RobotCompanion.jsx by passing
  an onThinking callback so the robot pins to its "think"
  frame range while a response is loading.

  Usage in your layout:

    const [isThinking, setIsThinking] = useState(false);
    <RobotCompanion isThinking={isThinking} />
    <ChatWidget onThinking={setIsThinking} />

  The reply streams in token-by-token (the route proxies NVIDIA NIM's SSE
  through untouched), so "Thinking…" only shows until the first token lands.
*/

const GREETING = {
  role: "assistant",
  content: "Hi, I'm Nova. Ask me about Surya's projects, research, or skills.",
};

// Mirrors MAX_MESSAGE_CHARS in the route. The server enforces it for real;
// this just stops the message being typed past the limit in the first place.
const MAX_CHARS = 500;

const SUGGESTIONS = [
  "What's his fraud detection project about?",
  "Is he open to opportunities?",
  "What technologies does he use?",
];

// Link parsing lives in linkify.js so it can be unit-tested without a DOM
// (scripts/test-linkify.mjs). This only maps its tokens onto elements.
const LINK_STYLE = {
  color: "var(--accent-blue-pale)",
  textDecoration: "underline",
  wordBreak: "break-word",
};

function renderContent(text) {
  return parseLinks(text).map((t, i) =>
    t.type === "text" ? (
      t.value
    ) : (
      <a
        key={i}
        href={t.href}
        target="_blank"
        rel="noopener noreferrer"
        style={LINK_STYLE}
      >
        {t.label}
      </a>
    )
  );
}

export default function ChatWidget({ onThinking }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([GREETING]);
  const [loading, setLoading] = useState(false);
  // True from request start until the first streamed token arrives -- drives
  // the "Thinking…" bubble, which is replaced by the streaming text after that.
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Only shown before the visitor's first message.
  const showSuggestions = !messages.some((m) => m.role === "user") && !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Opened from elsewhere on the page via a window event -- TerminalHero's `ai`
  // command dispatches it. A window CustomEvent rather than lifted state or a
  // context: the only thing crossing the boundary is "open", the two components
  // share no common ancestor below the layout, and this keeps the terminal from
  // needing a handle on the widget at all.
  //
  // Deliberately unconditional (not gated on `open`), so the listener exists
  // whether or not the panel is currently showing -- gating it on `open` would
  // mean the event only worked when the panel was already open.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nova:open-chat", onOpen);
    return () => window.removeEventListener("nova:open-chat", onOpen);
  }, []);

  // 6c. Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // 6a + 6d. Escape closes; Tab cycles within the panel.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      if (!panelRef.current) return;

      // Queried live in DOM order rather than from a hand-kept ref list: the
      // send button is disabled mid-stream (a disabled button isn't focusable),
      // the suggestion chips come and go, and an omission here doesn't fail
      // loudly -- it silently lets Tab escape the panel, which is exactly the
      // bug a fixed [close, input, send] list produced.
      const focusables = [
        ...panelRef.current.querySelectorAll("button, input, textarea, a[href]"),
      ].filter((el) => !el.disabled && el.tabIndex !== -1);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      // Also catches focus sitting outside the panel entirely (e.g. on the
      // page behind it), pulling it back in rather than letting Tab escape.
      if (e.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const send = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text || loading) return;

      const nextMessages = [...messages, { role: "user", content: text }];
      setMessages(nextMessages);
      setInput("");
      setError("");
      setLoading(true);
      setAwaitingFirstToken(true);
      onThinking?.(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });

        // Errors (429, 400, 502…) come back as JSON, not as a stream.
        if (!res.ok) {
          let data = null;
          try {
            data = await res.json();
          } catch {
            /* non-JSON error body */
          }
          setError(data?.error || "Something went wrong. Try again.");
          return;
        }

        if (!res.body) {
          setError("Something went wrong. Try again.");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";
        let started = false;

        // SSE frames are separated by a blank line and can split across reads,
        // so the tail of the buffer is kept until its terminator arrives.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            for (const line of frame.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;

              let delta;
              try {
                delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
              } catch {
                continue; // keep-alive or partial frame — skip it
              }
              if (!delta) continue;

              assembled += delta;

              if (!started) {
                // First token: swap the Thinking bubble for a real message.
                started = true;
                setAwaitingFirstToken(false);
                setMessages((prev) => [...prev, { role: "assistant", content: assembled }]);
              } else {
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", content: assembled };
                  return copy;
                });
              }
            }
          }
        }

        // Stream ended without a single token (upstream cut out mid-response).
        if (!started) setError("Nova didn't reply. Try again.");
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        // Always clears, on success and failure alike, so the robot can't get
        // stuck in its thinking pose.
        setLoading(false);
        setAwaitingFirstToken(false);
        onThinking?.(false);
      }
    },
    [loading, messages, onThinking]
  );

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    // Low-stakes and one click from being re-asked, so no confirm dialog.
    setMessages([GREETING]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 60 }}>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Portfolio assistant"
          style={{
            // 300px flat overflowed narrow phones: at 375px the panel plus the
            // 24px right offset left only 51px of slack, and any smaller device
            // (320px) pushed it off-screen entirely. Clamping to the viewport
            // minus both offsets keeps it fully visible at any width.
            width: "min(300px, calc(100vw - 48px))",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "var(--font-sans)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--accent-teal-bright)",
              }}
            >
              Portfolio assistant
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={reset}
                aria-label="Clear conversation"
                title="Clear conversation"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: 0,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-teal-bright)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 0,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-teal-bright)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                ×
              </button>
            </div>
          </div>

          {/* 6b. Announces streamed replies and errors. "polite" so it waits for
              a pause rather than interrupting; the streaming updates coalesce
              into one announcement at the end for the same reason. */}
          <div
            aria-live="polite"
            aria-atomic="false"
            // Lenis intercepts wheel events on the window and drives the page
            // scroll itself. Without this opt-out, a wheel gesture over the
            // message list scrolls the PAGE behind the panel instead of the
            // transcript, making long conversations unreadable.
            data-lenis-prevent
            style={{
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "var(--surface-2)" : "var(--bg)",
                  border:
                    m.role === "user"
                      ? "1px solid var(--accent-teal)"
                      : "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 12,
                  maxWidth: "85%",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.role === "assistant" ? renderContent(m.content) : m.content}
              </div>
            ))}

            {awaitingFirstToken && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 12,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span className="thinking-pulse-dot" aria-hidden="true" />
                Thinking<span className="terminal-cursor">▊</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  alignSelf: "flex-start",
                  background: "var(--bg)",
                  border: "1px solid var(--accent-teal)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 12,
                  maxWidth: "85%",
                }}
              >
                {error}
              </div>
            )}

            {showSuggestions && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      lineHeight: 1.4,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "6px 9px",
                      cursor: "pointer",
                      transition: "border-color 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-teal-bright)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={MAX_CHARS}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about projects, skills…"
              aria-label="Message"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                padding: "6px 8px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading}
              aria-label="Send"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--surface-2)",
                color: loading ? "var(--text-muted)" : "var(--accent-teal-bright)",
                width: 32,
                flex: "0 0 32px",
                cursor: loading ? "default" : "pointer",
                padding: 0,
                fontSize: 14,
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
            >
              →
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface-1)",
            color: "var(--accent-teal-bright)",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            padding: 0,
            margin: 0,
            transition: "border-color 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-teal-bright)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          aria-label="Open portfolio assistant"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* antenna */}
            <line x1="12" y1="2.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="2" r="1" fill="currentColor" />

            {/* head */}
            <rect
              x="4.5"
              y="5"
              width="15"
              height="12"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            {/* eyes */}
            <circle cx="9.2" cy="11" r="1.4" fill="currentColor" />
            <circle cx="14.8" cy="11" r="1.4" fill="currentColor" />

            {/* mouth */}
            <path
              d="M9.5 14.2c0.8 0.7 4.2 0.7 5 0"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            {/* side ears */}
            <line x1="4.5" y1="9.5" x2="2.7" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="19.5" y1="9.5" x2="21.3" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
