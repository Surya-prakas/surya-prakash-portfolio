"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import poseManifest from "@/public/companion/nova-frames/nova-pose-manifest.json";

gsap.registerPlugin(ScrollTrigger);

/*
  CinematicNovaIntro
  ----------------------------------------------------
  A big, centered, pinned version of Nova's frame sequence -- same 120
  frames RobotCompanion uses as a small rail, but shown large with
  narrative text chapters crossfading left/right as the pin scrolls.
  Tells Nova's actual origin story (the anomaly/star backstory), which
  until now only existed in the chat and click-to-reveal easter egg.

  Sits between the hero terminal and the rest of the page. Adds/removes a
  class on <body> while pinned so the small RobotCompanion rail hides
  itself during this section (see .nova-cinematic-active rule in
  globals.css) rather than showing two Novas on screen at once.
*/

const TOTAL_FRAMES = poseManifest.totalFrames;
const FRAME_PATH = (n) =>
  `/companion/nova-frames/frame_${String(n).padStart(3, "0")}.png`;

const CHAPTERS = [
  {
    pose: "idle",
    side: "left",
    number: "01",
    eyebrow: "Arrival",
    heading: "Hi, I'm Nova.",
    accent: "Nova",
    body: "",
  },
  {
    pose: "point",
    side: "right",
    number: "02",
    eyebrow: "Instinct",
    heading: "I notice things most people miss.",
    accent: "notice",
    body: "",
  },
  {
    pose: "think",
    side: "left",
    number: "03",
    eyebrow: "Origin",
    heading: "I started as an anomaly.",
    accent: "anomaly",
    body: "A data point that didn't fit the pattern, while Surya trained a fraud-detection model to catch exactly that. He named me Nova \u2014 after the burst of light a star gives off when it wakes up. His name means \u201csun.\u201d It fit.",
  },
  {
    pose: "wave",
    side: "right",
    number: "04",
    eyebrow: "Greeting",
    heading: "Nice to meet you.",
    accent: "you",
    body: "Whoever's reading this \u2014 thanks for stopping by.",
  },
  {
    pose: "excited",
    side: "left",
    number: "05",
    eyebrow: "Forward",
    heading: "Let's see what he's built.",
    accent: "built",
    body: "Scroll on \u2014 there's real work below.",
  },
];

// Splits a heading into word tokens so each word can animate in on its own
// stagger (.nova-word), and tags the token carrying the accent word so the
// teal + shimmer treatment survives the split. The accent is usually a
// sub-slice of its token ("Nova" inside "Nova."), so the token is cut into
// pre/accent/post rather than coloured whole -- trailing punctuation stays
// in the heading colour, same as before the split.
const WORD_STAGGER = 0.07; // s between words
const WORD_LEAD = 0.1; // s the numeral/eyebrow get before the first word
const WORD_DURATION = 0.55; // s, must match .nova-word's animation-duration
const SHIMMER_LEAD = 0.8; // s after its word starts before the glint sweeps

// Ghost word behind the canvas. The opacity is deliberately below the point
// where the word is readable at a glance -- it's meant to register as texture
// in the backdrop, not as a second headline competing with the chapter text.
// Slower than the foreground crossfade so the backdrop drifts between chapters
// rather than snapping with them.
const GHOST_OPACITY = 0.05;
const GHOST_FADE = 0.9; // s
// Progress marks: fixed slot width with the inactive bar scaled down inside it,
// so the active mark reads longer without the row reflowing.
const MARK_WIDTH = 22; // px
const MARK_FADE = 0.35; // s

