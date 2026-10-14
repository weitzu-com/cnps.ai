import { safeCrmReturnTo, crmPageReturnTo, crmLoginUrl } from "./crm-return.mjs";
// Shared with routing middleware. Host comes from the platform request, never
// X-Forwarded-Host, Origin, a query parameter or a caller-supplied return URL.
export const CRM_ORIGIN = "https://crm.cnps.ai";
const webHosts = new Set(["www.cnps.ai", "cnps.ai"]);
const privatePath = (path) =>
  /^\/(?:workspace(?:\/|$)|w(?:\/|$)|crm(?:\/|$)|demo\/wasion(?:\/|$)|api\/(?:w|crm(?:-[a-z-]+)?)(?:\/|$))/.test(
    path,
  );
const crmPaths =
  /^(?:\/(?:workspace|w(?:\/(?:view|asset\/[a-z0-9-]+))?|demo\/wasion(?:\/[a-z0-9-]+)?)|\/api\/(?:w|crm|crm-page|crm-workspace|crm-workspace-page|crm-wasion-demo-page|crm-wasion-demo-search))$/;
function oldEntry(path, search, method) {
  if (!['/crm', '/crm/', '/crm/workspace', '/crm/workspace/', '/workspace/', '/crm/wasion-demo', '/crm/wasion-demo/'].includes(path)) return null;
  if (!['GET', 'HEAD'].includes(method)) return { status: 410 };
  if (path.startsWith('/crm/wasion-demo')) return { status: 308, location: '/demo/wasion' };
  const location = path.startsWith('/crm/workspace') || path === '/workspace/'
    ? safeCrmReturnTo('/workspace' + search) || '/workspace'
    : crmLoginUrl(crmPageReturnTo('/' + search));
  return { status: 308, location };
}
export function boundaryDecision(host, path, method, env = {}, search = "") {
  host = String(host || "").toLowerCase();
  if (!path.startsWith("/") || /%2f|%5c|\\/i.test(path)) return { status: 404 };
  if (
    env.VERCEL_ENV === "preview" &&
    (host === "crm.cnps.ai" || privatePath(path))
  )
    return { status: 404 };
  if (webHosts.has(host)) {
    if (path === '/workspace' || oldEntry(path, search, method)) {
      if (!['GET', 'HEAD'].includes(method)) return { status: 410 };
      const location = oldEntry(path, search, method)?.location || safeCrmReturnTo('/workspace' + search) || '/workspace';
      return { status: 307, location: CRM_ORIGIN + location };
    }
    if (
      /^\/w(?:\/asset\/[a-z0-9-]+)?$/.test(path) &&
      ["GET", "HEAD"].includes(method)
    )
      return { status: 307, location: CRM_ORIGIN + path };
    if (/^\/w(?:\/|$)/.test(path))
      return { status: method === "POST" ? 410 : 404 };
    return privatePath(path) ? { status: 404 } : null;
  }
  if (host === "crm.cnps.ai") {
    const legacy = oldEntry(path, search, method);
    if (legacy) return legacy;
    if (path === "/") return null;
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
  const url = new URL(req.url, CRM_ORIGIN), path = url.pathname;
  const host = String(req.headers?.host || "").toLowerCase();
  let decision = boundaryDecision(host, path, req.method, env, url.search);
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
