import type { MetadataRoute } from "next";

// Internal tool: tell every crawler to stay away (the pages are also marked noindex).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
