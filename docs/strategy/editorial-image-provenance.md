# Editorial image provenance

Created: 2026-09-05

Three original images generated with the built-in `image_gen.imagegen` tool. No external reference images or third-party stock images were used. Each image was generated in a separate call and visually inspected for subject, palette, composition, and absence of text, logos, and people. No CLI/API fallback was used.

These are AI-generated conceptual editorial illustrations. They do not depict an actual CNPS customer deployment or a verified hardware SKU. Meeting and edge-compute scenes must not be used as evidence of product appearance, specifications, or customer installations. Use existing verified product photography on product pages. Suggested visible caption: **AI-generated concept image** / **AI 生成的概念配图** / **صورة تصورية مولّدة بالذكاء الاصطناعي**.

The originals remain unchanged in their default generated-image location and were copied into this project's `web/assets/editorial/originals/`. Responsive variants were encoded with Sharp 0.35.4, WebP quality 84 and effort 6, retaining the original aspect ratio with no cropping, compositing, or content edits. Render with explicit dimensions and `srcset`; lazy-load below-the-fold illustrations. Exclude `originals/` from the published asset copy if only responsive WebP variants are required.

| Image | 640w bytes | 1280w bytes | Suggested English alt |
| --- | ---: | ---: | --- |
| knowledge | 15,652 | 40,646 | Concept illustration of layered glass knowledge panels connected by cyan light |
| meeting | 23,110 | 61,382 | Concept meeting workspace with an unbranded recorder, headphones and notebook |
| edge | 27,236 | 67,536 | Concept edge-compute module on a laboratory inspection bench |

## ai-procurement-checklist (O01 CTR refresh, Oct 2026)

Grok hero and eight-step diagram, 2026-10-08. leizi Mode B PASS-with-soft and IMAGE SPOT PASS-with-soft. Concept only — not product evidence. Evidence/TCO diagram from the prior refresh was kept (third image skipped). See `docs/strategy/unique-editorial-image-provenance.md`.

## knowledge

- Original: `web/assets/editorial/originals/knowledge.png` (1536 × 1024)
- Responsive assets: `web/assets/editorial/knowledge-640.webp` (640 × 427) and `web/assets/editorial/knowledge-1280.webp` (1280 × 853)

Actual generation prompt:

```text
Use case: stylized-concept. Asset type: premium editorial landscape image for an enterprise AI knowledge website. Primary request: elegant sculptural layers of frosted glass document panels, with subtle blank inset rows suggesting structured knowledge and luminous cyan paths converging through them, suspended in a deep navy architectural space. Style: refined tactile 3D render, editorial art direction, photoreal material response, sophisticated and minimal. Composition: wide landscape 1536x1024, clear sculptural focal point, generous negative space, intentional asymmetry, close perspective emphasizing layered depth. Lighting: restrained cyan edge light, soft silver reflections, gentle atmospheric depth. Palette: navy #081B29, cyan #6CE5DF, silver #F3F7F8. No text, letters, logos, watermark, people, robots, brand marks, or claim that this is an actual customer deployment. This is an original conceptual illustration.
```

## meeting

- Original: `web/assets/editorial/originals/meeting.png` (1536 × 1024)
- Responsive assets: `web/assets/editorial/meeting-640.webp` (640 × 427) and `web/assets/editorial/meeting-1280.webp` (1280 × 853)

Actual generation prompt:

```text
Use case: photorealistic-natural. Asset type: premium editorial landscape image for a business AI meeting-workflow website. Primary request: architectural editorial close view of a contemporary international meeting workspace, tactile dark wood table, one slim neutral unbranded brushed-silver recording card, elegant unbranded over-ear headphones, a notebook with blank pages and simple pen, soft-focus windows behind. No people necessary. Composition: wide landscape 1536x1024, close camera height with carefully balanced objects, generous breathing room, cinematic but credible. Lighting: generous natural daylight and soft blue/teal reflections. Materials: tactile dark table, cool aluminum, off-white paper, soft black ear cushions. Palette: navy #081B29, subtle cyan #6CE5DF, silver #F3F7F8. Constraints: no text, no letters, no logos, no watermark, no identifiable real product or customer. Original illustrative scene, not evidence of an actual deployment. Avoid exaggerated sci-fi, neon overload, shiny plastic CGI.
```

## edge

- Original: `web/assets/editorial/originals/edge.png` (1536 × 1024)
- Responsive assets: `web/assets/editorial/edge-640.webp` (640 × 427) and `web/assets/editorial/edge-1280.webp` (1280 × 853)

Actual generation prompt:

```text
Use case: product-mockup. Asset type: premium editorial landscape image for an enterprise edge AI procurement website. Primary request: precision small aluminum edge-compute module on a spotless industrial laboratory bench, carefully machined fins and discreet ports, optical inspection equipment softly blurred in the background. Original concept illustration, NOT an actual product photograph or customer installation. Style: refined photorealistic concept render, disciplined industrial editorial art direction, credible materials, realistic scale. Composition: wide landscape 1536x1024, low close camera, focal device in foreground, orderly spacious lab composition with depth. Lighting: soft broad daylight with a restrained cyan practical light and silver highlights. Palette: dark navy #081B29, cool silver #F3F7F8, subtle cyan #6CE5DF. Materials: brushed aluminum, matte dark polymer, clean metal bench. Constraints: no people, text, letters, logos, recognizable brands, watermark or visible customer names. Avoid robots, holographic dashboards, impossible mechanics, exaggerated glowing sci-fi.
```

