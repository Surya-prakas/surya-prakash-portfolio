import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import CompanionLayer from "../components/CompanionLayer";
import { RobotHandoffProvider } from "../components/RobotHandoffContext";
import SmoothScrollProvider from "../components/SmoothScrollProvider";
import {
  SITE_URL,
  HAS_REAL_SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "./site";

export const metadata = {
  // Resolves every relative URL in this metadata (and the file-convention OG
  // image) against the real origin. Omitted entirely while SITE_URL is still
  // the placeholder: setting it to a fake origin would make Next emit
  // confident-looking absolute og:url/og:image values pointing at a domain
  // that doesn't exist, which is worse than emitting none.
  ...(HAS_REAL_SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    ...(HAS_REAL_SITE_URL ? { url: SITE_URL } : {}),
    // NOTE: no `images` key on purpose. app/opengraph-image.js is a file
    // convention, and Next merges it into the resolved metadata for this
    // segment -- but an explicit openGraph.images here WINS over the file
    // convention and suppresses it, so listing "/og-image.png" (a file that
    // does not exist in public/) would replace a working generated card with
    // a 404. One source of truth: the route handler.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Same reasoning as openGraph.images -- the file convention supplies
    // twitter:image too.
  },
  // favicon.ico is already present at app/favicon.ico and auto-detected. The
  // other sizes (apple-touch-icon, 32x32, 16x16) still need generating from a
  // Nova frame -- add an `icons` key here once those files exist.
};

// Person schema. Emitted as a plain <script> in the body rather than through
// metadata.other: `other` flattens to <meta> tags, which cannot carry a JSON
// payload, so JSON-LD has to be a real script element. Next hoists it fine
// from here and it stays in the initial SSR HTML, which is what crawlers read.
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Surya Prakash",
  jobTitle: "AI & Full-Stack Developer",
  // Only claim a URL when there is a real one; a placeholder origin in
  // structured data is worse than an absent field.
  ...(HAS_REAL_SITE_URL ? { url: SITE_URL } : {}),
  sameAs: [
    "https://github.com/Surya-prakas",
    "https://www.linkedin.com/in/suryaprakash-458700228",
  ],
  knowsAbout: [
    "Machine Learning",
    "Deep Learning",
    "Full-Stack Development",
    "Fraud Detection",
    "React",
    "Python",
  ],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Vardhaman College of Engineering",
  },
  email: "mailto:gaddamsuryaprakash960@gmail.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // Serialized via dangerouslySetInnerHTML because React would escape
          // the quotes in a JSX text child and produce invalid JSON-LD.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        {/* Lenis sits inside RobotHandoffProvider, not outside: CompanionLayer
            is a consumer of the handoff context, so it has to stay within that
            provider's subtree. SmoothScrollProvider now publishes its own
            context too (the shared Lenis instance + scrollToId, consumed by
            TerminalHero), so {children} must stay inside it -- which it is.
            Nesting order between the two providers is otherwise arbitrary; they
            share no state. */}
        <RobotHandoffProvider>
          <SmoothScrollProvider>
            {children}
            <CompanionLayer />
          </SmoothScrollProvider>
        </RobotHandoffProvider>
      </body>
    </html>
  );
}
