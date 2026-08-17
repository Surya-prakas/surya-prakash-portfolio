import path from "node:path";

// Content-Security-Policy: reasonably permissive rather than strict, because
// the Spline 3D runtime pulls scene data, WASM, and textures from its own CDN
// (prod.spline.design) and from unpkg.com, uses inline shaders, and creates
// blob: URLs for canvas assets. The NVIDIA and Resend APIs are server-side
// only (never fetched by the browser) so they are NOT listed here. GitHub and
// LinkedIn are only <a href> targets, not loaded resources, so they don't need
// CSP entries either.
//
// To tighten: remove 'unsafe-eval' (only Spline needs it; test by removing and
// loading the hero robot) and 'unsafe-inline' (Next.js inline styles + Spline
// shaders). Both would require nonce-based CSP with Next 14's middleware, which
// is a larger change — flag for Surya to review if locking down further.
//
// Added https://*.spline.design and https://*.spline.dev to connect-src for
// Spline's texture/WASM/CDN subdomains that weren't covered by just the base
// prod.spline.design domain. Vercel deployment revealed these at runtime.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://prod.spline.design https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Spline fetches scene JSON + WASM + textures from multiple CDN subdomains.
  // NVIDIA/Resend are server-side only and excluded.
  "connect-src 'self' https://prod.spline.design https://unpkg.com https://*.spline.design https://*.spline.dev",
  "img-src 'self' data: blob: https:",
  // Spline uploads textures/canvas frames as blob: URLs.
  "media-src 'self' blob: data:",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @splinetool/react-spline@4 declares only an "import" condition for its
    // "." export (no "require", no "default"), so a static ESM import resolves
    // but next/dynamic's import() — resolved through the CJS condition set —
    // fails with "Package path . is not exported". Alias straight at the ESM
    // build to bypass the export map. Remove once upstream adds a "default".
    config.resolve.alias["@splinetool/react-spline$"] = path.join(
      process.cwd(),
      "node_modules/@splinetool/react-spline/dist/react-spline.js"
    );
    return config;
  },

  // Security headers applied to every route including API routes.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
          // frame-ancestors 'none' in CSP above already prevents embedding; this
          // is the legacy fallback for browsers that don't evaluate CSP.
        ],
      },
    ];
  },
};

export default nextConfig;
