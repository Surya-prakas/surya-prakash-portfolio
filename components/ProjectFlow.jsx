"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
  ProjectFlow
  ----------------------------------------------------
  Renders a horizontal pipeline (Dataset -> Cleaning -> Training -> ...)
  where each stage lights up in sequence when the diagram scrolls into
  view, instead of a static list. Good for ML projects specifically.

  Usage:
    <ProjectFlow stages={["Dataset", "Cleaning", "Training", "Evaluation", "Deployment"]} />
*/
export default function ProjectFlow({ stages }) {
  const containerRef = useRef(null);
  const [litIndex, setLitIndex] = useState(-1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setLitIndex(stages.length - 1);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        once: true,
        onEnter: () => {
          stages.forEach((_, i) => {
            gsap.delayedCall(i * 0.35, () => setLitIndex(i));
          });
        },
      });
    });

    return () => ctx.revert();
  }, [stages]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0,
        padding: "16px 0",
      }}
    >
      {stages.map((stage, i) => (
        <div key={stage} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid",
              borderColor: i <= litIndex ? "var(--accent-teal-bright)" : "var(--border)",
              background: i <= litIndex ? "var(--surface-2)" : "transparent",
              color: i <= litIndex ? "var(--accent-teal-pale)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              transition: "border-color 0.3s ease, background 0.3s ease, color 0.3s ease",
              whiteSpace: "nowrap",
            }}
          >
            {stage}
          </div>
          {i < stages.length - 1 && (
            <span
              style={{
                margin: "0 6px",
                color: i < litIndex ? "var(--accent-teal-bright)" : "var(--text-muted)",
                transition: "color 0.3s ease",
              }}
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
