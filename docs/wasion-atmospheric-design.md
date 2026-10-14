# Wasion Atmospheric UI

The Heart Aerospace DESIGN.md supplied by the owner is the visual reference. Wasion utility buyers still need product families, technical tables, official sources and contact routes. These content structures remain shared across styles.

## Design rules

- Full-width industrial photography and large, left-aligned Helvetica Neue display type; no licensed Heart Aerospace fonts or imagery copied.
- Palette: atmospheric #716e85, outlined actions #001489, black #000000, white #ffffff. Neutral gray supports technical data.
- Flat surfaces: zero radius, no elevation shadows, no filled CTA backgrounds. Content tiles are image-and-type columns without decorated card shells.
- 40px desktop edge alignment; 20px on mobile. Section spacing 70px desktop / 50px mobile. Display type scales to available width rather than enforcing 156px on phones.
- White hero text uses a dark photograph overlay to preserve legibility. Source Wasion logo and product images are retained.
- Transparent home navigation; a white navigation surface on reading/search pages.
- Product photography and technical information remain readable rather than forcing the reference's aviation-only layout onto a utility procurement flow.

## Routes

- Existing Classic: `/demo/wasion` and its original child routes.
- Selection page: `/demo/wasion/styles`.
- Atmospheric: `/demo/wasion/styles/atmospheric` and `/demo/wasion/styles/atmospheric/:slug`.
- Style switches keep the current page and, on search pages, the question.
- API search results and citations resolve within the current style.

The gallery lists only released styles. To add another direction: register its slug and label in `server/wasion-demo-styles.mjs`, add its stylesheet/render treatment in `server/wasion-demo-page.mjs`, then run the variant route and authorization tests. The generic rewrites and CRM return-target policy already support registered styles. Avoid a mutable module-level current-style variable; rendering scopes the route base to each request.

## Access

Every style uses the same authenticated Wasion project authorization, private/no-store headers, nonce CSP, noindex policy and revalidation as Classic. New routes are allowed only on crm.cnps.ai; public domains and preview deployment hosts remain denied. The loopback preview server is for local visual review only.

## Validation

- `npm test`: 450 passed, 1 existing skipped.
- `npm run build`: passed.
- All 64 content pages plus search checked for both styles, including internal routes, script syntax and official source data.
- Browser review at 1280px and 390px: home, mobile menu, product catalog, I-110 search and product detail; no mobile horizontal overflow on home/catalog.
