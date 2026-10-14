# Wasion Industrial UI

## Purpose and references

Industrial is a fifth website direction at `/demo/wasion/styles/industrial`. It leads with Wasion's brand, engineering products and documented project experience. AI search remains an auxiliary navigation and contextual discovery feature. Orderful stays the default at `/demo/wasion`; Classic, Atmospheric and Planhat retain their existing routes.

- Whole-site reference: [T1 Energy on Refero](https://styles.refero.design/style/e79b761d-f476-4c5d-8943-e31a58664e4d)
- Product presentation reference: [Figure 03 on Refero](https://styles.refero.design/style/2997507c-ba60-4653-b217-3eca4858dec8)

The references inform composition and product staging. Wasion imagery and the existing shared product data provide the actual content. The Industrial hero is a brand and portfolio entry, without an AI search form.

## Visual system

The signature is Wasion's engineering film framed as a large industrial image, followed by a precise, switchable hardware display. The site uses warm vellum `#f0efe9`, white `#ffffff`, warm charcoal `#322d2a`, deep charcoal `#242426`, muted text `#65615d` and Wasion blue `#001489`. Blue identifies selected controls and technical navigation; large surfaces remain neutral so the imagery carries the identity.

Light Helvetica Neue/system sans-serif display typography follows T1's quiet scale. System monospace gives featured model names, technical labels and project figures the instrument-like quality of Figure. No reference-brand fonts or imagery are shipped. Body text and enquiry inputs use 16px; controls have at least 44px targets. The 640/768/1024/1280 breakpoints match the existing responsive system. Product photos use `contain`, preserving the complete device, while the company imagery and portfolio scenes use `cover`.

The official company film is `https://en.wasion.com/public/uploads/files/20230718/about.mp4`, with a poster from the shared About page. It is labelled as a company film, not a fabricated manufacturing scene. It starts automatically only on desktop when visible, with reduced motion and save-data disabled; mobile starts from a static engineering poster. Playback pauses offscreen and in background tabs, supports a visible pause control, and retains the poster when the film fails. The featured project card stays in normal flow below 1024px to keep tablet controls unobstructed.

The featured aMeter300, I-110 and WIR-3000 use the existing page records, image URLs and source feature strings. CFE and BREB figures are tied to their named case studies. Enquiries retain the existing user-reviewed email draft flow.

## Shared architecture and boundaries

`server/wasion-demo-styles.mjs` registers `industrial`. The existing style gallery and page switch expose it automatically. Style links preserve the current page and search question, including the private POST recovery flow after login.

`server/wasion-demo-industrial.mjs` exports `renderIndustrialHome(context)`, `INDUSTRIAL_CSS` and `INDUSTRIAL_CLIENT`. The context uses the same `pages`, `helpers` and style-specific `base` as other home compositions. Only Industrial calls its custom home renderer and includes its interaction code. All child pages keep the existing content, legal notices, contact flow and rendering components, with Industrial CSS providing their visual treatment.

Industrial omits the automatic `wd-mini-search` strip on child pages. The shared navigation search link, relevant product/solution search links and the complete search page remain available. Technical specification tables keep their exact source cells and an accessible scroll region on Industrial and Orderful.

All five styles use the same serialized search catalog, `/api/crm-wasion-demo-search` endpoint, server-side project authorization, nonce CSP and private CRM host policy. This change does not modify AI services, account quotas or session rules. Existing generic route rewrites and the style registry handle the new paths; unknown styles remain unavailable.

## Verification

Run `node --test tests/wasion-demo-styles.test.mjs tests/wasion-demo-industrial.test.mjs` for route, content and interaction isolation regression checks. Run `npm test` and `npm run build` before release.

The regression checks cover every published style and route, internal product paths, complete search catalog equality, official product imagery, unchanged source specification cells, a brand-led home hero, removal of the automatic search strip only in Industrial, auxiliary navigation search, current-page and question retention, POST sign-in recovery, script syntax and project access isolation. The product-stage interaction test runs the actual client code and checks click, Home/End and left/right wrapping, one visible panel and roving tab focus.

Automated integration verification on 2026-10-15: the seven relevant demo suites passed all 60 tests; the full `npm test` run passed 569 tests, with 1 existing skipped test and 0 failures. These results do not substitute for the visual, mobile, build and deployed customer-path checks below.

Local browser verification covered 320/375/414/768/1024/1440px home layouts and 375/414/768/1024/1440px technical detail layouts without horizontal page overflow. Product click and End-key switching worked; the mobile navigation opened its offering submenu and Escape returned focus to the menu button. Technical tables have an independent keyboard-focusable scroll region. A fresh 375px home did not load the film; a 1440px reduced-motion view also kept the film unloaded and transitions disabled. Enquiry inputs were 16px with at least 48px height. Local native POST search returned the same official I-110 page matches; the local preview deliberately does not claim a generated AI answer.

Production must ship through a PR merge to `main`, following `AGENTS.md`. After the Git deployment, repeat the customer path on the CRM domain, inspect the five gallery choices, and verify anonymous redirects plus public-domain denial. Record live deployment and browser acceptance evidence separately from automated test results.
