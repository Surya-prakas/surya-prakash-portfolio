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
    heading: "Hi. I'm Nova.",
    body: "",
  },
  {
    pose: "point",
    side: "right",
    heading: "I wasn't always like this.",
    body: "",
  },
  {
    pose: "think",
    side: "left",
    heading: "I started as an anomaly.",
    body: "A data point that didn't fit the pattern, while Surya trained a fraud-detection model to catch exactly that.",
  },
  {
    pose: "wave",
    side: "right",
    heading: "He named me Nova.",
    body: "After the burst of light a star gives off when it wakes up. Surya's name means \u201csun\u201d \u2014 it fit.",
  },
  {
    pose: "excited",
    side: "left",
    heading: "Now I live here.",
    body: "Let's take a look at what he's built.",
  },
];

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
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(1);
  const rafPendingRef = useRef(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activePose, setActivePose] = useState(POSE_RANGES[0].pose);

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

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = imagesRef.current[frameIndex - 1];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const setFrame = useCallback((raw) => {
    const frameIndex = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(raw)));
    if (frameIndex === currentFrameRef.current) return;
    currentFrameRef.current = frameIndex;
    if (!rafPendingRef.current) {
      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        drawFrame(currentFrameRef.current);
        const pose = getPoseForFrame(currentFrameRef.current);
        setActivePose((prev) => (prev !== pose ? pose : prev));
        rafPendingRef.current = false;
      });
    }
  }, [drawFrame]);

  useEffect(() => {
    if (!imagesLoaded) return;
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "+=3500",
        pin: true,
        scrub: 0.5,
        onEnter: () => document.body.classList.add("nova-cinematic-active"),
        onLeave: () => document.body.classList.remove("nova-cinematic-active"),
        onEnterBack: () => document.body.classList.add("nova-cinematic-active"),
        onLeaveBack: () => document.body.classList.remove("nova-cinematic-active"),
        onUpdate: (self) => {
          setFrame(1 + self.progress * (TOTAL_FRAMES - 1));
        },
      });
      drawFrame(1);
    }, container);

    return () => {
      ctx.revert();
      document.body.classList.remove("nova-cinematic-active");
    };
  }, [imagesLoaded, drawFrame, setFrame]);

  const chapter = CHAPTERS.find((c) => c.pose === activePose) || CHAPTERS[0];

  return (
    <div ref={containerRef} style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          style={{
            width: "min(70vw, 720px)",
            height: "auto",
            opacity: imagesLoaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      </div>

      {CHAPTERS.map((c) => (
        <div
          key={c.pose}
          style={{
            position: "absolute",
            top: "50%",
            [c.side]: "6%",
            transform: "translateY(-50%)",
            maxWidth: 320,
            opacity: chapter.pose === c.pose ? 1 : 0,
            transition: "opacity 0.5s ease",
            pointerEvents: "none",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              margin: "0 0 10px",
              fontFamily: "var(--font-sans)",
              color: "var(--text-primary)",
            }}
          >
            {c.heading}
          </h2>
          {c.body && (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              {c.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
