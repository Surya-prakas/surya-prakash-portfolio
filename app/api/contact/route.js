// app/api/contact/route.js
//
// Contact form -> email via Resend. The API key never reaches the browser.
//
// SETUP REQUIRED (cannot be done from here -- needs Surya's own account):
//   1. Sign up at https://resend.com
//   2. Create an API key, add it to .env.local as RESEND_API_KEY=re_...
//   3. Sending domain: either verify a real domain, or use Resend's shared
//      onboarding sender for testing. FROM_ADDRESS below defaults to the
//      onboarding sender, which Resend allows WITHOUT domain verification but
//      only delivers to the account owner's own address -- which happens to be
//      exactly where this form sends, so testing works out of the box.
//      Once a domain is verified, set RESEND_FROM to e.g.
//      "Portfolio <contact@yourdomain.com>" for real deliverability.
//
// Until RESEND_API_KEY exists the route returns a 503 with a clear message
// rather than throwing, so the form degrades to a visible error state instead
// of a crash or an unhandled rejection.

import { Resend } from "resend";
import { checkRateLimit, clientIp } from "../rate-limit.js";

// Same limit/window as /api/chat -- the shared limiter (app/api/rate-limit.js)
// uses one Map across both routes, so a caller that burns their budget on the
// chat route is also capped here. Without this, the contact form could be
// scripted to spam Surya's inbox or exhaust Resend's sending quota.
const LIMIT = 10; // requests per IP per 10 minutes (matches /api/chat)

const TO_ADDRESS = "gaddamsuryaprakash960@gmail.com";
const FROM_ADDRESS = process.env.RESEND_FROM || "Portfolio <onboarding@resend.dev>";

// Trust-boundary validation: this is unauthenticated public input, so every
// field is length-capped as well as presence-checked. Caps are generous enough
// for a real message but stop a multi-megabyte body from reaching the mail API.
const LIMITS = { name: 100, email: 200, message: 5000 };

// Deliberately permissive: one @, no whitespace, a dot in the domain. Strict
// RFC-5322 validation rejects addresses that actually work, and the real
// confirmation is whether the mail sends.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const { allowed, retryAfter } = checkRateLimit(clientIp(request), LIMIT);
  if (!allowed) {
    return Response.json(
      {
        error: "Too many submissions from this address — please try again in a few minutes.",
        retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return Response.json(
      { error: "Name, email, and message are all required." },
      { status: 400 }
    );
  }
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    message.length > LIMITS.message
  ) {
    return Response.json({ error: "One of the fields is too long." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "That email address looks invalid." }, { status: 400 });
  }

  // Checked at request time, not module scope: `new Resend(undefined)` throws,
  // which at module scope would break the whole route (and the build) instead
  // of returning a handled error.
  if (!process.env.RESEND_API_KEY) {
    console.error("Contact route: RESEND_API_KEY is not set — see setup notes in this file.");
    return Response.json(
      { error: "The contact form isn't configured yet. Please email me directly." },
      { status: 503 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
      // replyTo, so hitting reply in the inbox goes to the sender rather than
      // to the from-address. The visitor's address is NOT used as `from` --
      // that would fail SPF/DKIM for their domain and land in spam.
      replyTo: email,
      subject: `Portfolio contact — ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      console.error("Resend API error:", error);
      return Response.json(
        { error: "Couldn't send that right now. Please try again or email me directly." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, id: data?.id ?? null });
  } catch (err) {
    console.error("Contact route error:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
