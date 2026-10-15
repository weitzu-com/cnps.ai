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
