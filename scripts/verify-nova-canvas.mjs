/**
 * Step 4 verification harness for the canvas scroll-scrubbed RobotCompanion.
 *
 * Drives a real Chrome over CDP, scrolls the full page, and samples:
 *   (a) canvas is present, non-blank, and its pixels change through the rail
 *   (b) console errors / failed frame requests
 *   (c) speech-bubble text transitions as frame ranges cross
 *   (d) isThinking pin-to-"think" behaviour
 * Also reports the empirical scroll window the 10%-85% rail actually maps to.
 *
 * Unlike the other probe scripts here (which import full "playwright"), this
 * one connects over CDP to an already-running Chrome, so it needs only
 * "playwright-core" and no browser download. Neither package is in this
 * project's devDependencies — install playwright-core wherever you run it.
 *
 * Run:
 *   1. npm run dev                                  (dev server on :3000)
 *   2. chrome --remote-debugging-port=9222 \
 *        --user-data-dir=/tmp/chrome-verify --headless=new about:blank
 *   3. node scripts/verify-nova-canvas.mjs
 */
import { chromium } from "playwright-core";

const APP = "http://localhost:3000/";
const CDP = "http://localhost:9222";

const browser = await chromium.connectOverCDP(CDP);
const ctx = browser.contexts()[0] ?? (await browser.newContext());
const page = await ctx.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

