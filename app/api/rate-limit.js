// app/api/rate-limit.js
//
// Shared in-memory sliding-window rate limiter used by both API routes
// (/api/chat and /api/contact) so a script cannot bypass one by hitting
// the other. Extracted from app/api/chat/route.js rather than reimplemented
// — there is exactly one limiter here, not two.
//
// TRADEOFF, stated plainly: this state lives in the Node process. On a
// serverless host it resets on every cold start and is NOT shared between
// concurrently running instances, so the real ceiling is roughly
// LIMIT x (number of warm instances) rather than a hard LIMIT. That is
// acceptable for a personal portfolio's traffic and costs nothing to run.
//
// TO UPGRADE to a correct distributed limiter: add @upstash/ratelimit +
// @upstash/redis, create a free Upstash database, set UPSTASH_REDIS_REST_URL
// and UPSTASH_REDIS_REST_TOKEN, and replace the body of checkRateLimit() --
// nothing else needs to change, which is why the check is isolated into one
// function rather than inlined into the route handlers.

// Module-scope so it survives between requests on a warm instance.
// A single Map shared across both routes means a caller that burns through
// their budget on /api/chat is also limited on /api/contact, which is the
// intent: it is one IP hammering the site, not two unrelated callers.
const hits = new Map(); // ip -> number[] (timestamps, ascending)

const DEFAULT_LIMIT = 10; // requests...
const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // ...per IP per 10 minutes

export function checkRateLimit(ip, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS) {
  const now = Date.now();
  const cutoff = now - windowMs;

  const recent = (hits.get(ip) || []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    hits.set(ip, recent);
    // Seconds until the oldest hit in the window expires.
    const retryAfter = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic sweep so the Map cannot grow unbounded across many distinct
  // IPs on a long-lived instance. Cheap because it only runs occasionally.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      const live = times.filter((t) => t > cutoff);
      if (live.length === 0) hits.delete(key);
      else hits.set(key, live);
    }
  }

  return { allowed: true };
}

// Best-effort client identity. Vercel and most proxies set x-forwarded-for;
// the first entry is the original client. Falls back to a shared bucket, which
// fails closed (everyone shares one limit) rather than open.
export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
