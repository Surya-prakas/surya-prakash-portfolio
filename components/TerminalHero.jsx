"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  { cmd: "surya@portfolio:~$ whoami", out: "AI & Full-Stack Developer" },
  {
    cmd: "surya@portfolio:~$ cat skills.conf",
    out: "Python · TensorFlow · React · FastAPI · Scikit-learn",
  },
  {
    cmd: "surya@portfolio:~$ ./fraud-detection --status",
    out: "ROC-AUC 0.968 · precision 88.6% · recall 79.6%",
  },
  {
    cmd: "surya@portfolio:~$ echo $STATUS",
    out: "M.Tech Software Engineering, JNTUH — open to opportunities",
  },
];

export default function TerminalHero() {
  const [displayLines, setDisplayLines] = useState([]);
  const [typingDone, setTypingDone] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    async function typeLine(text, onTick) {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        onTick(text.slice(0, i));
        await new Promise((r) => setTimeout(r, 16));
      }
    }

    async function run() {
      for (let idx = 0; idx < LINES.length; idx++) {
        const { cmd, out } = LINES[idx];

        await typeLine(cmd, (partial) => {
          setDisplayLines((prev) => {
            const next = [...prev];
            next[idx] = { cmd: partial, out: "" };
            return next;
          });
        });

        await new Promise((r) => setTimeout(r, 150));

        await typeLine(out, (partial) => {
          setDisplayLines((prev) => {
            const next = [...prev];
            next[idx] = { cmd, out: partial };
            return next;
          });
        });

        await new Promise((r) => setTimeout(r, 250));
      }
      if (!cancelled) setTypingDone(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        background: "#050605",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 24,
        fontFamily: "var(--font-mono)",
        minHeight: 220,
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E24B4A", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF9F27", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#639922", display: "inline-block" }} />
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.9 }}>
        {displayLines.map((line, i) => {
          const isLast = i === displayLines.length - 1;
          const stillTypingThisLine = isLast && !typingDone;
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ color: "var(--text-primary)" }}>
                {line.cmd}
                {stillTypingThisLine && !line.out && (
                  <span className="terminal-cursor">▊</span>
                )}
              </div>
              {line.out && (
                <div style={{ color: "var(--accent-teal-bright)", paddingLeft: 12 }}>
                  {line.out}
                  {stillTypingThisLine && <span className="terminal-cursor">▊</span>}
                </div>
              )}
            </div>
          );
        })}
        {typingDone && (
          <div style={{ color: "var(--text-primary)" }}>
            surya@portfolio:~$ <span className="terminal-cursor">▊</span>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 500, marginTop: 32, marginBottom: 8, fontFamily: "var(--font-sans)" }}>
        AI & Full-Stack Developer
      </h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: 480, fontFamily: "var(--font-sans)", fontSize: 15 }}>
        Focused on Machine Learning, Intelligent Web Applications, and
        Scalable Backend Systems.
      </p>
    </div>
  );
}
