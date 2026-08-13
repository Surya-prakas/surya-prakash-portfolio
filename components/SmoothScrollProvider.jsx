"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollContext = createContext(null);

/*
  Read the one shared Lenis instance, plus a scrollToId helper.

  `lenis` is null when smooth scroll is off (reduced motion, see below) and for
  the first render before the effect runs, so anything reaching for it directly
  has to handle null. Prefer `scrollToId`, which owns that fallback once instead
  of leaving every caller to reinvent it.

  scrollToId returns false when no element has that id -- callers that show the
  result to a user (TerminalHero's section commands) can then say so rather than
  appearing to work while nothing moves.
*/
export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) {
    throw new Error("useSmoothScroll must be used within SmoothScrollProvider");
  }
  return ctx;
}

/*
  SmoothScrollProvider
  ----------------------------------------------------
  One global Lenis instance, bridged to GSAP's ticker and ScrollTrigger.

  Why this wiring and not something else:
  - Lenis drives the real window scroll position (it is not a transform-based
    fake scroller), so every ScrollTrigger in the app -- including
    CinematicNovaIntro's `pin: true` -- keeps working against native scroll
    with no scrollerProxy needed. Only the *timing* of updates changes, which
    is what the two lines below fix.
  - `lenis.on("scroll", ScrollTrigger.update)` makes ScrollTrigger recompute on
    Lenis's interpolated position rather than only on the browser's scroll
    event, otherwise scrubbed animations lag behind the smoothed position.
  - Driving `lenis.raf` from `gsap.ticker` means GSAP and Lenis share a single
    rAF loop, so a scrubbed canvas frame and the scroll position it is derived
    from are always computed in the same tick. Two independent rAF loops is
    exactly how frame-scrubbing ends up reading a stale scroll value.
  - `lagSmoothing(0)` stops GSAP from silently skipping time after a slow frame
    (the 120-frame preload can cause one), which would otherwise desync the
    ticker from Lenis's own clock.
*/
export default function SmoothScrollProvider({ children }) {
  // State rather than a ref: consumers need a re-render when the instance
  // appears, since it is created in the effect and therefore does not exist on
  // the first render.
  const [lenis, setLenis] = useState(null);

  // Single entry point for programmatic scrolling. Uses the shared Lenis
  // instance when there is one, so a scroll issued from the UI is interpolated
  // by the same scroller that handles wheel input -- calling
  // element.scrollIntoView() instead would hand the page to the browser's own
  // smooth-scroll for the duration and read as a different, snappier motion
  // than every other scroll on the site.
  const scrollToId = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      if (lenis) {
        lenis.scrollTo(el);
      } else {
        // No Lenis: either reduced motion (native instant is the whole point of
        // that preference) or the effect has not run yet (native smooth is the
        // closest match to what Lenis would have done).
        el.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }
      return true;
    },
    [lenis]
  );

  useEffect(() => {
    // Smooth scroll is momentum the user did not ask for: it keeps the page
    // moving after input stops, which is precisely what reduce-motion is meant
    // to suppress. Bail out entirely and leave native scrolling alone -- every
    // ScrollTrigger already works without Lenis, so this path needs no bridge.
    // `lenis` stays null, and scrollToId falls back accordingly.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Tuning: keep Lenis defaults (lerp=0.1) for distance/responsiveness, but
    // reduce wheelMultiplier slightly so a single trackpad tick delivers less
    // scroll demand. The page-wide "too fast" feeling came from the 100%
    // multiplier on macOS trackpads (which already report large deltas);
    // dropping to 0.7 gives the user more wheel ticks per section without
    // changing how Lenis smooths the result.
    //
    // Why 0.7 and not lower: at 0.5, a deliberate wheel spin (6 ticks of
    // 120px each) only produces 360px of scroll -- users notice the
    // sluggishness and have to spin twice. 0.7 keeps each tick meaningful
    // (84px of demand per tick) while reducing the overshoot effect.
    //
    // The pin-distance fix (pin=4500 instead of 3500) handles the chapter-
    // skipping problem structurally; the Lenis tuning just makes the rest
    // of the page feel less "uncontrolled".
    const lenis = new Lenis({
      wheelMultiplier: 0.7,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    // Kept in a named binding rather than an inline arrow: gsap.ticker.remove
    // matches by function identity, so removing `lenis.raf` (a different
    // reference to a different function) would silently fail and leave this
    // callback running against a destroyed instance after unmount. React's
    // StrictMode double-invokes effects in dev, so that leak is not theoretical
    // -- it would stack a second ticker callback on every remount.
    const raf = (time) => {
      lenis.raf(time * 1000); // gsap.ticker reports seconds, lenis.raf wants ms
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // The pin-spacer that CinematicNovaIntro's pin injects changes document
    // height. Lenis caches scroll dimensions, so it needs to hear about that
    // or its clamp at the bottom of the page is computed against a stale height.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(raf);
      // Restore GSAP's default (it is a global setting, and leaving it at 0
      // would outlive this component).
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      // Cleared so no consumer keeps a handle on a destroyed instance and calls
      // scrollTo into the void after unmount.
      setLenis(null);
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={{ lenis, scrollToId }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
