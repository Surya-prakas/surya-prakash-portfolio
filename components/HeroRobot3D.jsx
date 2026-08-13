"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Spline is loaded lazily (and client-only) rather than statically imported:
// the bundle is the dominant contributor to this route's First Load JS, and
// the scene is only needed near the top of the page. ssr: false because the
// Spline runtime touches browser-only APIs.
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

/*
  HeroRobot3D
  ----------------------------------------------------
  Renders the 3D Nova character (built in Spline) near the top of the page.
  Shows/hides based on scroll position: visible near the top (including
  when scrolling back up to it), hidden once scrolled past ~100px, at
  which point the 2D RobotCompanion takes over (see RobotHandoffContext).

  Setup required before this works:
  1. npm install @splinetool/react-spline
  2. In your Spline scene, give the wave/greeting animation a "Start"
     trigger (Events panel) so it autoplays whenever the scene mounts —
     this is more reliable than triggering it from JS, since a JS-side
     emitEvent call against an event name that doesn't exist in the scene
     throws a "Missing property" runtime error.
  3. Export/publish the scene, copy its scene URL
     (looks like: https://prod.spline.design/XXXXXXXXXXXX/scene.splinecode)
  4. Replace SCENE_URL below with your actual value if it changes.
  5. Optional: if you set up a real custom event in Spline for replaying
     the wave (e.g. on scroll-back-to-top), set WAVE_EVENT_NAME to that
     exact event name and playWave() will fire it via emitEvent. Leave it
     as null to rely solely on the "Start" trigger (wave will only play
     once, on first load, not on scroll-back-to-top).
*/

import { useRobotHandoff } from "./RobotHandoffContext";

const SCENE_URL = "https://prod.spline.design/vd4ALBvP1mEZssxw/scene.splinecode";

// NOTE: the wave animation is best set up to autoplay in Spline itself
// (give the wave animation a "Start" trigger in the Events panel, which
// fires automatically on scene load) rather than relying on this
// emitEvent call. If your scene doesn't have a "wave-trigger" event
// defined, leave WAVE_EVENT_NAME as null — the code below will skip the
// emitEvent call entirely rather than throwing a "Missing property" error
// against a name Spline doesn't recognize.
const WAVE_EVENT_NAME = null; // set to a real event name only if you added one in Spline

export default function HeroRobot3D() {
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const splineRef = useRef(null);
  const { setShow2DRobot } = useRobotHandoff();

  function playWave() {
    if (!WAVE_EVENT_NAME || !splineRef.current) return;
    try {
      splineRef.current.emitEvent("mouseDown", WAVE_EVENT_NAME);
    } catch (err) {
      console.warn(
        "Could not trigger wave animation — WAVE_EVENT_NAME doesn't match any event in the Spline scene. Set the wave animation to autoplay on 'Start' in Spline instead, or fix the event name.",
        err
      );
    }
  }

  function handleLoad(splineApp) {
    splineRef.current = splineApp;
    setLoaded(true);
    playWave();
  }

  // Two-way handoff: show the 3D robot near the top of the page, hand off
  // to the 2D RobotCompanion once scrolled down, and switch back if the
  // visitor scrolls back to the top.
  //
  // Uses a ref to track the previous near-top state rather than nesting
  // setShow2DRobot (a different component's setter, via context) inside
  // setVisible's updater function — doing that triggered a React
  // "setState during render of a different component" warning, since
  // updater functions are expected to be pure and side-effect-free.
  //
  // Note: this does NOT replay the wave animation on scroll-back-to-top.
  // A "Start"-triggered Spline animation only fires once, on the scene's
  // initial mount — toggling this component's visibility via opacity
  // doesn't remount the Spline scene, so "Start" won't fire again. To
  // support replaying the wave on scroll-back-to-top, set up a real named
  // event in Spline's Events panel, set WAVE_EVENT_NAME to match it below,
  // and call playWave() again in the nearTop branch below.
  const wasNearTopRef = useRef(true);

  useEffect(() => {
    function onScroll() {
      const nearTop = window.scrollY <= 100;
      if (nearTop !== wasNearTopRef.current) {
        wasNearTopRef.current = nearTop;
        setVisible(nearTop);
        setShow2DRobot(!nearTop);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [setShow2DRobot]);

  return (
    <div
      style={{
        width: "100%",
        height: 360,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        pointerEvents: visible ? "auto" : "none",
        position: "relative",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          Loading Nova…
        </div>
      )}
      <Spline scene={SCENE_URL} onLoad={handleLoad} />

      {/* Covers Spline's "Built with Spline" attribution, which the runtime
          paints into the WebGL canvas rather than emitting as a DOM node (see
          .hero-spline-badge-cover in globals.css for the measurements and why
          `display: none` is not an option).

          Deliberately a child of THIS div rather than of .hero-robot-layer in
          page.js: this is the element the canvas exactly fills, and it carries
          the scroll-handoff opacity/scale transition above. Sitting inside it
          means the cover fades and scales in lockstep with the canvas, so it
          cannot drift off the badge mid-transition or linger after the robot
          has handed off to RobotCompanion.

          NOTE (tradeoff, accepted by Surya): Spline's free tier expects this
          attribution to stay visible. Covering it is not a compliant removal --
          the compliant route is a paid Spline plan, which drops the badge at
          the source. */}
      <span className="hero-spline-badge-cover" aria-hidden="true" />
    </div>
  );
}
