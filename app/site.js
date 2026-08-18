// Single source of truth for the site's own absolute URL.
//
// Not deployed anywhere yet, so there is no real domain to put here. This is a
// deliberate placeholder rather than an invented domain: metadataBase and the
// JSON-LD `url` both need an absolute origin, and a plausible-looking guess
// (suryaprakash.dev, a .vercel.app subdomain) would be indistinguishable from a
// real configured value once it's buried in layout.js -- so it would silently
// ship wrong Open Graph URLs instead of failing visibly.
//
// TO GO LIVE: set NEXT_PUBLIC_SITE_URL in the deploy environment, or replace
// the fallback string below. Nothing else needs to change.
//
// On Vercel, VERCEL_URL is injected automatically (host only, no protocol), so
// preview and production deploys resolve correctly without any config.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://REPLACE-WITH-REAL-DOMAIN.example";

// True only when a real origin has been supplied. Used to skip emitting
// absolute-URL metadata that would otherwise point at the placeholder.
export const HAS_REAL_SITE_URL = !SITE_URL.includes("REPLACE-WITH-REAL-DOMAIN");

export const SITE_NAME = "Surya Prakash";
export const SITE_TITLE = "Surya Prakash — AI & Full-Stack Developer";

// One sentence, front-loaded with the name + role so a search snippet or an
// AI answer engine can lift it verbatim. Keeps the FAQ section's factual tone
// (no "passionate", no "innovative") and matches the claims made there.
export const SITE_DESCRIPTION =
  "Surya Prakash is an AI and Full-Stack Developer specializing in machine learning and fraud detection systems, currently pursuing an M.Tech in Software Engineering at JNTUH.";

export const LINKEDIN_URL = "https://www.linkedin.com/in/surya-prakash-458700228";
export const GITHUB_URL = "https://github.com/Surya-prakas";
export const EMAIL = "mailto:gaddamsuryaprakash960@gmail.com";
