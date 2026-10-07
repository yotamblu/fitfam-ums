import type { NextConfig } from "next";

// Browser protections for every page of the admin app.
const securityHeaders = [
  // Nobody may put this site in a frame: stops "clickjacking" (an invisible admin page under a hostile one).
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    // No script-src on purpose (Next injects inline bootstrap scripts; a nonce-based policy is a later step).
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Ignored over plain http (local development), enforced on the real https site.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
