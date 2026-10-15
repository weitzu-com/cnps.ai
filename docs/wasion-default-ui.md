# Wasion Demo default UI

The 0916 customer requirements presentation is the default for `/demo/wasion` and its canonical child pages. It uses the independent `server/wasion-requirements/` renderer and the existing authenticated page and search APIs. See `wasion-0916-execution.md` for the design contract and `wasion-0916-acceptance.md` for content boundaries and local acceptance evidence. One exported `WASION_DEFAULT_STYLE` controls the renderer, production page API, local preview and base-path generation.

| Presentation | Home | Search |
| --- | --- | --- |
| 0916 requirements (default) | `/demo/wasion` | `/demo/wasion/search` |
| Industrial (retained exploration) | `/demo/wasion/styles/industrial` | `/demo/wasion/styles/industrial/search` |
| Classic | `/demo/wasion/styles/classic` | `/demo/wasion/styles/classic/search` |
| Atmospheric | `/demo/wasion/styles/atmospheric` | `/demo/wasion/styles/atmospheric/search` |
| Planhat | `/demo/wasion/styles/planhat` | `/demo/wasion/styles/planhat/search` |
| Orderful | `/demo/wasion/styles/orderful` | `/demo/wasion/styles/orderful/search` |

The design archive remains at `/demo/wasion/styles`. Each retained presentation uses explicit styled routes, metadata and login recovery paths. Industrial retains the company/resource improvements from main PR #97. Its regression suites explicitly enumerate the legacy routes and styles; the 0916 route tree has separate requirements coverage.

All presentations retain the CRM host boundary, server-owned company/project access, private/no-store responses, session revalidation and official-source AI endpoint. Canonical and styled search retain login recovery. The default switch does not change account grants or quotas.

Release uses a PR and the main-branch Vercel Git integration. Local browser evidence, deployed version/boundary checks and actual customer-account acceptance are recorded separately; loopback fixtures do not establish production sign-in or customer acceptance.
