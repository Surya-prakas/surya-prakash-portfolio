// Reproduces the user's symptom: scroll to bottom, then back to top, three
// times. We want every console.error / pageerror + its stack/location so we
// can decide if any "Missing property" trace points to HeroRobot3D/Spline or
// to internal Next.js warnings.
import { chromium } from "playwright";

const URL = process.env.PROBE_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const events = [];
page.on("console", (msg) => {
  const t = msg.type();
  if (t === "error" || t === "warning" || t === "verbose") {
    events.push({
      kind: "console",
      type: t,
      text: msg.text(),
      location: msg.location(),
    });
  }
});
page.on("pageerror", (err) => {
  events.push({
    kind: "pageerror",
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
});

const log = (label) => {
  console.log(`---- ${label} ----`);
  if (events.length === 0) {
    console.log("(no error/warning/verbose console messages or pageerrors)");
    return;
  }
  for (const e of events) {
    if (e.kind === "pageerror") {
      console.log(`[pageerror] ${e.name}: ${e.message}`);
      console.log(e.stack);
    } else {
      const jsLoc = e.location?.url || "";
      const line = e.location?.lineNumber ?? "";
      const col = e.location?.columnNumber ?? "";
      console.log(`[console:${e.type}] ${e.text}`);
      if (jsLoc) console.log(`  at ${jsLoc}:${line}:${col}`);
    }
  }
  events.length = 0;
};

const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
console.log("HTTP", resp?.status(), resp?.url());

// Wait for Spline to fully boot before any scrolling.
await page.waitForTimeout(4000);
log("AFTER INITIAL LOAD");

// Identify the document height so we can scroll to the real bottom.
const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
console.log("scrollHeight:", docHeight);

for (let i = 1; i <= 3; i++) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(900);
  log(`AFTER SCROLL CYCLE ${i}`);
}

// Final state probe — is the canvas still attached / visible at top?
const probe = await page.evaluate(() => {
  const cs = Array.from(document.querySelectorAll("canvas"));
  return cs.map((c) => {
    const r = c.getBoundingClientRect();
    const wrap = c.parentElement;
    return {
      rect: r.toJSON(),
      hasWebGL: !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("webgl")),
      wrapperStyle: wrap ? getComputedStyle(wrap).cssText.slice(0, 200) : null,
      visible: wrap ? getComputedStyle(wrap).opacity : null,
    };
  });
});
console.log("==FINAL PROBE (scrolled back to top)==");
console.log(JSON.stringify(probe, null, 2));

await page.screenshot({ path: "D:\\surya\\surya-portfolio\\scripts\\_probe-scroll.png" });
await browser.close();
