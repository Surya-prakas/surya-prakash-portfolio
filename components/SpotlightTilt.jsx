"use client";

import { useEffect, useRef, useState } from "react";

/*
  SpotlightTilt
  ----------------------------------------------------
  Two React Bits effects (reactbits.dev) merged into one wrapper because they
  read the same cursor position: "Spotlight Card" (a glow that follows the
  cursor) and the tilt from "Tilted Card". Upstream ships them as separate
  TS/Tailwind components, and Tilted Card pulls in framer-motion springs -- not
  worth a dependency for a 4deg rotation, so the transform is written directly
  in a rAF here, the same way MagneticLink does it.

  Scoped to project cards and achievement cards. NovaStatus, the experience card
  and every other .card are untouched: the glow is painted by
  `.card-fx .card::before` in globals.css, which only matches inside this
  wrapper.

  The cursor position is published as --mouse-x/--mouse-y on the wrapper rather
  than on the card itself. CSS variables inherit, so the card's ::before reads
  them through however many wrappers sit in between (the featured project card
  has StarBorder and ClickSpark between the two).

  Transform lives on the wrapper, not the card, so the featured card's star
  border tilts with the card instead of the card tilting inside a stationary
  ring. That means .card:hover's own translateY(-4px) would stack on top of
  this one for a doubled 8px lift, so globals.css suppresses it while this
  wrapper is active and the lift is folded into the transform below. The
  border-colour and box-shadow halves of .card:hover still apply as before.

  Disabled entirely for (hover: none) pointers -- a tilt tied to a cursor that
  does not exist makes no sense -- and for prefers-reduced-motion. In both cases
  the wrapper renders as a plain div and .card:hover behaves exactly as it did
  before this component existed.
*/
const MAX_TILT = 3.5; // deg at the card's edge; past ~5 tall cards visibly skew
const LIFT = 4; // px -- mirrors .card:hover's translateY(-4px)
const PERSPECTIVE = 1400; // px; large, because project cards are ~700px tall

export default function SpotlightTilt({ children, style }) {
  const ref = useRef(null);
  // Gate on state, not an early return during render, so server and client
  // markup match and hydration is stable -- matchMedia is post-mount only.
  const [enabled, setEnabled] = useState(false);
  const frameRef = useRef(0);
  const pendingRef = useRef(null);

  useEffect(() => {
    const hoverCapable = window.matchMedia("(hover: hover)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(hoverCapable && !reduced);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    // Batched: mousemove can fire several times per frame, and each style write
    // would force its own recalc.
    const flush = () => {
      frameRef.current = 0;
      const p = pendingRef.current;
      if (!p || !ref.current) return;
      ref.current.style.setProperty("--mouse-x", `${p.x.toFixed(1)}px`);
      ref.current.style.setProperty("--mouse-y", `${p.y.toFixed(1)}px`);
      ref.current.style.transform =
        `perspective(${PERSPECTIVE}px) rotateX(${p.rx.toFixed(2)}deg) ` +
        `rotateY(${p.ry.toFixed(2)}deg) translateY(-${LIFT}px)`;
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // -1 at the left/top edge, +1 at the right/bottom. rotateX is negated:
      // the cursor near the top should tip that edge away from the viewer.
      const nx = (x / r.width) * 2 - 1;
      const ny = (y / r.height) * 2 - 1;
      pendingRef.current = { x, y, rx: -ny * MAX_TILT, ry: nx * MAX_TILT };
      if (!frameRef.current) frameRef.current = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      pendingRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      // Back to the CSS transition's resting state. The glow fades on its own
      // (opacity is tied to :hover), so --mouse-x/y can stay where they are.
      el.style.transform = "";
    };

    // Element-level rather than window-level: unlike MagneticLink there is no
    // approach phase to catch, the effect starts exactly at the card's edge.
    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      // An unmount mid-hover must not leave the card parked at an angle.
      el.style.transform = "";
    };
  }, [enabled]);

  return (
    <div
      ref={ref}
      className="card-fx"
      // Read by globals.css to switch the effects on, so the CSS half can never
      // fire on a touch device or under reduced motion even though the rules are
      // always in the stylesheet.
      data-fx={enabled ? "on" : "off"}
      style={style}
    >
      {children}
    </div>
  );
}
