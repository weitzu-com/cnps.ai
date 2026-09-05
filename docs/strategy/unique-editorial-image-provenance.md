# Unique editorial cover provenance

Created: 2026-09-05

Three new original covers were generated in three separate calls using the built-in `image_gen.imagegen` tool, following the imagegen skill. No reference images, stock photography or CLI/API fallback were used. These assets deliberately vary subject, viewpoint, materials, and palette to replace repeated editorial images with recognizable article identities.

All three outputs were visually inspected. They are **AI-generated conceptual editorial images**, not photographs of verified CNPS products, customer deployments, actual testing or shipments. Keep the existing visible concept caption localized: **AI-generated concept image** / **AI 生成的概念配图** / **صورة تصورية مولّدة بالذكاء الاصطناعي**. Use verified product photos for actual SKU claims.

The originals remain at the built-in default location `/Users/iweibing/.codex/generated_images/01a0710f-dbdc-7830-8f59-5790c08f3b89/` and were copied unchanged into `web/assets/editorial/originals/`. Originals are 1536 × 1024. Responsive WebP files were encoded with Sharp 0.35.4 at quality 84, effort 6, preserving the entire image and aspect ratio with no crop, compositing or content edits. Variants are 640 × 427 and 1280 × 853. Publish only responsive variants; retain originals in the source archive.

| Image | 640w bytes | 1280w bytes |
| --- | ---: | ---: |
| field-glasses | 33,468 | 100,884 |
| prototype-bench | 21,696 | 114,292 |
| rfq-desk | 32,082 | 90,720 |

## field-glasses

- Original: `web/assets/editorial/originals/field-glasses.png`
- Built-in output filename: `exec-9783019f-968b-4c52-b405-8df216606538.png`
- Responsive assets: `web/assets/editorial/field-glasses-640.webp` and `web/assets/editorial/field-glasses-1280.webp`
- Suggested English alt: Concept close-up of hands inspecting unbranded smart glasses beside an olive field notebook
- Suggested Chinese alt: 双手在橄榄绿现场笔记本旁检查无品牌智能眼镜的概念近景
- Suggested Arabic alt: لقطة تصورية مقرّبة ليدين تفحصان نظارة ذكية بلا علامة تجارية بجانب دفتر ميداني أخضر زيتوني
- Visual review: Close-up glasses and naturally positioned hands are clear; olive notebook and tactile slate create a distinct field-evaluation identity. No heads, logos, text or customer context.

Actual generation prompt:

```text
Use case: photorealistic-natural
Asset type: Premium editorial cover for a B2B AI hardware procurement article, landscape 1536x1024.
Primary request: A beautifully art-directed close side-profile view of generic unbranded smart glasses being gently inspected by two adult hands beside a field notebook on a textured stone workbench. This is an illustrative concept, not an existing commercial product or customer testimonial.
Scene/backdrop: Quiet daylight workbench with tactile olive field notebook, blank off-white pages, a graphite pencil, and a naturally textured dark slate surface. No room architecture, no screens.
Subject: One pair of subtly technological matte black smart glasses with plausible understated design and clear lenses, supported lightly in naturally posed hands, their folded temples and lens edges catching the light. No head or face visible.
Style/medium: Refined authentic editorial still-life photography, realistic material textures, macro detail, calm intentional composition, restrained natural photographic finish.
Composition/framing: Landscape 3:2, close oblique eye-level macro profile, glasses occupy the center-right, notebooks softly recede to the left, readable silhouette with generous breathing room. Shallow but sufficient depth of field to show full glasses shape.
Lighting/mood: Soft directional daylight from left, subtle long shadows, confident and thoughtful.
Color palette: Olive, slate, muted charcoal, warm ivory; avoid electric blue and cyan.
Constraints: No logos, no watermarks, no visible readable text, no people beyond the hands, no holograms, no glass document panels, no meeting rooms, no industrial inspection machines. No exaggerated futuristic claims.
```

## prototype-bench

- Original: `web/assets/editorial/originals/prototype-bench.png`
- Built-in output filename: `exec-14bc02a4-2a50-4a1e-b063-230353ae484a.png`
- Responsive assets: `web/assets/editorial/prototype-bench-640.webp` and `web/assets/editorial/prototype-bench-1280.webp`
- Suggested English alt: Concept overhead engineering bench with a circuit board, disconnected connectors, caliper and blank evaluation cards
- Suggested Chinese alt: 电路板、未连接接头、游标卡尺和空白评估卡组成的工程工作台俯视概念图
- Suggested Arabic alt: مشهد تصوري علوي لطاولة هندسية تضم لوحة إلكترونية وموصلات مفصولة وقدمة قياس وبطاقات تقييم فارغة
- Visual review: True overhead composition, disconnected components, blank checkbox cards and an orange mat distinguish this cover from both field and procurement scenes. Caliper has incidental conventional scale marks; these are not performance or product claims. No logos or readable editorial copy.

