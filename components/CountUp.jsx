"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
  CountUp
  ----------------------------------------------------
  Animates a number counting up from 0 to `value` when scrolled into view.

  Usage:
    <CountUp value={0.968} decimals={3} prefix="ROC-AUC " />
    <CountUp value={88.6} decimals={1} suffix="%" prefix="Precision " />
    <CountUp value={3554.86} decimals={2} prefix="MAE " />
*/
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
}) {
  const ref = useRef(null);
  const [display, setDisplay] = useState((0).toFixed(decimals));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplay(value.toFixed(decimals));
      return;
    }

    const proxy = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        val: value,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate: () => setDisplay(proxy.val.toFixed(decimals)),
      });
    });

    return () => ctx.revert();
  }, [value, decimals, duration]);

  return (
    <span
      ref={ref}
      style={{ fontFamily: "var(--font-mono)", color: "var(--accent-teal-bright)" }}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
