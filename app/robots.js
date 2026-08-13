import { SITE_URL, HAS_REAL_SITE_URL } from "./site";

export default function robots() {
  if (!HAS_REAL_SITE_URL) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}