// Below 1280px the side-by-side layout stops fitting and the text lands on the
// robot. It isn't a matter of trimming a few px: with a 6% inset, a 372px column
// and a centred min(70vw, 720px) canvas, the clearance for a left-side chapter
// works out to 0.44W - 545, which crosses zero at ~1239px. So narrow viewports
// get a stacked layout instead, where the canvas and the text occupy separate
// horizontal bands and cannot overlap however the copy changes.
//
// The switch lives entirely in globals.css (.nova-* classes and the
// max-width: 1279px block), not here. A JS breakpoint was tried first and
// regressed CLS to 1.0 at 390px: reading matchMedia can only happen after mount,
// so the first paint used the wide layout and the stacked one shifted in a frame
// later. Media queries apply on the first paint, which measured 0.00007.
// Outro. The pin used to hold frame 120 at full opacity until the range ended
// and then simply release, which reads as the section being cut off rather than
// concluding. These drive a scroll-linked fade of the whole stage over the pin's
// last stretch instead.
//
// The window is bounded below by when the final chapter actually arrives: the
// `excited` pose starts at frame 91, i.e. progress (91-1)/119 = 0.756, so the
// last message owns the closing ~24% of the pin. Starting the fade at 0.90
// leaves it ~0.144 x 3500 = ~500px of full-opacity scroll -- roughly two seconds
// at a reading pace -- which is enough for the word-stagger (~0.9s) and the body
// line (~1.4s to settle) to finish before anything dims. Ending at 0.98 rather
// than 1.0 leaves a small buffer so the stage has reliably reached zero by the
// time the pin releases, even with the 0.5s scrub lagging behind the wheel.
const OUTRO_START = 0.9;
const OUTRO_END = 0.98;
const OUTRO_RISE = 28; // px the stage drifts upward across the fade
const OUTRO_SCALE = 0.04; // how far it pulls back (1 -> 0.96)

// Scroll cue. The pin swallows 3500px, so a first-time visitor mid-sequence has
// no evidence that scrolling still does anything. The cue holds through the
// early and middle chapters and is gone before the outro starts, so it never
// competes with the closing beat.
const CUE_OPACITY = 0.45;
const CUE_HOLD_UNTIL = 0.72;
const CUE_GONE = 0.88;


// Layer order. Two planes in the container's own stacking context: the gradient
// bridge sits under the stage, so it can never dim the progress marks. The stage
// carries a transform, which makes it a stacking context, so the three planes
// inside it (ghost / canvas / text) stack locally against each other.
const Z_BRIDGE = 0;
const Z_STAGE = 1;
const Z_GHOST = 0;
const Z_CANVAS = 1;
const Z_TEXT = 2;

