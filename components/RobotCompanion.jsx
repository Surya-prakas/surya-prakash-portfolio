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

  // ---- Draw a given frame index to canvas (rAF-throttled by caller) ----
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = imagesRef.current[frameIndex - 1];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const setFrame = useCallback(
    (frameIndexRaw) => {
      const frameIndex = Math.min(
        TOTAL_FRAMES,
        Math.max(1, Math.round(frameIndexRaw))
      );
      if (frameIndex === currentFrameRef.current) return;
      currentFrameRef.current = frameIndex;

      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(() => {
          drawFrame(currentFrameRef.current);
          const pose = getPoseForFrame(currentFrameRef.current);
          setActivePose((prev) => (prev.pose !== pose.pose ? pose : prev));
          rafPendingRef.current = false;
        });
      }
    },
    [drawFrame]
  );

  // ---- Scroll-scrub wiring (GSAP ScrollTrigger, rail range 10%-95%) ----
  useEffect(() => {
    if (!imagesLoaded) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body,
        start: `${RAIL_START * 100}% top`,
        end: `${RAIL_END * 100}% bottom`,
        scrub: true,
        onUpdate: (self) => {
          const frameIndexRaw = 1 + self.progress * (TOTAL_FRAMES - 1);
          setFrame(frameIndexRaw);
        },
      });

      // Draw the first frame immediately so canvas isn't blank pre-scroll
      drawFrame(1);
    });

    return () => ctx.revert(); // canonical GSAP cleanup pattern (per project convention)
  }, [imagesLoaded, drawFrame, setFrame]);

  // ---- Pin to "think" range while a chat request is in flight ----
  useEffect(() => {
    if (!imagesLoaded) return;
    if (isThinking) {
      const thinkRange = poseManifest.poses.think;
      setFrame(thinkRange.range[0]);
    }
  }, [isThinking, imagesLoaded, setFrame]);

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
