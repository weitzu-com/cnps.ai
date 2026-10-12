# Website inquiry intake

`POST /api/crm-inquiry` receives the public website inquiry. It requires same-origin JSON, `X-CNPS-CRM: 1`, explicit consent and `consentVersion: "crm-inquiry-v1"`. It accepts `values` (name, email, optional phone, company, region, workflow, need, optional systems, consent), allowlisted tracking, page context, locale and form kind.

The handler calls `getCrmRuntime().twenty.upsertInquiryLead` with fixed server-generated UUIDs. Companies are independent **unverified leads** marked “待核验 · …”. The identity mapping uses the exact normalized submitted email and company claim, not the email domain. Inquiries never register a customer-portal company, grant membership, assign a manager, or infer company ownership. A staff member must verify and grant access separately. SMS login remains an access event only.

The six fields in the existing HubSpot configuration are retained. Optional phone and the full requirement are included in the message field; no new HubSpot property or account configuration is created. Consent allows inquiry response and customer management, with no marketing enrollment. The browser never calls the native CRM directly.

## Delivery and recovery

One atomic Upstash outbox record corresponds to an identical normalized inquiry for 30 days. Its payload is authenticated ciphertext derived from the server secret. HMAC identifiers protect IP/email quota keys. Native CRM IDs remain stable across repeated inquiries with the same email/company claim.

1. `crm-pending`: native CRM creation/recovery uses fixed IDs and verifies ownership.
2. `hubspot-ready`: CRM was confirmed; HubSpot has not yet been attempted.
3. `hubspot-sending`: saved **before** the external request. Concurrent retries do not send again.
4. `complete`: both native CRM and HubSpot confirmed; replay returns the same successful acknowledgement.
5. `uncertain`: HubSpot may have received the request, but its acknowledgement was not confirmed. The public response is `202` with `pending: true`. This state does not automatically resend or claim confirmed delivery. An operator must inspect the provider result before making a recovery decision; no public lookup exposes the record.

A definite HubSpot 400/403/404/429 response can return to `hubspot-ready`. Network errors, timeouts and ambiguous failures cannot. Native CRM failures release the retry lease and stop before HubSpot; the existing website email-draft fallback remains available. This implementation therefore requires the native CRM connection for online submission. Cross-system writes are not a shared database transaction.

Limits are atomic: 30 requests/IP/hour, 5 new delivery attempts/IP/hour, 3 attempts/email/day, 50 global/day, 1,000 global/month. Intake state expires after 30 days; this does not delete native CRM or HubSpot records. Automatic native contact retention/deletion is not implemented here.

Tests use synthetic fixtures and injected native/storage/HubSpot adapters. They do not send live inquiries, SMS messages or emails. The optional public form field is included in all three language editions, and the build copies `web/crm-inquiry.mjs` to `/assets/crm-inquiry.mjs`.

## Primary references

Selected product context is validated against the published product catalog. Its slug is retained in encrypted intake state, the canonical source URL, and the existing HubSpot message field. It neither adds an unknown HubSpot form property nor changes the company/contact deduplication IDs.

- [HubSpot Forms submission endpoint](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated)
- [HubSpot form field validation requirements](https://developers.hubspot.com/changelog/validation-change-to-the-forms-api-submission-endpoints)
