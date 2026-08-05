import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/fa/admin", "/en/admin", "/fa/account", "/en/account"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
