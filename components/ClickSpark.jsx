"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

/*
  ClickSpark
  ----------------------------------------------------
  Adapted from React Bits' "Click Spark" (reactbits.dev): a short radial burst of
  lines drawn on a canvas overlay. Upstream fires on any click inside its
  wrapper, which is right for the achievement cards but wrong for the terminal --
  a spark there has to fire on three specific commands, not on every click in the
  command log. So the burst is exposed imperatively as well:

    <ClickSpark sparkOnClick>            spark wherever the wrapper is clicked
    <ClickSpark ref={r} />               r.current.burst(clientX, clientY)

  burst() takes viewport coordinates (the same numbers a mouse event or
  getBoundingClientRect hands you) and converts them itself; called with no
  arguments it bursts from the centre.

  Colour comes from --accent-teal-bright rather than upstream's white: canvas
  needs a resolved colour string, so the token is read once from the document.
  Nothing is drawn under prefers-reduced-motion.
*/
const SPARK_COUNT = 8;
const SPARK_RADIUS = 16; // px travelled from the origin -- deliberately small
const SPARK_SIZE = 8; // px length of each line at t=0, shrinking to 0
const DURATION = 380; // ms; short enough to read as a tick, not a firework
const LINE_WIDTH = 1.5;
const FALLBACK_COLOR = "#5dcaa5"; // = --accent-teal-bright, if the var is unreadable

const ClickSpark = forwardRef(function ClickSpark(
  { children, sparkOnClick = false, style },
  ref
) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const frameRef = useRef(0);
  const colorRef = useRef(FALLBACK_COLOR);
  // Refs, not state: neither value changes the markup, only whether a burst is
  // allowed and what colour it draws in, so there is nothing to re-render for.
  const allowedRef = useRef(true);

  useEffect(() => {
    allowedRef.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-teal-bright")
      .trim();
    if (token) colorRef.current = token;
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let timer;
    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Backing store in device pixels, drawing coordinates in CSS pixels, so a
      // 1.5px line stays a hairline instead of blurring on a HiDPI screen
      // (upstream sizes the canvas 1:1 and blurs).
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(resize, 100);
    });
    ro.observe(wrap);
    resize();

    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const draw = useCallback((now) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      frameRef.current = 0;
      return;
    }
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = LINE_WIDTH;

    sparksRef.current = sparksRef.current.filter((s) => {
      const t = (now - s.startTime) / DURATION;
      if (t >= 1) return false;
      const eased = t * (2 - t); // ease-out
      const dist = eased * SPARK_RADIUS;
      const len = SPARK_SIZE * (1 - eased);
      const cos = Math.cos(s.angle);
      const sin = Math.sin(s.angle);
      ctx.beginPath();
      ctx.moveTo(s.x + dist * cos, s.y + dist * sin);
      ctx.lineTo(s.x + (dist + len) * cos, s.y + (dist + len) * sin);
      ctx.stroke();
      return true;
    });

    // Upstream runs a rAF for the life of the page even with nothing to draw.
    // This one spins only while sparks are alive -- the page already has GSAP
    // and Lenis driving frames, no reason to add a permanently idle third.
    frameRef.current = sparksRef.current.length ? requestAnimationFrame(draw) : 0;
  }, []);

  const burst = useCallback(
    (clientX, clientY) => {
      if (!allowedRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // ponytail: treats the canvas rect as untransformed. Inside SpotlightTilt
      // the tilt inflates that rect, so while a card is tilted the burst can land
      // a few px off the true click point (~2px on an achievement row). Invert
      // the ancestor matrix here if that ever becomes visible.
      const r = canvas.getBoundingClientRect();
      const x = clientX == null ? r.width / 2 : clientX - r.left;
      const y = clientY == null ? r.height / 2 : clientY - r.top;
      const now = performance.now();
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparksRef.current.push({
          x,
          y,
          angle: (2 * Math.PI * i) / SPARK_COUNT,
          startTime: now,
        });
      }
      if (!frameRef.current) frameRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  useImperativeHandle(ref, () => ({ burst }), [burst]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", ...style }}
      onClick={sparkOnClick ? (e) => burst(e.clientX, e.clientY) : undefined}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        // Stable hook for scripts/probe-reactbits.mjs, which reads pixels off
        // this canvas to prove a burst did (or did not) happen.
        data-click-spark=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          // Purely painted output: every click still reaches the card beneath.
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
});

export default ClickSpark;
