import fs from 'node:fs';
import path from 'node:path';

// GA4 web data stream for https://www.cnps.ai (Google Analytics account "CNPS", property www.cnps.ai).
// Production must emit this ID; the environment variable exists only so a preview or staging build can
// point at a separate property without editing the templates.
export const DEFAULT_GA_MEASUREMENT_ID = 'G-NXTM719P1Z';
const measurementIdPattern = /^G-[A-Z0-9]{4,20}$/;

export function resolveMeasurementId(env = process.env) {
  const candidate = (env.GA_MEASUREMENT_ID || '').trim();
  if (!candidate) return DEFAULT_GA_MEASUREMENT_ID;
  if (!measurementIdPattern.test(candidate)) throw Error('GA_MEASUREMENT_ID must look like G-XXXXXXXXXX, got ' + JSON.stringify(candidate));
  return candidate;
}

export const GA_MEASUREMENT_ID = resolveMeasurementId();

/** Standard GA4 gtag.js snippet: page_view only, no Ads linking, no extra pixels. */
export function analyticsSnippet(id = GA_MEASUREMENT_ID) {
  if (!measurementIdPattern.test(id)) throw Error('Invalid GA4 measurement ID ' + JSON.stringify(id));
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`;
}

const isRedirectStub = html => /<meta\s+http-equiv=["']refresh["']/i.test(html);
const hasGtag = html => /googletagmanager\.com\/gtag\/js/i.test(html);

/**
 * Add the snippet to a finished HTML document. Redirect stubs are left alone (the destination page
 * records the view) and documents that already load gtag are returned unchanged.
 */
export function injectAnalytics(html, id = GA_MEASUREMENT_ID) {
  if (!/<head\b/i.test(html) || isRedirectStub(html) || hasGtag(html)) return html;
  const snippet = analyticsSnippet(id);
  const charset = html.match(/<meta\s+charset=["'][^"']*["']\s*\/?>/i);
  if (charset) return html.slice(0, charset.index + charset[0].length) + snippet + html.slice(charset.index + charset[0].length);
  return html.replace(/<head\b[^>]*>/i, tag => tag + snippet);
}

/** Sweep a build directory so authored or legacy HTML copied into it also loads gtag. */
export function applyAnalytics(directory, id = GA_MEASUREMENT_ID) {
  let pages = 0;
  const walk = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) {
        const before = fs.readFileSync(file, 'utf8');
        const after = injectAnalytics(before, id);
        if (after !== before) { fs.writeFileSync(file, after); pages++; }
      }
    }
  };
  walk(directory);
  return { analyticsPages: pages, measurementId: id };
}