// Maps pin progress onto a 0..1 ramp between two thresholds, smoothstepped so
// the fade eases in and out instead of starting and stopping linearly.
function ramp(progress, from, to) {
  const t = Math.min(1, Math.max(0, (progress - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

// Whether the user has requested reduced motion. Checked once per callback
// rather than cached in state, so window resizes or setting changes take effect.
function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function splitHeadingWords(heading, accent) {
  const words = heading.split(" ");
  const accentIndex = accent ? words.findIndex((w) => w.includes(accent)) : -1;
  return words.map((word, i) => {
    if (i !== accentIndex) return { word };
    const at = word.indexOf(accent);
    return {
      word,
      pre: word.slice(0, at),
      accent,
      post: word.slice(at + accent.length),
    };
  });
}

const POSE_RANGES = Object.entries(poseManifest.poses)
  .map(([pose, data]) => ({ pose, start: data.range[0], end: data.range[1] }))
  .sort((a, b) => a.start - b.start);

function getPoseForFrame(frameIndex) {
  for (const range of POSE_RANGES) {
    if (frameIndex >= range.start && frameIndex <= range.end) return range.pose;
  }
  return POSE_RANGES[0].pose;
}

export default function CinematicNovaIntro() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const cueRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(1);
  const rafPendingRef = useRef(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  // Smoothed progress, decoupled from raw ScrollTrigger input.
  //
  // `targetProgress` is the raw value from ScrollTrigger.onUpdate and may
  // jump on any given tick when the wheel delivers a fast burst (Lenis
  // smooths the scroll position but a single onUpdate can still see a
  // several-hundred-pixel delta between two rAFs). Driving setFrame /
  // applyOutro / chapter selection directly off self.progress meant a fast
  // burst could land on chapter 05 having never shown 02/03/04 -- the
  // in-between frames were simply never computed.
  //
  // `displayProgress` is what everything actually renders from. A separate
  // rAF loop eases it toward targetProgress every frame. If targetProgress
  // jumps from 0.0 to 0.8 in one onUpdate, displayProgress still walks
  // through 0.0 -> 0.1 -> 0.2 -> ... -> 0.8 over the next ~25 rAFs at
  // SMOOTHING=0.15, so every intermediate frame and chapter gets rendered.
  // The user perceives this as a fast catch-up at the tail of a fling,
  // not as instantaneous jumps.
  //
  // `direction` rides along with targetProgress because the outro fade
  // needs the SCROLL direction, not the eased direction (the eased direction
  // would lag and the fade could flicker as it catches up).
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const directionRef = useRef(1);
  const easingRafRef = useRef(0);
  const SMOOTHING = 0.15;
  const SETTLE_EPSILON = 0.0005;
  // `visit` counts pose changes, not just the current pose. The chapter blocks
  // stay mounted and crossfade via opacity, so a CSS-driven word reveal would
  // only ever play once; keying the active block on the visit count remounts it
  // each time its chapter comes back around and restarts the stagger. Matters
  // on reverse scroll, where every chapter is a repeat view.
  const [poseState, setPoseState] = useState({
    pose: POSE_RANGES[0].pose,
    visit: 0,
  });
  const activePose = poseState.pose;

  useEffect(() => {
    let cancelled = false;
    const loaders = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      loaders.push(new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      }));
      imagesRef.current[i - 1] = img;
    }
    Promise.all(loaders).then(() => { if (!cancelled) setImagesLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Blends the two nearest frames instead of snapping to one, so scrubbing
  // reads as continuous motion rather than stepping frame-to-frame.
  // Weighted + additive rather than "lower at 1.0, upper at blend": the frames
  // are ~86% transparent, so source-over would leave frame N fully visible under
  // a faint N+1 (double exposure) instead of crossfading. Keep in sync with the
  // same function in RobotCompanion.jsx, which has the full rationale.
  const drawFrame = useCallback((frameIndexFractional) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const lowerIndex = Math.floor(frameIndexFractional);
    const upperIndex = Math.min(lowerIndex + 1, TOTAL_FRAMES);
    const blend = frameIndexFractional - lowerIndex; // 0..1

    const imgLower = imagesRef.current[lowerIndex - 1];
    const imgUpper = imagesRef.current[upperIndex - 1];
    if (!imgLower || !imgLower.complete || imgLower.naturalWidth === 0) return;

    const hasUpper =
      blend > 0.01 && imgUpper && imgUpper.complete && imgUpper.naturalWidth > 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = hasUpper ? 1 - blend : 1;
    ctx.drawImage(imgLower, 0, 0, canvas.width, canvas.height);

    if (hasUpper) {
      ctx.globalCompositeOperation = "lighter"; // additive: weights sum to 1, no clipping
      ctx.globalAlpha = blend;
      ctx.drawImage(imgUpper, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
  }, []);

  // Applied straight to the nodes rather than through state: this runs on every
  // scroll tick, and a setState here would re-render all five chapter blocks per
  // frame -- which would also remount the active one and restart its word
  // stagger, since that remount is keyed on the visit counter.
  //
  // `direction` is the ScrollTrigger self.direction (-1 = scrolling back through
  // the range, +1 = forward). The stage fade is gated on forward only: when the
  // user is scrolling up into the pin from past pinEnd, the first onUpdate sees
  // progress=1.0 and would otherwise simultaneously activate chapter 05 and dim
  // the whole stage to 0 -- leaving chapter 05 rendered on an invisible stage,
  // then advancing to 04 by the time the stage fades back in. Suppressing the
  // fade on reverse keeps every chapter visible at any scroll speed and in
  // either direction; the forward outro (the one the fade exists to deliver)
  // still plays normally.
  const applyOutro = useCallback((progress, direction) => {
    const stage = stageRef.current;
    if (stage) {
      const forward = (direction ?? 1) >= 0;
      const t = forward ? ramp(progress, OUTRO_START, OUTRO_END) : 0;
      stage.style.opacity = String(1 - t);
      // The drift/scale is scroll-linked rather than a CSS animation, so the
      // global prefers-reduced-motion rule (which only collapses animation and
      // transition durations) can't reach it. Drop the movement for those users
      // and keep the fade, which still concludes the section without motion.
      stage.style.transform = forward
        ? prefersReducedMotion()
          ? "none"
          : `translateY(${-OUTRO_RISE * t}px) scale(${1 - OUTRO_SCALE * t})`
        : "none";
    }
    const cue = cueRef.current;
    if (cue) {
      // The cue is just a scroll hint, not a chapter gate, so its fade runs in
      // both directions. A user who scrolls back up through the cue's window
      // gets a brief reappearance -- harmless and matches what scrubbed
      // progress would imply.
      cue.style.opacity = String(
        CUE_OPACITY * (1 - ramp(progress, CUE_HOLD_UNTIL, CUE_GONE))
      );
    }
  }, []);

  const setFrame = useCallback((raw) => {
    const frameIndex = Math.min(TOTAL_FRAMES, Math.max(1, raw));
    // Fractional now, so exact equality would almost never hit — skip only
    // sub-perceptual moves.
    if (Math.abs(frameIndex - currentFrameRef.current) < 0.05) return;
    currentFrameRef.current = frameIndex;
    if (!rafPendingRef.current) {
      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        drawFrame(currentFrameRef.current);
        const pose = getPoseForFrame(Math.round(currentFrameRef.current));
        if (window.__novaDebug2) window.__novaDebug2.push({ t: Math.round(performance.now()), frame: +currentFrameRef.current.toFixed(2), pose });
        setPoseState((prev) =>
          prev.pose !== pose ? { pose, visit: prev.visit + 1 } : prev
        );
        rafPendingRef.current = false;
      });
    }
  }, [drawFrame]);

  // The independent easing loop: every rAF, move displayProgress toward
  // targetProgress. Stops when close enough that further ticking would be a
  // no-op, and is restarted by onUpdate when the target moves again.
  //
  // Critically, this loop is NOT tied to scroll events firing. If the user
  // stops scrolling mid-fling (e.g. lifts their finger off the trackpad),
  // displayProgress keeps easing toward the final targetProgress instead of
  // freezing at the last sampled value. That's what makes the catch-up feel
  // like a smooth glide rather than a hitch.
  const tickEasing = useCallback(() => {
    // Keep the ref populated for the entire duration of this tick so a
    // concurrent onUpdate (which can fire from the GSAP ticker at any
    // moment) can't observe a "0" ref and schedule a duplicate rAF. Without
    // this, two easing loops would race and effectively double the
    // smoothing rate, which looks like a slower-than-expected catch-up.
    easingRafRef.current = requestAnimationFrame(tickEasing);
    const target = targetProgressRef.current;
    const display = displayProgressRef.current;
    const delta = target - display;
    if (Math.abs(delta) < SETTLE_EPSILON) {
      // Snap exactly to target so the final chapter settles to the right
      // boundary rather than asymptoting forever.
      if (display !== target) {
        displayProgressRef.current = target;
        setFrame(1 + target * (TOTAL_FRAMES - 1));
        applyOutro(target, directionRef.current);
      }
      cancelAnimationFrame(easingRafRef.current);
      easingRafRef.current = 0;
      return;
    }
    displayProgressRef.current = display + delta * SMOOTHING;
    setFrame(1 + displayProgressRef.current * (TOTAL_FRAMES - 1));
    applyOutro(displayProgressRef.current, directionRef.current);
  }, [setFrame, applyOutro]);

  const startEasingIfStopped = useCallback(() => {
    if (!easingRafRef.current) {
      easingRafRef.current = requestAnimationFrame(tickEasing);
    }
  }, [tickEasing]);

  useEffect(() => {
    if (!imagesLoaded) return;
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "+=4500",
        pin: true,
        // `scrub` only smooths the playhead of an `animation:` tween. There
        // is none here -- onUpdate writes targetProgressRef, and a separate
        // rAF loop eases displayProgressRef toward it. That loop is what
        // guarantees every intermediate frame gets rendered even on a fast
        // fling, no matter how far targetProgress jumps in a single tick.
        scrub: false,
        onEnter: () => document.body.classList.add("nova-cinematic-active"),
        onLeave: () => document.body.classList.remove("nova-cinematic-active"),
        onEnterBack: () => document.body.classList.add("nova-cinematic-active"),
        onLeaveBack: () => document.body.classList.remove("nova-cinematic-active"),
        onUpdate: (self) => {
          // Raw progress jumps are fine -- the easing loop will sweep through
          // every intermediate value on its own rAF.
          targetProgressRef.current = self.progress;
          directionRef.current = self.direction;
          if (window.__novaOnUpdate) window.__novaOnUpdate.push({ t: Math.round(performance.now()), progress: +self.progress.toFixed(4), direction: self.direction });
          startEasingIfStopped();
        },
      });
      drawFrame(1);
      // Seed the outro state so a load or resize part-way into the pin doesn't
      // start from a stale full-opacity stage. Forward default: a mid-pin load
      // shows the section as it would appear while scrolling into the outro,
      // which matches the next frame the user will see.
      applyOutro(0, 1);
    }, container);

    return () => {
      ctx.revert();
      if (easingRafRef.current) {
        cancelAnimationFrame(easingRafRef.current);
        easingRafRef.current = 0;
      }
      document.body.classList.remove("nova-cinematic-active");
    };
  }, [imagesLoaded, drawFrame, setFrame, applyOutro, startEasingIfStopped]);

  const chapter = CHAPTERS.find((c) => c.pose === activePose) || CHAPTERS[0];

  return (
    <div ref={containerRef} style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Gradient bridge along the bottom edge, transparent -> the following
          section's background. Measured rather than assumed: the next section
          (<section className="section"> holding NovaStatus) declares no
          background of its own, so its effective colour resolves to
          rgb(10, 11, 10) inherited from <body> -- which is var(--bg), the same
          value this section sits on. The two backgrounds therefore already
          match, so today this gradient is a visual no-op rather than the fix for
          a visible colour edge. It's kept because it stays correct if either
          section ever takes its own surface colour, and it softens the bottom of
          the frame if content later extends into it. Sits under the stage so it
          can never dim the progress marks. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          zIndex: Z_BRIDGE,
          background: "linear-gradient(to bottom, transparent, var(--bg))",
          pointerEvents: "none",
        }}
      />

      {/* Everything that participates in the outro. Grouped so the fade is a
          single opacity/transform pair on one node rather than a per-element
          animation, and so the gradient bridge stays put while the stage drifts
          up and away. */}
      <div
        ref={stageRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: Z_STAGE,
          willChange: "opacity, transform",
        }}
      >
      {/* Backmost plane: one oversized word per chapter, derived from the
          chapter's own `eyebrow` so there's no parallel word list to drift out
          of sync with the copy. Sized in vw and allowed to bleed past the
          container edges -- the section already clips with overflow: hidden, so
          the bleed costs no scrollbar and no layout shift. Tracks the canvas
          band in both layouts: in the stacked layout it stays behind the robot
          rather than drifting down behind the copy, where even 5% opacity would
          sit directly under body text instead of in empty backdrop. */}
      <div
        aria-hidden="true"
        className="nova-ghost-layer"
        style={{
          zIndex: Z_GHOST,
          overflow: "hidden",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {CHAPTERS.map((c) => (
          <span
            key={c.pose}
            className="nova-ghost-word"
            style={{
              position: "absolute",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--text-primary)",
              opacity: chapter.pose === c.pose ? GHOST_OPACITY : 0,
              transition: `opacity ${GHOST_FADE}s ease`,
            }}
          >
            {c.eyebrow.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Canvas band. Wide: centred in the whole section, with the text columns
          flanking it. Narrow: confined to a top band, so the text below can
          never reach it -- the separation is structural, not a tuned margin. */}
      <div className="nova-canvas-band" style={{ zIndex: Z_CANVAS }}>
        <canvas
          ref={canvasRef}
          className="nova-canvas"
          width={960}
          height={540}
          style={{
            height: "auto",
            maxHeight: "100%",
            objectFit: "contain",
            opacity: imagesLoaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      </div>

      {CHAPTERS.map((c) => {
        const isActive = chapter.pose === c.pose;
        const words = splitHeadingWords(c.heading, c.accent);
        // The rule and body wait out the whole stagger so the block resolves
        // top-to-bottom instead of the rule racing the last word in.
        const lastWordStart = WORD_LEAD + (words.length - 1) * WORD_STAGGER;
        const ruleDelay = lastWordStart + WORD_DURATION * 0.4;
        return (
          <div
            key={c.pose}
            className={`nova-chapter nova-chapter--${c.side}`}
            style={{
              zIndex: Z_TEXT,
              opacity: isActive ? 1 : 0,
              // Active fade is 0s: at slow scroll a 0.18s ease is barely
              // perceptible anyway, and at fast scroll (10k+ px/s, each
              // chapter slot is < 100ms) any non-zero fade-in means the
              // chapter never reaches full opacity before the next one
              // remounts, so the user only ever sees chapter 01 and 05
              // during a fling. Snapping to opacity 1 immediately keeps
              // every chapter visible at any scroll speed; the word
              // stagger still plays underneath it (that's a CSS
              // animation, not this transition).
              transition: isActive
                ? "opacity 0s"
                : "opacity 0.6s ease",
              pointerEvents: "none",
            }}
          >
            {/* Remounting on `visit` is what restarts the CSS reveal; inactive
                blocks keep a stable key so they just sit in their end state. */}
            <div
              key={isActive ? `on-${poseState.visit}` : "off"}
              className="nova-chapter-row"
            >
              <span
                aria-hidden="true"
                className={`nova-num${isActive ? " nova-numeral" : ""}`}
                style={{
                  flex: "0 0 auto",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 200,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--text-muted)",
                  opacity: 0.55,
                }}
              >
                {c.number}
              </span>
              <div className="nova-chapter-col">
                <p
                  className={isActive ? "nova-eyebrow" : undefined}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--accent-teal-bright)",
                    margin: "0 0 12px",
                  }}
                >
                  {c.eyebrow}
                </p>
                <h2
                  className="nova-heading-text"
                  style={{
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.15,
                    margin: "0 0 6px",
                    fontFamily: "var(--font-sans)",
                    color: "var(--text-primary)",
                  }}
                >
                  {words.map((w, i) => (
                    <span key={i}>
                      <span
                        className={isActive ? "nova-word" : undefined}
                        style={
                          isActive
                            ? {
                                animationDelay: `${
                                  WORD_LEAD + i * WORD_STAGGER
                                }s`,
                              }
                            : undefined
                        }
                      >
                        {w.accent ? (
                          <>
                            {w.pre}
                            <span
                              className={
                                isActive ? "nova-accent-shimmer" : undefined
                              }
                              style={{
                                color: "var(--accent-teal-bright)",
                                ...(isActive
                                  ? {
                                      animationDelay: `${
                                        WORD_LEAD +
                                        i * WORD_STAGGER +
                                        SHIMMER_LEAD
                                      }s`,
                                    }
                                  : null),
                              }}
                            >
                              {w.accent}
                            </span>
                            {w.post}
                          </>
                        ) : (
                          w.word
                        )}
                      </span>
                      {i < words.length - 1 ? " " : null}
                    </span>
                  ))}
                </h2>
                <div
                  className={isActive ? "nova-rule" : undefined}
                  style={{
                    height: 2,
                    width: isActive ? 36 : 0,
                    background: "var(--accent-teal-bright)",
                    borderRadius: 2,
                    margin: "14px 0",
                    // Animated, not transitioned: the block remounts on every
                    // revisit, so a width transition would have no previous
                    // value to move from and the rule would appear already
                    // drawn instead of drawing itself.
                    ...(isActive ? { animationDelay: `${ruleDelay}s` } : null),
                  }}
                />
                {c.body && (
                  <p
                    className={isActive ? "nova-body" : undefined}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                      margin: 0,
                      ...(isActive
                        ? { animationDelay: `${ruleDelay + 0.15}s` }
                        : null),
                    }}
                  >
                    {c.body}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Chapter progress. Horizontal along the bottom edge, which works for
          both layouts: in the wide one the side blocks are vertically centred
          and a bottom strip clears them, and in the stacked one .nova-chapter
          reserves a bottom inset above this row for exactly that reason.
          (A vertical rail on either flank would collide with the side columns in
          the wide layout, and with the full-width band in the narrow one.)
          Absolute rather than fixed: the section is pinned while it's on screen,
          so absolute already reads as fixed here, whereas position: fixed would
          keep the marks on screen for the whole page. aria-hidden because it's a
          visual echo of the chapter text, which is already in the a11y tree. */}
      <div
        aria-hidden="true"
        className="nova-marks"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: Z_TEXT,
          display: "flex",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {CHAPTERS.map((c) => {
          const isActive = chapter.pose === c.pose;
          return (
            // Fixed-width slot with the bar scaled inside it, so switching
            // chapters can't reflow the row (a width change would).
            <span
              key={c.pose}
              style={{
                display: "block",
                width: MARK_WIDTH,
                height: 2,
                borderRadius: 2,
                background: isActive
                  ? "var(--accent-teal-bright)"
                  : "var(--text-muted)",
                opacity: isActive ? 1 : 0.4,
                transform: `scaleX(${isActive ? 1 : 0.45})`,
                transition: `transform ${MARK_FADE}s ease, background ${MARK_FADE}s ease, opacity ${MARK_FADE}s ease`,
              }}
            />
          );
        })}
      </div>

      {/* Scroll cue. The pin absorbs 3500px of wheel without the page appearing
          to move, so mid-sequence there's nothing on screen distinguishing "keep
          going" from "this is stuck". Held through the early and middle chapters
          and faded out before OUTRO_START, so it's gone by the time the closing
          beat plays and never competes with it. Opacity is written by
          applyOutro; the value here is only the pre-hydration starting state. */}
      <div
        ref={cueRef}
        aria-hidden="true"
        className="nova-cue"
        style={{ opacity: CUE_OPACITY }}
      >
        <span className="nova-cue-label">Scroll</span>
        <svg
          className="nova-cue-chevron"
          width="14"
          height="8"
          viewBox="0 0 14 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l6 6 6-6" />
        </svg>
      </div>
      </div>
    </div>
  );
}
