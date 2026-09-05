# FastGPT pilot inquiries

`/fastgpt/contact/` submits to the existing CNPS HubSpot contact form. It preserves the seven original fields, the non-confidential-data notice, privacy policy link and the explicit statement that an inquiry does not subscribe a visitor to marketing. A required, unchecked consent box covers HubSpot storage and processing for this inquiry. Preparing an email locally does not require HubSpot consent.

## Public form configuration

The maintained public configuration is `content/integrations/fastgpt-hubspot.json`:

- Portal: `25732190`
- Form: `d4c5da57-db3b-46a4-8829-7ca5d334a1a4`
- Region: `eu1` (the public submissions endpoint supports this portal)
- Source: [CNPS contact page](https://www.cnps.com/contact-us/)
- [Public form definition](https://forms-eu1.hsforms.com/embed/v3/form/25732190/d4c5da57-db3b-46a4-8829-7ca5d334a1a4?callback=cnpsConfig)

The published form was read on September 5, 2026 UTC. Its required fields are `firstname`, `email`, `subject` and `message`. `company` and `country` are optional text fields on HubSpot and remain required in the FastGPT UI. CAPTCHA is disabled on this existing form. No form settings, contacts, automation rules or subscriptions were modified. Form-level HubSpot permissions currently require connector reauthorization; the public definition was sufficient to verify these fields.

| Website field | HubSpot contact field |
| --- | --- |
| Your name | `firstname` (the complete supplied name) |
| Work email | `email` |
| Company | `company` |
| Country / region | `country` |
| Workflow | Included in `message` |
| What would you like to improve? | Included in `message` |
| Current systems and preferred timeline | Included in `message` |
| Inquiry subject | `subject`, generated as “FastGPT pilot inquiry — {company}” |
| CTA attribution / processing acknowledgment | Included in `message` |

The complete brief is saved in `message`, including a second readable copy of contact details. Attribution is also supplied in `context.pageUri`; arbitrary URL query values and fragments are removed first. No undeclared CRM properties are sent. There are no custom attribution properties or new HubSpot reporting dashboards in this change.

The [public Forms API](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated) accepts CORS JSON POST requests at `https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}` without an API token. A read-only OPTIONS request for the configured endpoint returned HTTP 204 and allowed the `https://www.cnps.ai` origin and `content-type` header. Submitted fields must be present in the form definition: [HubSpot field validation rules](https://developers.hubspot.com/changelog/amendment-to-forms-api-submission-validation).

`legalConsentOptions.consent` contains the displayed processing-consent text and an empty communications list. It never selects a marketing subscription. Browser cookies, `hutk`, IP-address fields and API credentials are not included. No contact details are written to browser storage or application logs.

## Submission and fallback behavior

The browser validates the required inputs, then locks the form for a single pending request. Only an HTTP success response displays the submitted confirmation. The submit button remains disabled after success until the inputs change. External response HTML and redirect URLs are ignored.

An HTTP error, network failure, 12-second timeout, or unavailable configuration preserves the details and opens a reviewable email brief with the existing mailto, copy and text-download controls. Network/timeout failures say that submission was **not confirmed**, since HubSpot might already have received the request. No fallback email is automatically sent. A visitor can also choose “Prepare email instead” without trying HubSpot. With JavaScript disabled, direct email remains available and the form stays disabled.

## CTA attribution

`scripts/lib/fastgpt-attribution.mjs` runs after the two content centers are merged. All FastGPT page links and buttons receive stable `data-cta-source` / `data-cta-content` identifiers. Links into FastGPT from the main center receive identifiers too. Internal links into FastGPT and its resources add `source`, `content`, `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`, preserving workflow/case selectors and URL fragments. Source citations keep their original external URLs. Pure on-page anchors retain their fragment targets.

`site/fastgpt-assets/attribution.js` preserves an inbound campaign's UTM values across the specialist center, bilingual/Chinese reports and internal navigation. `source` and `content` record the latest CTA independently from campaign `utm_content`. Without an inbound campaign, defaults are `cnps.ai` / `website` / `fastgpt`. The contact form reads `window.cnpsFastgptAttribution.getTracking()` and places attribution in both the HubSpot message and email fallback. Only bounded identifier strings are accepted. Campaign-only session storage expires after 30 minutes of inactivity; URL propagation continues when storage is blocked. No analytics vendor or page-view tracking service is added.

## Build and local verification

1. `npm run build` produces the merged static site, attributed CTAs and `dist/fastgpt-assets/hubspot-config.json`.
2. `npm test` checks field preservation, consent, HTTP/network/timeout behavior, configuration safety, campaign propagation, blocked storage and stable/idempotent CTA identifiers.
3. `npm run serve` previews at `http://127.0.0.1:4173`. The preview serves JavaScript modules and CSS with their correct MIME types.

When changing the authored FastGPT templates in `scripts/build-site.py`, regenerate them with `python3 scripts/build-site.py` before the normal Node build. The tracked `site/fastgpt/` output remains the source consumed by that build.

Optional `HUBSPOT_PORTAL_ID` and `HUBSPOT_FORM_ID` environment variables override the saved public IDs; local `.env.local` is supported. Existing process variables take precedence. Only explicitly selected public fields are serialized. A malformed nonempty configuration fails the build. An empty form ID uses the email fallback; set `FASTGPT_REQUIRE_HUBSPOT=1` to require a valid configured form during a production build. Update the field mapping only after checking the target form's declared fields.

Validation uses intercepted browser POST requests and Node fetch stubs, plus the read-only public-definition and CORS checks. It does not create test CRM contacts or claim a live lead was delivered. Deployment is outside this local-build change.
