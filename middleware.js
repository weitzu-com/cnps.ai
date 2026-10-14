import { boundaryDecision } from "./server/crm-boundary.mjs";
export const config = { matcher: "/:path*", runtime: "nodejs" };
export default function middleware(request) {
  const url = new URL(request.url);
  const decision = boundaryDecision(url.host, url.pathname, request.method, {
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
  if (!decision)
    return new Response(null, { headers: { "x-middleware-next": "1" } });
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy":
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  };
  if (decision.location)
    headers.Location = new URL(decision.location, url).href;
  return new Response(
    request.method === "HEAD"
      ? null
      : decision.status === 410
        ? "此入口已迁移，请在 crm.cnps.ai 重新登录。"
        : "页面不存在。",
    { status: decision.status, headers },
  );
}
