# Wasion Demo default UI

Orderful is the default presentation for `/demo/wasion` and all canonical child pages. Its first screen presents Wasion’s brand, product imagery and routes into the portfolio. AI search remains an auxiliary link in the navigation, product context and a compact assistant section after the homepage content; it no longer occupies a homepage form or an automatic search strip above content pages. Shared content and cited AI search are unchanged. One exported `WASION_DEFAULT_STYLE` controls the renderer, production page API, local preview and base-path generation.

| Presentation | Home | Search |
| --- | --- | --- |
| Orderful (default) | `/demo/wasion` | `/demo/wasion/search` |
| Classic | `/demo/wasion/styles/classic` | `/demo/wasion/styles/classic/search` |
| Atmospheric | `/demo/wasion/styles/atmospheric` | `/demo/wasion/styles/atmospheric/search` |
| Planhat | `/demo/wasion/styles/planhat` | `/demo/wasion/styles/planhat/search` |
| Industrial (T1 Energy + Figure reference) | `/demo/wasion/styles/industrial` | `/demo/wasion/styles/industrial/search` |

`/demo/wasion/styles` retains all five choices and labels the default. The previously published `/demo/wasion/styles/orderful` route and its child pages remain available as aliases, with internal links using the canonical default paths. Classic's old unstyled URLs now intentionally show the default Orderful design; the Classic choice has its own complete route tree.

Switching preserves the selected content page or search question. Both canonical and styled POST search retain the existing login recovery form. All routes use the same CRM host boundary, server-owned project access, private/no-store responses and source-based AI endpoint. No public exposure or permissions change accompanies the default switch.

Acceptance covers the entire default route tree matching explicit Orderful rendering, all five style trees, authenticated API default and alias behavior, anonymous returns and POST recovery. Browser checks cover desktop and mobile brand/product hierarchy, product-family destinations, auxiliary search access, menu focus, technical table navigation, live AI answer and official citations on the canonical default URL. Release uses a PR and the main-branch Git integration.
