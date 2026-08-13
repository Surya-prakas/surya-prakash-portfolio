import { SITE_URL, HAS_REAL_SITE_URL } from "./site";

export default function sitemap() {
  if (!HAS_REAL_SITE_URL) {
    return [];
  }

  const routes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  return routes;
}