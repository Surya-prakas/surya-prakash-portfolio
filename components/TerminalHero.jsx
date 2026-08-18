"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ClickSpark from "./ClickSpark";
import { useSmoothScroll } from "./SmoothScrollProvider";

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

const PROMPT = "surya@portfolio:~$";
const RESUME_PATH = "/resume.pdf";

// Section-scroll commands: command name -> the id it scrolls to and the label
// echoed back. All eight ids were verified present on <section> elements in
// app/page.js, so none had to be added -- but scrollToId still reports a miss
// rather than silently doing nothing if one is ever renamed.
const SECTIONS = {
  about: "About",
  projects: "Projects",
  experience: "Experience",
  achievements: "Achievements",
  skills: "Skills",
  education: "Education",
  faq: "FAQ",
  contact: "Contact",
};

import { GITHUB_URL, LINKEDIN_URL } from "../app/site";

const LINKS = {
  github: GITHUB_URL,
  linkedin: LINKEDIN_URL,
};

// What `help` prints. The three easter eggs (`sudo hire surya`, `coffee`,
// `konami`) are deliberately absent: a listed easter egg stops being one. Add
// them here if they should be discoverable rather than found.
const HELP = [
  ["help", "list available commands"],
  ["about", "scroll to About"],
  ["projects", "scroll to Projects"],
  ["experience", "scroll to Experience"],
  ["achievements", "scroll to Achievements"],
  ["skills", "scroll to Skills"],
  ["education", "scroll to Education"],
  ["faq", "scroll to FAQ"],
  ["contact", "scroll to Contact"],
  ["resume", "download my resume"],
  ["github", "open my GitHub profile"],
  ["linkedin", "open my LinkedIn profile"],
  ["ai", "ask Nova, the site assistant"],
  ["clear", "clear this session"],
];

// Output colours. `err` reuses the red already sitting in this file for the
// window's close dot rather than inventing a token for one message; there is no
// error colour in the palette in globals.css.
const TONE = {
  out: "var(--accent-teal-bright)",
  err: "#E24B4A",
};

const line = (text, tone = "out") => ({ text, tone });

// Attempts the download and reports what actually happened. public/resume.pdf
// does NOT exist in this repo yet, so today this reliably prints the miss -- the
// HEAD check is here precisely so that reads as an explicit "not found" in the
// terminal instead of the browser quietly saving a 404 page as "resume.pdf".
// Drop the file into public/ and this path starts working with no code change.
async function resumeLines() {
  try {
    const res = await fetch(RESUME_PATH, { method: "HEAD", cache: "no-store" });
    if (!res.ok) {
      return [
        line(`resume.pdf not found (HTTP ${res.status}).`, "err"),
        line("Add the file at public/resume.pdf to enable this command.", "err"),
      ];
    }
  } catch {
    return [line("resume.pdf could not be reached — check your connection.", "err")];
  }

  const a = document.createElement("a");
  a.href = RESUME_PATH;
  a.download = "Surya-Prakash-Resume.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return [line("Downloading resume.pdf…")];
}

