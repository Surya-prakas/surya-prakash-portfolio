"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import poseManifest from "@/public/companion/nova-frames/nova-pose-manifest.json";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = poseManifest.totalFrames;
const FRAME_PATH = (n) =>
  `/companion/nova-frames/frame_${String(n).padStart(3, "0")}.png`;

// NOTE: the pose boundaries in nova-pose-manifest.json are a FIRST-PASS ESTIMATE
// derived from downsampled contact sheets — not final. Frame-accurate boundaries
// need a pass over the full-res frames; expect to adjust the ranges (and the
// per-pose messages that ride on them) once that's done.

// Flatten manifest into a sorted array of { pose, start, end, message } for fast lookup
const POSE_RANGES = Object.entries(poseManifest.poses)
  .map(([pose, data]) => ({
    pose,
    start: data.range[0],
    end: data.range[1],
    message: data.message,
  }))
  .sort((a, b) => a.start - b.start);

function getPoseForFrame(frameIndex) {
  for (const range of POSE_RANGES) {
    if (frameIndex >= range.start && frameIndex <= range.end) return range;
  }
  return POSE_RANGES[0];
}

/**
 * RobotCompanion v2
 * Canvas scroll-scrubbed frame sequence replacing the old 4-pose sprite-swap
 * (AnimatePresence + IntersectionObserver). Rail range is 10%-95% of the
 * document scroll — retune RAIL_START/RAIL_END below if it feels
 * off once frames are driving it instead of discrete poses.
 *
 * isThinking (from CompanionLayer's shared state) can be used to pin the
 * playhead into the "think" frame range while a chat request is in flight;
 * see the effect below.
 */
