"use client";

import { useState, useRef, useEffect } from "react";

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
*/

export default function ChatWidget({ onThinking }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I'm Nova. Ask me about Surya's projects, research, or skills.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    onThinking?.(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
      onThinking?.(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 60 }}>
      {open ? (
        <div
          style={{
            width: 300,
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid #eee",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500 }}>Portfolio assistant</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div
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
                  background: m.role === "user" ? "#e6f1fb" : "#f4f4f2",
                  color: "#1a1a1a",
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 12,
                  maxWidth: "85%",
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#f4f4f2",
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 12,
                  color: "#888",
                }}
              >
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid #eee" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about projects, skills…"
              style={{
                flex: 1,
                fontSize: 12,
                padding: "6px 8px",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              aria-label="Send"
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                background: "#fff",
                width: 32,
                cursor: "pointer",
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
            border: "none",
            background: "#1a1a1a",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            padding: 0,
            // Emoji glyphs ship with asymmetric internal whitespace that
            // flex centering can't strip; nudge the glyph into the optical
            // center of the circle. (Apple Color Emoji / Segoe UI Emoji.)
            margin: 0,
          }}
          aria-label="Open portfolio assistant"
        >
          <span
            style={{
              display: "inline-block",
              fontSize: 22,
              lineHeight: "52px",
              width: 52,
              height: 52,
              textAlign: "center",
              // Compensate for emoji's built-in descender + left bearing.
              marginLeft: -2,
              marginTop: -1,
            }}
          >
            💬
          </span>
        </button>
      )}
    </div>
  );
}
