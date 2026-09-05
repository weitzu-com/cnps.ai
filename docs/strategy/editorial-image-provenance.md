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

