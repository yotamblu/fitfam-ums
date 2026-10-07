// Same-origin proxy to the FitFam API. The browser only ever talks to this site, so the login cookie belongs to this
// site (first-party), whatever address the API is hosted at, and the API never needs to allow this site's origin.
//
// This is deliberately the ONLY server-side code in the admin app. It is a plain pass-through: it only reaches the
// fixed API address below, only for the allowed areas, and the API still checks the admin role on every request.
// It re-sends the request without the browser's `Origin` header (the API's CORS list would reject it), after checking
// that the request came from this very site.

// Free API hosting can be asleep; give the first request time to wake it (serverless platforms cap this value).
export const maxDuration = 60;
const UPSTREAM_TIMEOUT_MS = 55_000;

// Least privilege: only these API areas are reachable through the admin app.
const ALLOWED_PREFIXES = ["auth/", "admin/"];

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept", "cookie"];

/** Server-side only. Required in production; falls back to the local API during development. */
function apiOrigin(): string | null {
  const configured = process.env.API_ORIGIN?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? null : "http://localhost:8081";
}

function json(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** A browser request from another site must not ride on the user's cookie through this proxy. */
function isSameSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin GETs carry no Origin header
  try {
    const originHost = new URL(origin).host;
    const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")];
    return hosts.includes(originHost);
  } catch {
    return false;
  }
}

async function proxy(request: Request, ctx: RouteContext<"/backend/[...path]">): Promise<Response> {
  const { path } = await ctx.params;

  // A segment may never climb or split paths, however it was encoded (decoded here, e.g. "..%2Fadmin").
  if (path.some((segment) => segment === "." || segment.includes("..") || /[\\/\u0000]/.test(segment))) {
    return json(400, "invalid_request");
  }
  const apiPath = path.map(encodeURIComponent).join("/");
  if (!ALLOWED_PREFIXES.some((prefix) => `${apiPath}/`.startsWith(prefix))) return json(404, "not_found");
  if (!isSameSite(request)) return json(403, "forbidden_origin");

  const origin = apiOrigin();
  if (!origin) return json(503, "api_not_configured");

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${origin}/${apiPath}${new URL(request.url).search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return json(502, "api_unreachable");
  }

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }
  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
