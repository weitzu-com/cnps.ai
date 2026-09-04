# CNPS.AI

Official website for [CNPS.AI](https://www.cnps.ai). Shop remains at [shop.cnps.ai](https://shop.cnps.ai).

## Content centers

- `/resources`: English buyer guides and the Chinese global expansion playbook.
- `/case-studies`: Evidence-labeled AI application and hardware references.
- `/solutions`: Five procurement and evaluation paths.
- `/request-quote`: Review a structured brief and open an email draft; no server submission.
- `/fastgpt/`: The separately authored FastGPT specialist center.
- `/resources/fastgpt-cnps-global-growth/`: FastGPT strategy, Markdown, PDF and revision evidence.

## Build

Use Node.js 22 or newer. Run `npm ci --ignore-scripts` then `npm run build`. The static output is `dist/`. Run `npm run serve` for a local preview.

The main build reads `content/catalog.mjs`, `content/resources/`, `docs/strategy/` and selectively merges the authored FastGPT output from `site/fastgpt`, `site/fastgpt-assets` and `site/resources/fastgpt-*`. It never merges the other center's root homepage or routing files.

The main strategy has 32 logical pages and 22 real revisions after its baseline. `docs/strategy/iterations` contains the baseline, sequential patches and a manifest with SHA-256 hashes. The source Markdown is the maintained document; the A4 PDF is an additional reading format.

## Existing product site

The original production source was not present in this repository. Existing product, policy and support routes are forwarded by `vercel.json` to the verified immutable deployment `https://cnps-2ieeg1m07-aipy.vercel.app`. Do not remove that deployment or enable protection on it until those routes have been migrated. This dependency is deliberate and must be included in future deployment reviews.

The old deployment `dpl_DDnaWFVdpc1xaUNwVmsE9G6hg9QZ` is the rollback reference for the original site. Content publishing does not require DNS changes.

## Editorial and data rules

Industry references are distinct from CNPS deliveries. Quantitative planning assumptions are labeled. Validate exact product editions, licenses, supply and support terms before quoting. Do not add customer data, tokens, environment files or full third-party research caches to the public repository. `research/raw/` is excluded.
