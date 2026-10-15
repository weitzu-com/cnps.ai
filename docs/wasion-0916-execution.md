# 0916 client design execution

This change implements the client PDF and the 2026-10-15 requirements deck. The customer's design direction is already clear. It is not another style selection exercise.

## Scope and fixed decisions

- Audience: international utility procurement, engineers, commercial/industrial users and partners; secondary paths for employees, media and investors.
- Language: English demo, matching the existing approved delivery language. Chinese and regional websites remain clearly labelled official external destinations. No invented translated content.
- Domain: replace the authenticated demo at `https://crm.cnps.ai/demo/wasion`; do not move the actual Wasion corporate website or change its domain.
- Stack: the existing Node ESM renderer and authenticated API; a new independent `server/wasion-requirements/` renderer, CSS, content modules and client interactions. Reuse source data and the verified search service, not the previous shell, home or page layouts.
- Deploy: isolated `codex/wasion-0916-rebuild` worktree from `744ab9a`; PR preview, merge to main and Git-integrated Vercel deployment. Existing worktrees and changes stay untouched.
- Security: keep phone/session verification, server project/company ACL, private cache, noindex, nonce CSP and pre/post-search identity validation.
- Demo scope: implement the original visible page structures and interactions, using official factual content. Missing product specification/certification/file evidence must be visible as an actionable content gap. CMS, live sales/CRM routing, translation volume and commercial hosting changes in the deck's implementation appendix are separate production deliverables; do not claim they are already delivered by a visual demo.

## Visual contract

- Midnight grid `#001e45`, engineering blue `#07529a`, blue surface `#082e59`, paper `#f1f5f7`, white `#f5f9fc`, mint `#a5e8cf` as a restrained highlight.
- Display: locally hosted Space Grotesk; body: locally hosted Manrope; readable tables and utility text. Distinctive industrial typography, without the previous beige/black editorial treatment.
- Grid: fluid 86rem maximum, broad industrial photography, deliberate section rhythm, restrained 0.25rem corners and consistent line icons.
- Brand signature: W-derived negative-space framing using the real brand asset; not another brand's symbol, generic gradients or decorative labels.
- Motion: controlled image/banner carousels, meaningful diagram nodes and map selection, progressive content revelation, visible focus and reduced-motion support.

## Layout execution

1. Home: Hero carousel → R&D-priority factual metrics → four challenges → four business areas plus end-to-end lifecycle → What's new → CTA/footer.
2. Revenue challenge: the original five-part hierarchy. Other three challenges receive genuinely distinct structures for network resilience, energy flexibility and water/gas lifecycle; these authored structures fulfil the instruction not to reuse the revenue template.
3. Solutions: Hero → Your challenge → Our approach interactive architecture → Features → Case studies → Next Gen AMI where applicable → Related products → CTA/footer.
4. Only electricity metering receives the six-part theme page. Other business areas start at vertical filtered product lists. Product details retain all eight required module responsibilities.
5. Company, news, media, events and resources follow the explicit page-specific PDF order. Newsroom stays a compact heading and filtered list; partners use three wide rows; case studies use a filtered grid.

## Reusable manuals checked

- 原点 skill and KB lifecycle manual: separate source facts, design execution, implementation and acceptance evidence.
- Frontend Design: subject-specific visual plan and screenshot critique; the customer's explicit brief overrides stylistic defaults.
- Frontend Responsive Design Standards: mobile-first, fluid layout, touch/keyboard controls, reduced motion and breakpoint inspection.
- Existing Wasion source corpus, search citations, session notice and isolated loopback fixtures are reusable infrastructure.
- `cnps.ae`, `leisa.com`, `laotzu.ai` are reusable capability references; their layouts are not transplanted into this client design.

## Evidence

Source: user-provided 34-page PDF, 62-page requirements deck / 173 grouped records, and the original client's feedback. Full layout contract is stored with the deliverable evidence. QA will map each route, module order, screenshot and interaction to the source page, rather than inferring acceptance from page count or build status.

## 2026-10-16 refinement and acceptance

- The approved review scope is English pages plus English/Chinese AI search. The production website, CMS, complete translated pages, live inquiry processing and the PDF p34 hosting/backup/three-year charges remain separately identified delivery items.
- Classify all 86 local products and the 39 specified leaf families by explicit stable IDs and source evidence. Do not infer a family from a term found elsewhere in the product description. Unsupported families retain a precise information request; officially verified external models may be shown in the existing family page without claiming a new local detail page.
- Solution/product/case links must identify their evidence level. An official related-product module supports a published recommendation, not proof of integration or project deployment. A case without model-level evidence must not be propagated to every product in the same solution.
- Requirements search uses the same exact-model and bilingual-intent ranker in the server response and browser fallback; retained designs preserve their previous ranking and 65-source catalog. Missing certification evidence and unknown model names remain unknown.
- The original register groups 83 source records, four optional-labelled records and 86 implementation additions; mixed clauses must be calibrated against the PDF rather than counted as wholly optional. In particular, PDF p5 requires a W-derived identity direction, while loading and 2.5D are optional expressions. The hero now masks the original logo asset to its 511-by-306 W-symbol region, without changing the supplied logo file. A successful page or an actionable document request is not proof that a missing manual/certificate has been delivered.
- Target 459 independent page/viewport checks: 198 routes at 1440 and 375, plus 21 representatives at 414/768/1024. Capture the 21 representative pages at all five widths and retain the matching PDF page references. Check text clipping and unclipped elements as well as body width, image loading, module order and runtime errors.
- Keep loopback browser fixtures, deterministic 86-model/12-question retrieval evidence, actual authenticated production browsing and actual model-generated answers separate. Never inject sessions or AI replies into production. Bind final live evidence to the deployed Git SHA and deployment, checking the custom-domain alias before and after the run.
- Production publication remains one reviewed PR merge to main followed by the existing Git integration. A preview approval for an earlier head does not approve subsequent changes.

- Final source refinements: the two externally referenced aMeter100-DT / DTIN PNGs are mirrored byte-for-byte from their verified official URLs, with SHA-256 recorded in official-evidence.json. Every broken image, including an external one, fails browser QA. Certificate-intent search requires actual code evidence and the requested product scope; communication DL/UL and storage UL claims cannot answer an electricity-meter certification request.
