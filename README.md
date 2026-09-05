# CNPS.AI

Official website for [CNPS.AI](https://www.cnps.ai). Shop remains at [shop.cnps.ai](https://shop.cnps.ai).

## Three-language website

The complete website is available at `/en`, `/zh` and `/ar`. Arabic uses RTL layout. All 75 content routes have all three languages; each language also has a 404 page. Original unprefixed URLs redirect to the corresponding edition.

Products, solutions, case references, buyer guides, the journal, support/policy pages, the 32-chapter CNPS strategy and 28-chapter FastGPT playbook share one design and navigation system. Historical Markdown, PDF and revision evidence remain downloadable. `/request-quote`, `/contact` and `/fastgpt/contact` are localized inquiry forms with the existing HubSpot configuration and reviewed email fallback.

## Build

Use Node.js 22 or newer. Run `npm ci --ignore-scripts` then `npm run build`. The static output is `dist/`. Run `npm run serve` for a local preview.

The main build reads `content/catalog.mjs`, `content/resources/`, `docs/strategy/` and selectively merges the authored FastGPT output from `site/fastgpt`, `site/fastgpt-assets` and `site/resources/fastgpt-*`. It never merges the other center's root homepage or routing files.

FastGPT HubSpot configuration, field mapping, CTA attribution and verification are documented in [docs/fastgpt-hubspot.md](docs/fastgpt-hubspot.md). Run `npm test` for the submission and attribution checks. Only public form identifiers are included in the browser build; no HubSpot API token is required.

The main strategy has 32 logical pages and 22 real revisions after its baseline. `docs/strategy/iterations` contains the baseline, sequential patches and a manifest with SHA-256 hashes. The source Markdown is the maintained document; the A4 PDF is an additional reading format.

## Design and localization

`web/ui.mjs`, `web/assets/site.css` and `web/site.mjs` own the interface, behavior and localized system messages. `scripts/build-trilingual.mjs` runs after the original asset/report builders, requires complete translations and writes the final localized site. Content is maintained in `content/i18n/`. Translation counts and source parity are recorded beside the reports.

The previous public product, support and policy pages have been migrated into `content/i18n/legacy-pages.json`. New pages no longer proxy the old HTML deployment. Only legacy `/brand` and `/_next` asset URLs are retained as compatibility rewrites for historical references. Current product photography and fonts are self-hosted under `/assets`; font licenses are included.

Release architecture and validation are documented in [docs/strategy/trilingual-release-2026-09-05.md](docs/strategy/trilingual-release-2026-09-05.md). Deployment uses the existing Vercel project and needs no DNS changes.

## Journal and visual experience

`/blogs` opens the English journal; `/en/blogs`, `/zh/blogs` and `/ar/blogs` contain six original, fully translated buyer articles. Each language has an RSS feed at `/LANG/blogs/feed.xml`. Edit `content/i18n/blogs.json` to maintain posts; all three locales are required. The builder creates article metadata, navigation, related links and sitemap entries.

`web/experience.mjs` and `web/assets/experience.css` implement the workflow explorer and journal UI. `web/motion.mjs` and `web/assets/motion.css` provide optional motion with a global pause, reduced-motion support and offscreen cleanup. `scripts/editorial-components.mjs` shares visual components across page types. New conceptual illustrations use responsive WebP; originals are archived and excluded from publication.

See [release and validation](docs/strategy/journal-ui-release-2026-09-05.md), [editorial policy](docs/strategy/blog-editorial-notes.md) and [image provenance and prompts](docs/strategy/editorial-image-provenance.md).

## Editorial and data rules

Industry references are distinct from CNPS deliveries. Quantitative planning assumptions are labeled. Validate exact product editions, licenses, supply and support terms before quoting. Do not add customer data, tokens, environment files or full third-party research caches to the public repository. `research/raw/` is excluded.
