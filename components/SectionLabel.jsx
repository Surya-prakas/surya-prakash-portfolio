"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SectionLabel({ children }) {
  const lineRef = useRef(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(el, { width: "100%" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { width: "0%" },
        {
          width: "100%",
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div style={{ marginBottom: 12 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>
        {children}
      </p>
      <div
        ref={lineRef}
        style={{
          height: 2,
          width: 0,
          maxWidth: 48,
          background: "var(--accent-teal-bright)",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