export default function RobotCompanion({ isThinking = false }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]); // preloaded HTMLImageElement[], 1-indexed via [n-1]
  const currentFrameRef = useRef(1);
  const rafPendingRef = useRef(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activePose, setActivePose] = useState(POSE_RANGES[0]);

  const RAIL_START = 0.1; // 10% of viewport scroll
  const RAIL_END = 0.95; // 95% of viewport scroll

  // Smoothed-progress decoupling. Same architecture as CinematicNovaIntro:
  // `targetProgress` is the raw ScrollTrigger progress and may jump between
  // two rAFs on a fast burst; `displayProgress` is what the canvas actually
  // renders, eased toward target by an independent rAF loop.
  //
  // RobotCompanion has no chapter blocks, ghost text, or outro fade, so the
  // only consumer here is `setFrame`. The easing still matters: a single
  // self.progress jump of 0.6 (well within what a fast wheel burst can
  // produce against a 10%-95% body rail) would otherwise skip ~71 of the
  // 120 frames in one tick -- including every pose the bubbles are keyed on.
  // Smoothing guarantees displayProgress sweeps continuously through every
  // intermediate value on its way to wherever the target currently is, so
  // no pose is ever silently bypassed.
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const easingRafRef = useRef(0);
  const SMOOTHING = 0.15; // matches CinematicNovaIntro
  const SETTLE_EPSILON = 0.0005;

  // ---- Preload all frames before wiring up the scroll listener ----
  useEffect(() => {
    let cancelled = false;
    const loaders = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      loaders.push(
        new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // don't block the whole sequence on one bad frame
        })
      );
      imagesRef.current[i - 1] = img;
    }

    Promise.all(loaders).then(() => {
      if (!cancelled) setImagesLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Draw a fractional frame position to canvas (rAF-throttled by caller) ----
  // Blends the two nearest frames instead of snapping to one, so scrubbing
  // reads as continuous motion rather than stepping frame-to-frame.
  //
  // These frames are ~86% transparent (Nova is a sprite, not opaque video), so
  // the usual "lower at 1.0, upper at blend" trick does NOT crossfade: with
  // source-over the lower frame stays fully visible wherever the upper frame is
  // transparent, leaving frame N solid under a faint frame N+1 — double-exposure,
  // not a blend. Instead weight BOTH layers and composite additively, which is
  // an exact lerp in premultiplied space (verified pixel-exact vs a reference
  // lerp; the source-over form was off by up to 0.75 alpha on 2.4% of pixels).
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

  const setFrame = useCallback(
    (frameIndexRaw) => {
      const frameIndex = Math.min(TOTAL_FRAMES, Math.max(1, frameIndexRaw));
      // Fractional now, so exact equality would almost never hit — skip only
      // sub-perceptual moves.
      if (Math.abs(frameIndex - currentFrameRef.current) < 0.05) return;
      currentFrameRef.current = frameIndex;

      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(() => {
          drawFrame(currentFrameRef.current);
          const pose = getPoseForFrame(Math.round(currentFrameRef.current));
          setActivePose((prev) => (prev.pose !== pose.pose ? pose : prev));
          rafPendingRef.current = false;
        });
      }
    },
    [drawFrame]
  );

  // Independent easing loop, decoupled from scroll events. Mirrors
  // CinematicNovaIntro's tickEasing: every rAF, move displayProgress toward
  // targetProgress; settle and cancel the rAF when within epsilon; restart
  // from `startEasingIfStopped` whenever a new onUpdate moves the target.
  const tickEasing = useCallback(() => {
    easingRafRef.current = requestAnimationFrame(tickEasing);
    const target = targetProgressRef.current;
    const display = displayProgressRef.current;
    const delta = target - display;
    if (Math.abs(delta) < SETTLE_EPSILON) {
      if (display !== target) {
        displayProgressRef.current = target;
        setFrame(1 + target * (TOTAL_FRAMES - 1));
      }
      cancelAnimationFrame(easingRafRef.current);
      easingRafRef.current = 0;
      return;
    }
    displayProgressRef.current = display + delta * SMOOTHING;
    setFrame(1 + displayProgressRef.current * (TOTAL_FRAMES - 1));
  }, [setFrame]);

  const startEasingIfStopped = useCallback(() => {
    if (!easingRafRef.current) {
      easingRafRef.current = requestAnimationFrame(tickEasing);
    }
  }, [tickEasing]);

  // ---- Scroll-scrub wiring (GSAP ScrollTrigger, rail range 10%-95%) ----
  useEffect(() => {
    if (!imagesLoaded) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body,
        start: `${RAIL_START * 100}% top`,
        end: `${RAIL_END * 100}% bottom`,
        // `scrub` only smooths an `animation:` tween's playhead. There is no
        // tween here -- onUpdate writes targetProgressRef and the rAF loop
        // eases displayProgressRef toward it. That loop is what guarantees
        // every intermediate frame gets rendered even on a fast fling, no
        // matter how far targetProgress jumps in a single tick.
        scrub: false,
        onUpdate: (self) => {
          targetProgressRef.current = self.progress;
          startEasingIfStopped();
        },
      });

      // Draw the first frame immediately so canvas isn't blank pre-scroll
      drawFrame(1);
    });

    return () => {
      ctx.revert(); // canonical GSAP cleanup pattern (per project convention)
      if (easingRafRef.current) {
        cancelAnimationFrame(easingRafRef.current);
        easingRafRef.current = 0;
      }
    };
  }, [imagesLoaded, drawFrame, setFrame, startEasingIfStopped]);

  // ---- Pin to "think" range while a chat request is in flight ----
  useEffect(() => {
    if (!imagesLoaded) return;
    if (isThinking) {
      const thinkRange = poseManifest.poses.think;
      // Drive targetProgress directly and let the easing loop glide there --
      // identical pattern to a scroll-driven onUpdate, so the visual
      // transition stays continuous rather than snapping.
      targetProgressRef.current =
        (thinkRange.range[0] - 1) / (TOTAL_FRAMES - 1);
      startEasingIfStopped();
    }
  }, [isThinking, imagesLoaded, startEasingIfStopped]);

  return (
    <div className="robot-companion-rail" aria-hidden="true">
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="robot-companion-canvas"
        style={{
          opacity: imagesLoaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      {activePose?.message && (
        <div className="robot-companion-bubble">{activePose.message}</div>
      )}
    </div>
  );
}
