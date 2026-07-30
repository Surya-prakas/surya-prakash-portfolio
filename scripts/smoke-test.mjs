// Headless smoke test: load /, scroll top-to-bottom, collect console + page errors,
// report whether the project-card <img> tags rendered on the live DOM.
// Run via: node scripts/smoke-test.mjs  (target URL via BASE_URL env, default http://localhost:3002)
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3002';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const consoleMsgs = [];
const pageErrors = [];
const failedReqs = [];

page.on('console', (m) => {
  consoleMsgs.push({ type: m.type(), text: m.text() });
});
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('requestfailed', (r) => failedReqs.push({ url: r.url(), failure: r.failure()?.errorText }));

await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });

// Wait for terminal-hero / page to settle
await page.waitForTimeout(2500);

// Inspect images exactly like a visitor would (post-hydration)
const visibleImgs = await page.$$eval('img', (els) =>
  els.map((el) => ({
    src: el.getAttribute('src'),
    alt: el.getAttribute('alt'),
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
    complete: el.complete,
  }))
);

// Scroll programmatically to trigger scroll observers / lazy handoff
const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('document height:', pageHeight);
for (let y = 0; y <= pageHeight; y += 400) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(150);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

// Re-collect images after scroll (some may lazy-load)
const visibleImgsAfterScroll = await page.$$eval('img', (els) =>
  els.map((el) => ({ src: el.getAttribute('src'), ok: el.complete && el.naturalWidth > 0 }))
);

const report = {
  baseUrl: BASE,
  consoleMsgs,
  pageErrors,
  failedReqs,
  visibleImgs,
  visibleImgsAfterScroll,
};
console.log(JSON.stringify(report, null, 2));

await browser.close();
