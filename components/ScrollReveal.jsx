"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
  ScrollReveal
  ----------------------------------------------------
  Wraps any children and animates them in once when they scroll into view.

  Usage:
    <ScrollReveal>...</ScrollReveal>                    fade + slide up (default)
    <ScrollReveal variant="scale">...</ScrollReveal>     fade + scale up (good for images/charts)
    <ScrollReveal delay={0.15}>...</ScrollReveal>        stagger multiple by hand

  Respects prefers-reduced-motion (see globals.css global rule already
  in place — this component's animation duration will be near-instant
  for users with that preference since GSAP timelines are also affected
  by the CSS override... but to be safe we also check it directly here).
*/
export default function ScrollReveal({
  children,
  variant = "up",
  delay = 0,
  className,
  style,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const fromVars =
      variant === "scale"
        ? { opacity: 0, scale: 0.92 }
        : { opacity: 0, y: 28 };

    const toVars =
      variant === "scale"
        ? { opacity: 1, scale: 1 }
        : { opacity: 1, y: 0 };

    const ctx = gsap.context(() => {
      gsap.fromTo(el, fromVars, {
        ...toVars,
        duration: 0.7,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, [variant, delay]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  );
}