## ai-procurement-checklist-public-sector (Daily SEO #21)

Image-tone PASS-with-soft 2026-09-22. Concept only — not a SKU photograph, certificate, approval, or public-sector delivery. Featured still plus the five-gate inline diagram. Optional evidence/owners diagram was deferred and is not shipped. Responsive OG assets follow the 640 / 1280 WebP convention. The inline diagram lives under `web/assets/resources/`.

## ufactory-xarm-production-line-checklist (Daily SEO #19)

ChatGPT regen 2026-09-21 replacing prior remake. Concept only — not a UFACTORY SKU photograph, certificate, partnership mark, or production-line evidence. Hero still plus two method diagrams. Responsive OG assets follow the 640 / 1280 WebP convention. Inline diagrams live under `web/assets/resources/`.

## china-ai-export-playbook (REFRESH-05)

Grok + leizi PASS 2026-09-15. Concept only — not a SKU photograph, certificate, customer deployment, or performance claim. Role-card numbers 3 / 5 / 2 on the inline read-map are chapter-cluster hints, not metrics. Art was not regenerated in this wiring pass.

- Original: `web/assets/editorial/originals/china-ai-export-playbook.png` (from approved 1600×900 hero JPG)
- Responsive OG assets: `web/assets/editorial/china-ai-export-playbook-640.webp` and `web/assets/editorial/china-ai-export-playbook-1280.webp`
- Inline EN read-map: `web/assets/resources/china-ai-export-playbook-read-map.webp`


## ticnote-api-assistants, ticnote-card-lite-pods, ticnote-budget-lineup (journal mirrors, 2026-09-27)

Three original covers for the TicNote journal articles mirrored from shop.cnps.ai (`ticnote-api-skill-claude-chatgpt-gemini`, `ticnote-card-vs-lite-vs-pods`, `ai-voice-recorder-under-150-ticnote-lineup`). Generated in three separate calls with the Cursor built-in image tool during the cloud-agent PR run; no reference images, stock photography or product photos were used. Each image was visually inspected for absence of text, logos, people and recognizable products.

They are AI-generated conceptual editorial images. The recorders, earbud cases and laptop are generic unbranded props and must not be read as TicNote product photography, published dimensions, colours or performance evidence; the ruler in the flat lay carries incidental scale marks only. The three product pages keep the verified shop-derived photography for SKU claims.

Originals are 1152 × 864 PNG and were copied unchanged into `web/assets/editorial/originals/`. Responsive WebP variants were encoded with ffmpeg/libwebp at quality 84, compression level 6, after a centered 3:2 crop (1152 × 768, 48 px removed top and bottom) so they match the journal's 1280 × 853 / 640 × 427 convention used by `picture()`. No compositing or content edits.

| Image | 640w bytes | 1280w bytes | English alt (see `content/i18n/editorial-assets.json` for zh/ar) |
| --- | ---: | ---: | --- |
| ticnote-api-assistants | 23,174 | 64,638 | Concept desk with an unbranded card recorder, a laptop showing blank chat bubbles and a brass key on a notebook |
| ticnote-card-lite-pods | 26,804 | 146,346 | Concept flat lay of an unbranded card recorder, a smaller pocket recorder and an open earbud case beside a ruler and blank tags |
| ticnote-budget-lineup | 31,732 | 86,308 | Concept desk with an open notebook showing a blank pencil grid, two unbranded recorders, blank kraft tags and an earbud case set apart |

Actual generation prompts (abridged to the controlling constraints; palette and composition lines match the earlier journal covers):

```text
ticnote-api-assistants — photorealistic-natural, landscape 4:3. Dark walnut desk in soft daylight. Foreground: one slim unbranded matte-graphite card-sized recorder lying flat. Center-left: open laptop whose screen shows only abstract blurred unreadable chat-bubble shapes in grey and muted teal. Beside it a small brass key on a dark lanyard on a closed navy notebook (a credential kept like a password). No text, letters, numbers, logos, watermark, people, hands, holograms, glowing sci-fi effects or recognizable brand products. Original conceptual illustration, not a real product photo.

ticnote-card-lite-pods — photorealistic-natural, true straight-down overhead flat lay, landscape 4:3. Pale grey linen workbench. Left to right: flat card-sized unbranded recorder in matte slate grey; smaller lighter unbranded pocket recorder in matte off-white; open unbranded earbud charging case in matte navy with two open-ear earbuds. Below: brushed-steel ruler and three blank kraft tags with twine. No text, letters, numbers, logos, watermark, people, hands, screens with content, glowing effects or recognizable brand products.

ticnote-budget-lineup — photorealistic-natural, landscape 4:3. Warm oak desk, late-afternoon light. Open A5 notebook with blank cream pages and a hand-drawn empty three-column pencil grid (lines only). One slim unbranded card-sized recorder in matte gold-beige across the right page; a smaller unbranded pocket recorder in matte charcoal, a pencil and a stack of blank kraft price tags beside it. Soft-focus white earbud case set apart at the far edge (a step-up option). No text, letters, numbers, currency symbols, coins, logos, watermark, people, hands, screens, glowing effects or recognizable brand products.
```
