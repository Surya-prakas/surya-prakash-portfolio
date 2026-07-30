// Headless probe for HeroRobot3D — captures ALL console + pageerror events so
// we can see Spline runtime output (load / emitEvent / warnings) end-to-end.
import { chromium } from "playwright";

const URL = process.env.PROBE_URL || "http://localhost:3000";
const OUT_PNG = "D:\\surya\\surya-portfolio\\scripts\\_spline-probe.png";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const consoleMsgs = [];
const pageErrors = [];

page.on("console", (msg) => {
  consoleMsgs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
  });
});
page.on("pageerror", (err) => {
  pageErrors.push({ name: err.name, message: err.message, stack: err.stack });
});
page.on("requestfailed", (req) => {
  consoleMsgs.push({
    type: "requestfailed",
    text: `${req.method()} ${req.url()} — ${req.failure()?.errorText || ""}`,
    location: {},
  });
});

try {
  const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  console.log("HTTP", resp?.status(), resp?.url());
} catch (e) {
  console.log("GOTO ERR:", e.message);
}

// Give Spline a couple of seconds to initialize beyond networkidle.
await page.waitForTimeout(4000);

let canvasInfo = null;
try {
  await page.screenshot({ path: OUT_PNG, fullPage: false });
  canvasInfo = await page.evaluate(() => {
    const cs = Array.from(document.querySelectorAll("canvas"));
    return cs.map((c) => ({
      width: c.width,
      height: c.height,
      clientW: c.clientWidth,
      clientH: c.clientHeight,
      hasWebGL: !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl")),
      parentClass: c.parentElement?.className || null,
      rect: c.getBoundingClientRect().toJSON(),
    }));
  });
} catch (e) {
  console.log("SCREENSHOT ERR:", e.message);
}

console.log("==CONSOLE==");
for (const m of consoleMsgs) {
  const url = m.location?.url || "";
  console.log(`[${m.type}] ${m.text}${url ? "  @" + url : ""}`);
}
console.log("==PAGEERRORS==");
for (const e of pageErrors) console.log(`${e.name}: ${e.message}`);
console.log("==CANVASES==");
console.log(JSON.stringify(canvasInfo, null, 2));
console.log("==SCREENSHOT==");
console.log(OUT_PNG);

await browser.close();
