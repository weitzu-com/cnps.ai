import { randomBytes, createHash } from "node:crypto";
import { digest } from "./proposal-crypto.mjs";
import { BusinessError } from "./crm-business-service.mjs";
import { privateHeaders } from "./crm-boundary.mjs";
export function createCrmProposalHandler({
  env,
  runtime,
  loadBundle,
  binding,
}) {
  return async (req, res) => {
    privateHeaders(res);
    const nonce = randomBytes(18).toString("base64");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`,
    );
    const json = (status, value) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(value));
    };
    try {
      const url = new URL(req.url, "https://crm.cnps.ai"),
        route =
          url.pathname === "/api/w"
            ? "/w" +
              (url.searchParams.get("route")
                ? "/" + url.searchParams.get("route")
                : "")
            : url.pathname;
      if (!/^\/w(?:\/(?:view|asset\/[a-z0-9-]+))?$/.test(route))
        return json(req.method === "POST" ? 410 : 404, {
          error: "请使用统一 CRM 登录入口。",
        });
      if (
        !["GET", "HEAD", "POST"].includes(req.method) ||
        (req.method === "POST" && route !== "/w/view")
      )
        return json(405, { error: "请求方式不支持。" });
      if (
        req.method === "POST" &&
        (req.headers.origin !== "https://crm.cnps.ai" ||
          req.headers["x-proposal-request"] !== "1")
      )
        return json(403, { error: "请求来源无效。" });
      const { auth, service } = runtime(),
        principal = await auth.loadSession(req);
      if (!principal) {
        if (route === "/w" && ["GET", "HEAD"].includes(req.method)) {
          res.statusCode = 302;
          res.setHeader("Location", "/crm?next=%2Fw");
          return res.end();
        }
        return json(401, { error: "请先通过短信验证登录。" });
      }
      const assetId = route.startsWith("/w/asset/")
        ? route.slice(9)
        : undefined;
      await service.authorizeProposal(principal, binding, assetId);
      const bundle = await loadBundle(env.CNPS_PROPOSAL_SECRET);
      await service.authorizeProposal(principal, binding, assetId);
      if (route === "/w/view") {
        if (req.method !== "POST")
          return json(405, { error: "请求方式不支持。" });
        const contentHash = createHash("sha256")
          .update(bundle.html)
          .digest("hex");
        await service.recordProposalAccess(
          principal,
          binding,
          "view",
          digest(
            env.CNPS_PROPOSAL_SECRET,
            "proposal-event",
            (principal.sessionId || principal.identityId) +
              ":view:" +
              contentHash,
          ),
          undefined,
          { contentHash },
        );
        return json(200, { ok: true });
      }
      if (assetId) {
        const asset = Object.hasOwn(bundle.assets, assetId)
          ? bundle.assets[assetId]
          : null;
        if (!asset) return json(404, { error: "资料不存在或未获授权。" });
        const bytes = Buffer.from(asset.data, "base64");
        if (asset.filename && !Object.hasOwn(binding.documents, assetId))
          return json(404, { error: "资料不存在或未获授权。" });
        if (asset.filename && req.method === "GET") {
          const contentHash = createHash("sha256").update(bytes).digest("hex");
          await service.recordProposalAccess(
            principal,
            binding,
            "download",
            digest(
              env.CNPS_PROPOSAL_SECRET,
              "proposal-event",
              (principal.sessionId || principal.identityId) +
                ":download:" +
                assetId +
                ":" +
                contentHash,
            ),
            assetId,
            { contentHash },
          );
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", asset.type);
        if (asset.filename)
          res.setHeader(
            "Content-Disposition",
            `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
          );
        return res.end(req.method === "HEAD" ? undefined : bytes);
      }
      if (route !== "/w") return json(405, { error: "请求方式不支持。" });
      const tracker = `<script nonce="${nonce}">(()=>{let done=false;async function record(){if(done||document.visibilityState!=='visible')return;done=true;try{const r=await fetch('/w/view',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Proposal-Request':'1'},body:'{}'});if(!r.ok)done=false;}catch{done=false;}}document.addEventListener('visibilitychange',record);record();window.addEventListener('pageshow',e=>{if(e.persisted){document.body.replaceChildren();location.reload();}});document.querySelectorAll('[data-action="logout"],#logout').forEach(b=>b.addEventListener('click',async()=>{await fetch('/api/crm',{method:'POST',headers:{'Content-Type':'application/json','X-CNPS-CRM':'1'},body:JSON.stringify({action:'logout'})});location.replace('/crm');}));})();</script>`;
      const phone = principal.phone || "";
      let html = bundle.html
        .replaceAll("__VIEWER__", `${phone.slice(0, 3)}****${phone.slice(-4)}`)
        .replaceAll("__CSP_NONCE__", nonce);
      // Historical bundle logout requests are routed to unified logout below.
      html = html
        .replaceAll("fetch('/w/logout'", "fetch('/api/crm'")
        .replaceAll(
          "'X-Proposal-Request':'1'},body:'{}'",
          "'X-CNPS-CRM':'1'},body:JSON.stringify({action:'logout'})",
        );
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(
        req.method === "HEAD"
          ? undefined
          : html.replace("</body>", tracker + "</body>"),
      );
    } catch (e) {
      return json(e instanceof BusinessError ? e.status : 503, {
        error:
          e instanceof BusinessError
            ? e.message
            : "方案访问暂不可用，请稍后重试。",
      });
    }
  };
}