export default function TerminalHero() {
  const [displayLines, setDisplayLines] = useState([]);
  const [typingDone, setTypingDone] = useState(false);
  // The interactive session, kept separate from displayLines above so `clear`
  // can empty it without touching the scripted intro.
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const scrollBoxRef = useRef(null);
  const sparkRef = useRef(null);
  const { scrollToId } = useSmoothScroll();

  // Fires the spark at the prompt -- where the eyes already are, having just
  // typed -- rather than at the card's centre. Only the three easter eggs call
  // this; regular commands stay silent, and ClickSpark itself is mounted with
  // sparkOnClick off so clicking the log to refocus never sparks either.
  const sparkAtPrompt = useCallback(() => {
    const r = inputRef.current?.getBoundingClientRect();
    if (r) sparkRef.current?.burst(r.left, r.top + r.height / 2);
  }, []);

  useEffect(() => {
    // No "have I already run?" ref guard here, deliberately. There used to be
    // one, and combined with the `cancelled` flag below it deadlocked the whole
    // intro under React StrictMode: mount ran the effect, StrictMode's immediate
    // cleanup set cancelled = true, and the second invocation hit the ref guard
    // and returned -- leaving the first (cancelled) run as the only one, which
    // bailed after emitting a single empty line. The visible symptom was a
    // terminal showing nothing but a blinking cursor, and typingDone never
    // becoming true, so no interactive prompt ever appeared.
    //
    // `cancelled` alone is the correct guard: the discarded run stops, the
    // surviving run types from scratch, and setDisplayLines writes by index so
    // any partial state from the discarded run is overwritten rather than
    // duplicated.
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

  // Pin the interactive log to its latest line. Sets scrollTop on the box
  // directly rather than calling scrollIntoView on a sentinel: scrollIntoView
  // walks up every scrollable ancestor, so it would also move the PAGE, which
  // means fighting Lenis for the window scroll on every submitted command.
  useEffect(() => {
    const box = scrollBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [history]);

  // Focus the prompt as soon as the intro hands over.
  useEffect(() => {
    if (typingDone) inputRef.current?.focus();
  }, [typingDone]);

  const execute = useCallback(
    async (raw) => {
      const entered = raw.trim();
      const cmd = entered.toLowerCase();
      const echo = (lines) => setHistory((h) => [...h, { cmd: entered, lines }]);

      // Bare Enter: a fresh prompt line, same as a real shell.
      if (!entered) return echo([]);

      if (cmd === "clear") return setHistory([]);

      if (cmd === "help") {
        // padEnd against the longest name (12) + 2, and the card is monospace,
        // so the descriptions line up as a column. The trailing teaser is not a
        // HELP entry on purpose: no name to pad, and it must stay out of any
        // future "is this a command?" read of that list.
        return echo([
          ...HELP.map(([name, desc]) => line(`${name.padEnd(14)}${desc}`)),
          line("…and maybe a few more, if you know where to look."),
        ]);
      }

      // Object.hasOwn, not a bare truthy lookup: `cmd` is untrusted text, and
      // plain SECTIONS[cmd] also resolves inherited keys -- typing "constructor"
      // or "toString" would match Object.prototype and be treated as a command
      // (LINKS["toString"] would hand window.open a stringified function).
      if (Object.hasOwn(SECTIONS, cmd)) {
        const found = scrollToId(cmd);
        // Blur before the page moves: a focused input that scrolls out of view
        // gets yanked back by the browser on the next keystroke, which would
        // undo the scroll the command just performed.
        inputRef.current?.blur();
        return echo(
          found
            ? [line(`Scrolling to ${SECTIONS[cmd]}…`)]
            : [line(`Section "${cmd}" is not on this page.`, "err")]
        );
      }

      if (Object.hasOwn(LINKS, cmd)) {
        window.open(LINKS[cmd], "_blank", "noopener,noreferrer");
        return echo([line(`Opening ${LINKS[cmd]}`)]);
      }

      if (cmd === "ai") {
        window.dispatchEvent(new CustomEvent("nova:open-chat"));
        return echo([line("Opening Nova — ask her anything about Surya.")]);
      }

      if (cmd === "coffee") {
        sparkAtPrompt();
        return echo([line("☕ Boosting productivity...")]);
      }

      if (cmd === "konami") {
        sparkAtPrompt();
        return echo([line("Developer mode unlocked. You found the easter egg. 🎮")]);
      }

      // The two resume paths are async, so they hold `busy` for the round trip
      // and re-render the prompt as unavailable instead of letting a second
      // Enter queue a duplicate download.
      if (cmd === "resume") {
        setBusy(true);
        const lines = await resumeLines();
        setBusy(false);
        return echo(lines);
      }

      if (cmd === "sudo hire surya") {
        // Sparks on entry, not after the round trip: the moment being marked is
        // finding the command, and resumeLines() can take a beat or fail.
        sparkAtPrompt();
        setBusy(true);
        const lines = await resumeLines();
        setBusy(false);
        return echo([
          line("Permission granted."),
          line("Resume downloading..."),
          ...lines,
        ]);
      }

      return echo([
        line(`command not found: ${entered}`, "err"),
        line("type 'help' for available commands.", "err"),
      ]);
    },
    [scrollToId, sparkAtPrompt]
  );

  function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const raw = input;
    setInput("");
    execute(raw);
  }

  return (
    // sparkOnClick is deliberately off. The burst is raised by sparkAtPrompt()
    // from the three easter-egg branches above, so clicking the log to refocus
    // the prompt -- or running help/about/projects -- produces nothing.
    <ClickSpark ref={sparkRef}>
      <div
        style={{
          background: "var(--surface-0)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 24,
          fontFamily: "var(--font-mono)",
          minHeight: 220,
        }}
      >
        {/*
          Cursor blink ships with this component instead of living in
          app/globals.css, so it can't be lost to a stylesheet reorganization.
          The !important flags are deliberate: globals.css has a
          `@media (prefers-reduced-motion: reduce) { * { animation-duration:
          0.01ms !important; animation-iteration-count: 1 !important } }` rule,
          and without matching !important here the blink is silently flattened
          whenever the OS/browser reports reduce-motion. A 1Hz opacity toggle on
          a text glyph involves no movement and sits well under the WCAG 2.3.1
          three-flashes-per-second threshold.
        */}
        <style jsx>{`
          .terminal-cursor-inline {
            display: inline-block;
            animation: terminalCursorBlink 1s step-end infinite !important;
            animation-duration: 1s !important;
            animation-iteration-count: infinite !important;
          }
          @keyframes terminalCursorBlink {
            0%,
            49% {
              opacity: 1;
            }
            50%,
            100% {
              opacity: 0;
            }
          }
        `}</style>
  
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
                    <span className="terminal-cursor-inline">▊</span>
                  )}
                </div>
                {line.out && (
                  <div style={{ color: "var(--accent-teal-bright)", paddingLeft: 12 }}>
                    {line.out}
                    {stillTypingThisLine && <span className="terminal-cursor-inline">▊</span>}
                  </div>
                )}
              </div>
            );
          })}
  
          {typingDone && (
            <div
              ref={scrollBoxRef}
              // Lenis intercepts wheel events on the window and drives the page
              // scroll itself. Without this opt-out a wheel gesture over a long
              // command log scrolls the PAGE instead of the log -- the same fix
              // ChatWidget's transcript needs.
              data-lenis-prevent
              // Terminal convention: a click anywhere in the log returns you to
              // the prompt.
              onClick={() => inputRef.current?.focus()}
              style={{ maxHeight: 200, overflowY: "auto", marginTop: 4 }}
            >
              {history.map((entry, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ color: "var(--text-primary)" }}>
                    {`${PROMPT} ${entry.cmd}`}
                  </div>
                  {entry.lines.map((l, j) => (
                    <div
                      key={j}
                      style={{ color: TONE[l.tone], paddingLeft: 12, whiteSpace: "pre-wrap" }}
                    >
                      {l.text}
                    </div>
                  ))}
                </div>
              ))}
  
              <form
                onSubmit={onSubmit}
                style={{ display: "flex", alignItems: "center", color: "var(--text-primary)" }}
              >
                <label htmlFor="terminal-input" style={{ whiteSpace: "pre" }}>
                  {`${PROMPT} `}
                </label>
                <input
                  id="terminal-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Terminal command"
                  style={{
                    // The card is monospace, so 1ch is exactly one character wide:
                    // sizing the field to its own content lands the block glyph
                    // below precisely where the caret is, without measuring text.
                    //
                    // ponytail: only tracks a caret at end-of-input. Arrow-keying
                    // into the middle of a command leaves the glyph at the end.
                    // Fix by rendering the value as two spans around the real
                    // caret index if that ever matters.
                    width: `${Math.max(input.length, 1)}ch`,
                    maxWidth: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "inherit",
                    font: "inherit",
                    padding: 0,
                    // The blinking block IS the cursor here; leaving the native
                    // caret on would draw two.
                    caretColor: "transparent",
                  }}
                />
                <span className="terminal-cursor-inline" aria-hidden="true">
                  ▊
                </span>
              </form>
            </div>
          )}
        </div>
  
        <h1 style={{ fontSize: 32, fontWeight: 500, marginTop: 32, marginBottom: 8, fontFamily: "var(--font-sans)" }}>
          AI &amp; Full-Stack Developer
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 480, fontFamily: "var(--font-sans)", fontSize: 15 }}>
          Focused on Machine Learning, Intelligent Web Applications, and
          Scalable Backend Systems.
        </p>
      </div>
    </ClickSpark>
  );
}
