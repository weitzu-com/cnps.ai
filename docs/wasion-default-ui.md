# Wasion Demo default UI

Industrial is the default presentation for `/demo/wasion` and all canonical child pages. T1 Energy informs the whole-site composition and Figure informs the switchable hardware display. Its first screen presents Wasion’s brand, official company film and routes into the portfolio; shared Wasion product records and imagery supply the content. AI search remains an auxiliary link in the navigation, product context and a compact assistant section after the homepage content. There is no homepage search form or automatic search strip above Industrial content pages. One exported `WASION_DEFAULT_STYLE` controls the renderer, production page API, local preview and base-path generation.

| Presentation | Home | Search |
| --- | --- | --- |
| Industrial (default; T1 Energy + Figure reference) | `/demo/wasion` | `/demo/wasion/search` |
| Classic | `/demo/wasion/styles/classic` | `/demo/wasion/styles/classic/search` |
| Atmospheric | `/demo/wasion/styles/atmospheric` | `/demo/wasion/styles/atmospheric/search` |
| Planhat | `/demo/wasion/styles/planhat` | `/demo/wasion/styles/planhat/search` |
| Orderful | `/demo/wasion/styles/orderful` | `/demo/wasion/styles/orderful/search` |

`/demo/wasion/styles` retains all five choices and labels Industrial as the default. Classic, Atmospheric, Planhat and Orderful each retain their complete styled route tree. The previously published `/demo/wasion/styles/industrial` route and its child pages remain available as compatibility aliases, with internal links, metadata and login recovery using the canonical default paths. Canonical unstyled URLs intentionally render Industrial. Orderful remains available at its explicit styled URLs.

Switching preserves the selected content page or search question. Both canonical and styled POST search retain the existing login recovery form. All five presentations use the same product content, serialized search catalog, CRM host boundary, server-owned project access, private/no-store responses and source-based AI endpoint. Account quotas, sessions and permissions are unchanged by the default switch.

Acceptance covers the entire default route tree matching explicit Industrial rendering, all five style trees, authenticated API default and compatibility-alias behavior, anonymous returns and POST recovery. Browser checks cover desktop and mobile brand/product hierarchy, company-film playback and mobile poster behavior, product-stage selection, product-family destinations, auxiliary search access, menu focus, technical table navigation, live AI answer and official citations on the canonical default URL. Release uses a PR and the main-branch Git integration. Record the deployed release and live acceptance evidence separately from local test results.