const consoleErrors = [];
const failedRequests = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("requestfailed", (r) =>
  failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`)
);
page.on("response", (r) => {
  if (r.status() >= 400) failedRequests.push(`${r.url()} :: HTTP ${r.status()}`);
});

await page.goto(APP, { waitUntil: "domcontentloaded" });

// Nudge scroll so HeroRobot3D's listener flips show2DRobot -> RobotCompanion mounts.
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));

const canvas = page.locator("canvas.robot-companion-canvas");
try {
  await canvas.waitFor({ state: "attached", timeout: 20000 });
} catch {
  console.log("FAIL(mount): canvas.robot-companion-canvas never mounted");
  await browser.close();
  process.exit(1);
}

// Wait for the 120-frame preload to finish (opacity flips to 1 when imagesLoaded).
await page
  .waitForFunction(
    () => {
      const c = document.querySelector("canvas.robot-companion-canvas");
      return c && getComputedStyle(c).opacity === "1";
    },
    { timeout: 180000 }
  )
  .catch(() => console.log("WARN(preload): opacity never reached 1 in 180s"));

// Geometry / layout facts — a canvas with no CSS may sit in normal document flow.
const layout = await page.evaluate(() => {
  const c = document.querySelector("canvas.robot-companion-canvas");
  const rail = document.querySelector(".robot-companion-rail");
  const cs = getComputedStyle(c);
  const rs = rail ? getComputedStyle(rail) : null;
  const r = c.getBoundingClientRect();
  return {
    docHeight: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    canvasAttr: { w: c.width, h: c.height },
    canvasRect: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
    canvasPosition: cs.position,
    railPosition: rs?.position ?? "(no rail el)",
    railZIndex: rs?.zIndex ?? "-",
  };
});

// Sample canvas pixels + bubble text across the whole scrollable range.
const sample = async (frac) => {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * f));
  }, frac);
  await page.waitForTimeout(260); // let ScrollTrigger + rAF settle
  return page.evaluate(() => {
    const c = document.querySelector("canvas.robot-companion-canvas");
    // Near the top of the page HeroRobot3D sets show2DRobot=false, which
    // unmounts RobotCompanion entirely — record that instead of throwing.
    if (!c) return { unmounted: true, scrollY: Math.round(window.scrollY), hash: null, opaque: null, bubble: null };
    const g = c.getContext("2d");
    const { data } = g.getImageData(0, 0, c.width, c.height);
    // cheap content hash + opaque-pixel count (transparent PNGs => alpha matters)
    let hash = 0;
    let opaque = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 8) opaque++;
      hash = (hash * 31 + data[i] + data[i + 1] * 3 + data[i + 3] * 7) | 0;
    }
    const bubble = document.querySelector(".robot-companion-bubble");
    return {
      hash,
      opaque,
      scrollY: Math.round(window.scrollY),
      bubble: bubble ? bubble.textContent.trim() : null,
    };
  });
};

console.log("=== LAYOUT ===");
console.log(JSON.stringify(layout, null, 2));

console.log("\n=== SCROLL SWEEP (fraction of maxScroll) ===");
const samples = [];
for (let i = 0; i <= 20; i++) {
  const frac = i / 20;
  const s = await sample(frac);
  samples.push({ frac, ...s });
  console.log(
    s.unmounted
      ? `f=${frac.toFixed(2)} y=${String(s.scrollY).padStart(5)} UNMOUNTED (show2DRobot=false)`
      : `f=${frac.toFixed(2)} y=${String(s.scrollY).padStart(5)} opaque=${String(s.opaque).padStart(6)} hash=${String(s.hash).padStart(12)} bubble=${JSON.stringify(s.bubble)}`
  );
}

const mounted = samples.filter((s) => !s.unmounted);
const uniqueHashes = new Set(mounted.map((s) => s.hash));
const uniqueBubbles = [...new Set(mounted.map((s) => s.bubble))];
const blank = mounted.filter((s) => s.opaque === 0).length;

// Where does the rail actually start/stop responding?
const changing = mounted.filter((s, i, a) => i > 0 && s.hash !== a[i - 1].hash);
const firstChange = changing.length ? changing[0].frac : null;
const lastChange = changing.length ? changing[changing.length - 1].frac : null;

console.log("\n=== (a) CANVAS UPDATES ===");
console.log(`mounted samples: ${mounted.length}/21 (unmounted near top: ${21 - mounted.length})`);
console.log(`distinct canvas states across mounted samples: ${uniqueHashes.size}`);
console.log(`blank (fully transparent) samples: ${blank}/${mounted.length}`);
console.log(`rail responds between frac ${firstChange} and ${lastChange}`);

console.log("\n=== (c) BUBBLE TRANSITIONS ===");
console.log(`distinct bubble strings: ${uniqueBubbles.length}`);
uniqueBubbles.forEach((b) => console.log(`  - ${JSON.stringify(b)}`));

// (d) isThinking: fire a chat request and watch the canvas pin to the think range.
console.log("\n=== (d) isThinking PIN ===");
await page.evaluate((f) => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, Math.round(max * f));
}, 0.95);
await page.waitForTimeout(300);
const probe = () => {
  const c = document.querySelector("canvas.robot-companion-canvas");
  if (!c) return { unmounted: true };
  const { data } = c.getContext("2d").getImageData(0, 0, c.width, c.height);
  let h = 0;
  for (let i = 0; i < data.length; i += 4) h = (h * 31 + data[i] + data[i + 3] * 7) | 0;
  return { hash: h, bubble: document.querySelector(".robot-companion-bubble")?.textContent.trim() ?? null };
};
const beforeThink = await page.evaluate(probe);

// Stall /api/chat so the in-flight window is wide enough to sample reliably,
// and so the probe doesn't depend on a real API key being present.
await page.route("**/api/chat", async (route) => {
  await new Promise((r) => setTimeout(r, 2500));
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ reply: "stubbed reply" }),
  });
});

// ChatWidget renders collapsed; open it first.
const launcher = page.locator('button[aria-label="Open portfolio assistant"]');
if (await launcher.count()) await launcher.click();

const chatInput = page.locator('input[placeholder="Ask about projects, skills…"]');
let thinkResult = "could not drive ChatWidget";
if (await chatInput.count()) {
  try {
    await chatInput.fill("hello nova");
    await chatInput.press("Enter");
    await page.waitForTimeout(900); // inside the stalled request window
    // Confirm we really are mid-flight (ChatWidget shows its "Thinking…" row).
    const midFlight = await page.getByText("Thinking…").count();
    thinkResult = { midFlight: midFlight > 0, ...(await page.evaluate(probe)) };
  } catch (e) {
    thinkResult = `error driving chat: ${e.message}`;
  }
}
console.log("before:", JSON.stringify(beforeThink));
console.log("during:", JSON.stringify(thinkResult));

console.log("\n=== (b) CONSOLE ERRORS / FAILED REQUESTS ===");
const frameFailures = failedRequests.filter((f) => f.includes("nova-frames"));
console.log(`console errors: ${consoleErrors.length}`);
consoleErrors.slice(0, 12).forEach((e) => console.log(`  ! ${e.slice(0, 200)}`));
console.log(`failed requests: ${failedRequests.length} (nova-frames: ${frameFailures.length})`);
failedRequests.slice(0, 12).forEach((f) => console.log(`  ! ${f.slice(0, 200)}`));

await page.close();
await browser.close();