Actual generation prompt:

```text
Use case: photorealistic-natural
Asset type: Premium editorial cover for a B2B AI hardware prototype evaluation article, landscape 1536x1024.
Primary request: A carefully composed overhead engineering bench flatlay showing the physical work of evaluating a generic unbranded prototype. This is an illustrative concept, not evidence of an actual product, test or customer.
Scene/backdrop: Brushed silver aluminum work surface, a muted burnt-orange rectangular anti-static mat offset toward the right, clean practical objects with real surface texture.
Subject: One small generic microcontroller PCB on the orange mat, three neatly separated disconnected cable connectors, a realistic precision metal caliper laid diagonally, and two small blank cream evaluation cards with a few faint nontext tick boxes. Keep plausible component scale and avoid overly complicated electronics.
Style/medium: Refined contemporary editorial still-life photography, authentic engineering craftsmanship, restrained premium art direction, crisp natural photographic detail.
Composition/framing: True straight-down overhead camera, landscape 3:2. Asymmetric organized flatlay with generous clear silver space toward the left. No perspective room view. Each object clearly separate and easily recognized even on a small card.
Lighting/mood: Soft daylight from upper left, crisp gentle shadows, clean and purposeful.
Color palette: Brushed silver aluminum, muted burnt orange, graphite, off-white, small green circuit board; no blue neon.
Constraints: No logos, no watermarks, no readable text, no hands, no people, no holograms, no glass document panels, no meeting rooms, no large industrial machines, no fake product performance claims. Cards must be blank apart from simple abstract nontext checkbox marks; no numbers on electronics.
```

## rfq-desk

- Original: `web/assets/editorial/originals/rfq-desk.png`
- Built-in output filename: `exec-8aea6b13-4dc2-4131-ba0e-f2d6b5a1c89e.png`
- Responsive assets: `web/assets/editorial/rfq-desk-640.webp` and `web/assets/editorial/rfq-desk-1280.webp`
- Suggested English alt: Concept procurement desk with a sample box, blank requirements sheets, material swatches and empty tags
- Suggested Chinese alt: 样品盒、空白需求表、材料样片和无字标签组成的采购桌面概念图
- Suggested Arabic alt: مشهد تصوري لمكتب مشتريات يضم صندوق عيّنة وأوراق متطلبات فارغة وقصاصات مواد وبطاقات بلا كتابة
- Visual review: Warm low-angle composition and tactile kraft, paper, navy fabric and material samples give the RFQ article its own recognizable procurement identity. No people, logos, shipping addresses or readable text.

Actual generation prompt:

```text
Use case: photorealistic-natural
Asset type: Premium editorial cover for a B2B AI procurement request-for-quotation guide, landscape 1536x1024.
Primary request: A beautifully composed quiet procurement desk still life about turning a requirements brief into an evaluation sample, shown through tactile physical objects. This is an illustrative editorial concept, not an actual shipment or customer project.
Scene/backdrop: Warm parchment-toned desk with a deep ink-navy notebook underneath several plain ivory requirements sheets. An open small unbranded kraft shipping sample box with tissue paper sits toward the rear. No screen and no room interior.
Subject: Plain paper requirements sheets in the foreground, one elegant simple navy pen, three small neutral material swatches (brushed metal, graphite polymer and light textile), and two blank ivory tags with fine cotton string. The sample box is empty apart from protective tissue and a neutral rectangular unbranded sample component. Every object has a deliberate place.
Style/medium: Refined contemporary editorial still-life photography, authentic cardboard fibers, paper texture and soft textile, warm premium design-magazine aesthetic.
Composition/framing: Landscape 3:2, low three-quarter side angle with the paper foreground leading diagonally toward the box; quiet spacious composition with organized layers and recognizable silhouettes; medium depth of field.
Lighting/mood: Warm soft afternoon window light, elongated delicate shadows, thoughtful calm precision.
Color palette: Warm parchment, ivory, kraft, ink navy, small natural silver accent; avoid orange mat, olive field equipment and electric-blue lighting.
Constraints: No readable text, no logos, no watermark, no people or hands, no address labels, no customer identity, no holograms, no glass document panels, no meeting room, no industrial machinery. Requirements sheets have faint simple rules and empty checkboxes only.
```

