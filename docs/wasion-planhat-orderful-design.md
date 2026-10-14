# Wasion Planhat and Orderful UI directions

## Purpose and references

Utility visitors need to find the relevant portfolio, inspect published specifications, review project evidence and contact Wasion. These buying tasks determine the content; the references determine its visual presentation.

- Planhat reference: https://styles.refero.design/style/94c4fc51-4323-4f06-a4a4-27517e190445
- Orderful reference: https://styles.refero.design/style/d95a35c2-d3f7-49e7-9ba7-282d52d3211d

Planhat uses a dark industrial photographic hero, regular-weight display typography, white reading surfaces, two-column section introductions and a hairline company-fact grid. Palette: #000000, #ffffff, #121211, #575551, #f5f5f3. Interactive radius 4px, panel radius 8px, no shadows.

Orderful uses a white split hero with a clickable mosaic of actual Wasion products, light display type, a matte #f5f5f5 canvas and #e42b0c primary actions. Palette: #101828, #4a5565, #1f1f1f, #ffffff, #f5f5f5, #e42b0c. Radius 8px, subtle card elevation, centered section introductions. The navigation gradient uses darker vermillion tones to keep small white text readable.

Licensed reference fonts are substituted with Helvetica Neue / Helvetica / Arial; imagery and facts come from the existing Wasion dataset. No competitor logos, fabricated customers, product dashboards or testimonials are introduced. Existing source links accompany facts and case studies.

## Shared architecture

The style registry exposes Classic, Atmospheric, Planhat and Orderful. The new routes are `/demo/wasion/styles/planhat` and `/demo/wasion/styles/orderful`, with the same child slugs. The gallery remains `/demo/wasion/styles`.

Product/experience/legal/contact pages, the serialized search trust catalog, AI backend, official citations, authentication, nonce CSP and private host policy are shared. Variant home compositions use exported offering/challenge/company-fact data from the existing shell. A CSS map selects the visual treatment once per request.

Style links retain the current page and initial search question. When a search question has subsequently been edited, a normal style click posts that question to the destination style using the existing private-search policy. Modifier clicks retain their normal link behavior.

## Verification

Run `npm test` and `npm run build`. The variant tests inspect real body markup for every route and style, validate local links and script syntax, compare the complete search catalog across styles, preserve product technical data and check style login resume forms. Existing integration route assertions use the registry rather than a hard-coded Atmospheric slug.

Before release, inspect desktop and 390px mobile layouts, navigation, product details, current-question switching and ordinary search fallback. After the main-branch Git deployment, confirm both live styles, AI answers and citations, detail navigation, all four gallery choices, anonymous redirects and the public-domain denial.
