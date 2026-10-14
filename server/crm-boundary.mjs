// Shared with routing middleware. Host comes from the platform request, never
// X-Forwarded-Host, Origin, a query parameter or a caller-supplied return URL.
export const CRM_ORIGIN = "https://crm.cnps.ai";
const webHosts = new Set(["www.cnps.ai", "cnps.ai"]);
const privatePath = (path) =>
  /^\/(?:w(?:\/|$)|crm(?:\/|$)|demo\/wasion(?:\/|$)|api\/(?:w|crm(?:-[a-z-]+)?)(?:\/|$))/.test(
    path,
  );
const crmPaths =
  /^(?:\/(?:crm(?:\/workspace)?|w(?:\/(?:view|asset\/[a-z0-9-]+))?|demo\/wasion(?:\/[a-z0-9-]+)?)|\/api\/(?:w|crm|crm-page|crm-workspace|crm-workspace-page|crm-wasion-demo-page|crm-wasion-demo-search))$/;
export function boundaryDecision(host, path, method, env = {}) {
  host = String(host || "").toLowerCase();
  if (!path.startsWith("/") || /%2f|%5c|\\/i.test(path)) return { status: 404 };
  if (
    env.VERCEL_ENV === "preview" &&
    (host === "crm.cnps.ai" || privatePath(path))
  )
    return { status: 404 };
  if (webHosts.has(host)) {
    if (
      /^\/w(?:\/asset\/[a-z0-9-]+)?$/.test(path) &&
      ["GET", "HEAD"].includes(method)
    )
      return { status: 307, location: CRM_ORIGIN + path };
    if (/^\/w(?:\/|$)/.test(path))
      return { status: method === "POST" ? 410 : 404 };
    if (
      /^\/crm(?:\/workspace)?$/.test(path) &&
      ["GET", "HEAD"].includes(method)
    )
      return { status: 307, location: CRM_ORIGIN + path };
    return privatePath(path) ? { status: 404 } : null;
  }
  if (host === "crm.cnps.ai") {
    if (path === "/") return { status: 307, location: "/crm" };
    return crmPaths.test(path) ? null : { status: 404 };
  }
  return privatePath(path) ? { status: 404 } : null;
}
export function privateHeaders(res) {
  for (const header of [
    "Cache-Control",
    "CDN-Cache-Control",
    "Vercel-CDN-Cache-Control",
  ])
    res.setHeader(header, "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
}
export function guardPrivateRequest(req, res, env = process.env) {
  privateHeaders(res);
  const path = new URL(req.url, CRM_ORIGIN).pathname;
  const host = String(req.headers?.host || "").toLowerCase();
  let decision = boundaryDecision(host, path, req.method, env);
  if (host !== "crm.cnps.ai" && !decision) decision = { status: 404 };
  if (!decision) return false;
  res.statusCode = decision.status;
  if (decision.location) res.setHeader("Location", decision.location);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(
    req.method === "HEAD"
      ? undefined
      : JSON.stringify({
          error:
            decision.status === 410
              ? "此入口已迁移，请在 crm.cnps.ai 重新登录。"
              : "页面不存在。",
        }),
  );
  return true;
}
