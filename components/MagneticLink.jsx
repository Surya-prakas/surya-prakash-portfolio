"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  MagneticLink
  ----------------------------------------------------
  Wraps an interactive element so it drifts slightly toward the cursor while the
  cursor is near it, then springs back when the cursor leaves.

  Renders a <span> wrapper rather than cloning the child and injecting a
  transform, so it composes with anything (<a>, <button>) without fighting that
  element's own styles -- notably .tag:hover's `transform: scale(1.06)`, which a
  transform on the same node would overwrite.

  Attraction is tracked on the window, not the element: the effect is supposed to
  begin BEFORE the cursor arrives, and an element-level mousemove cannot fire in
  the surrounding margin where that approach happens.
*/
const MAX_PULL = 10; // px at the edge of the radius -- past ~12 it reads as a glitch
const RADIUS_PAD = 60; // px of invisible catchment beyond the element's own box

export default function MagneticLink({ children, className, style }) {
  const ref = useRef(null);
  // Gate on a state flag rather than returning early during render, so the
  // wrapper markup is identical between server and client and hydration is
  // stable. matchMedia is only readable after mount.
  const [enabled, setEnabled] = useState(false);
  const frameRef = useRef(0);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const hoverCapable = window.matchMedia("(hover: hover)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(hoverCapable && !reduced);
  }, []);

  const apply = useCallback((x, y) => {
    const el = ref.current;
    if (!el) return;
    // Batched into a rAF: mousemove can fire many times per frame, and writing
    // style.transform on each one forces redundant style recalcs.
    offsetRef.current = { x, y };
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const { x: tx, y: ty } = offsetRef.current;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      }
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Elliptical field matched to the element's own shape: a single circular
      // radius around a wide, short link would either miss its ends or reach
      // absurdly far above and below it.
      const rx = r.width / 2 + RADIUS_PAD;
      const ry = r.height / 2 + RADIUS_PAD;
      const norm = Math.hypot(dx / rx, dy / ry); // 1.0 exactly on the boundary

      if (norm > 1) {
        // Outside the field. Only reset once, rather than every mousemove, or a
        // cursor moving elsewhere on the page keeps re-triggering the
        // transition and the element never settles.
        if (offsetRef.current.x !== 0 || offsetRef.current.y !== 0) apply(0, 0);
        return;
      }

      // Pull scales with proximity: strongest at the centre, easing to nothing
      // at the boundary, so entering the field has no perceptible step.
      const strength = (1 - norm) * MAX_PULL;
      const len = Math.hypot(dx, dy) || 1;
      apply((dx / len) * strength, (dy / len) * strength);
    };

    const onLeaveWindow = () => apply(0, 0);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeaveWindow);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      // Clear the inline transform so an unmount mid-pull can't leave the
      // element parked off-centre.
      if (el) el.style.transform = "";
    };
  }, [enabled, apply]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        // A single always-on transition, which does double duty: while the
        // cursor is in the field each rAF write becomes a new transition target
        // and the element eases toward it (the "trailing" part of the feel
        // rather than snapping pixel-for-pixel with the cursor), and on exit the
        // same curve carries it back to 0,0. 0.25s is short enough that
        // following still feels attached rather than sluggish.
        transition: enabled
          ? "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)"
          : undefined,
        willChange: enabled ? "transform" : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
