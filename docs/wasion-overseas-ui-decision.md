# Wasion overseas UI decision

## Audience and jobs
Utility procurement teams, technical engineers and overseas partners need to identify a product family, check published specifications, inspect official evidence and prepare a project enquiry. The recommendation prioritizes these tasks over decorative impact. This is a design review, not a measured conversion study.

## Comparison of the four shipped variants

| Variant | Strength | Main tradeoff | Recommended use |
| --- | --- | --- | --- |
| Classic | Complete utility navigation and company story | Large motion-led opening and considerable content before discovery | Existing baseline |
| Atmospheric | Strong industrial brand presentation | Monumental type and tall hero delay technical exploration | Brand or campaign presentation |
| Planhat | Restrained monochrome identity and clear reading surfaces | First screen emphasizes a general brand promise over the portfolio | Corporate storytelling |
| Orderful | Four actual product families immediately visible; light surfaces and direct actions | Earlier version buried its main search and repeated the portfolio | Overseas customer experience, refined in this release |

Desktop browser review at 1280px placed the original in-page search around 1,255px for Classic, 1,573px for Atmospheric, 2,793px for Planhat and 4,544px for Orderful. These are one-session layout observations, not performance or customer research metrics. The header search link was available in all four.

## Selected direction

Keep the Orderful route and mark it recommended in the four-style gallery. Retain all existing links, content sources, access checks and AI endpoint. Preserve Wasion's actual logo and product imagery. Keep the light #f5f5f5 canvas, #101828 text, #4a5565 supporting text and #e42b0c actions; use 0.5rem corners, system Helvetica/Arial, readable 1rem form text and 3rem primary controls.

The signature is a working utility portfolio: four real product families next to a technical search, rather than a generic software dashboard. A specific smart-metering headline, model/standard search and catalog/project actions form the first task surface. Remove the second copy of the four-family grid and the distant second search section. Keep official company evidence, utility challenges and project references below.

## Desktop and mobile refinements

- Technical search inside the hero, before the mosaic on narrow screens; native POST with the shared existing backend and cited answers.
- Sticky main header and product section navigation; section anchors clear both bars.
- Readable, focusable technical table scroll region with mobile instructions; do not shrink specifications to fit.
- Mobile navigation locks background scrolling, focuses the first menu group, cycles keyboard focus within the header, closes with Escape and restores the menu button, and clears state when resizing to desktop.
- Form inputs remain at least 16px, primary actions at least 48px high, footer touch links at least 44px, source/legal text at least 14px.
- Contact continues to prepare an email draft, with clear disclosure; no automatic submission or sending.

## Acceptance

Run the full tests and build. Inspect home at 375, 414, 768, 1024 and 1440px, menu keyboard behavior, source-linked search, product table scrolling and anchor clearance, gallery recommendation and draft-only contact. Release through the repository PR and main Git integration. Verify the actual CRM domain with its existing session, then check anonymous redirects and private/no-store behavior. Browser simulation verifies viewport layouts, not physical-device compatibility or every overseas network.
