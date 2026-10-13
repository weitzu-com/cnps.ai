# Private proposal access

`/w` is served by `api/w.js`. Anonymous users receive only the sign-in form.
The HTML, images and downloads are decrypted on the server after checking a
revocable eight-hour session and the current phone allowlist on every request.
The public repository contains only an AES-256-GCM encrypted payload; plaintext
content, the actual phone list, and secrets must never be added here or in dist.

## Configuration

Configure these server-only variables as sensitive production/preview values:

- `CNPS_PROPOSAL_SECRET`: 32 random bytes encoded as 64 hexadecimal characters;
  must match the payload encryption key.
- `CNPS_PROPOSAL_ALLOWED_PHONES`: comma-separated exact mainland phone numbers.
- `VOLC_ACCESSKEY`, `VOLC_SECRETKEY`: dedicated Volcengine IAM identity.
- `VOLC_SMS_ACCOUNT`, `VOLC_SMS_SIGN`, `VOLC_SMS_TEMPLATE_ID_VERIFY`: approved
  message group, signature and OTP template. Proposal codes use Scene
  `cnpsproposal`; CRM codes use Scene `cnpscrm`, so the pools do not authorize
  each other.
- `VOLC_SMS_TEMPLATE_ID_NOTIFY`: approved delivery-notification template, distinct
  from the OTP template. Optional `VOLC_NOTIFY_ACCESSKEY` and
  `VOLC_NOTIFY_SECRETKEY` override the main key for that send; an unset notify
  access key uses `VOLC_ACCESSKEY`, and an unset notify secret uses
  `VOLC_SECRETKEY`.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or Marketplace's
  `KV_REST_API_URL` / `KV_REST_API_TOKEN`): durable session/rate-limit storage.

The Volcengine IAM policy allows only `sms:SendSmsVerifyCode`,
`sms:CheckSmsVerifyCode` and `sms:SendSms` against `Resource: "*"` (these API
actions only support service-level permissions). Do not grant general cloud
administrator access. Verification calls `SendSmsVerifyCode` and
`CheckSmsVerifyCode`. Delivery notification calls `SendSms` and does not use
the OTP template.

## Enforced limits

- 60-second cooldown per phone; five sends per phone per China-calendar day.
- Ten sends per IP per rolling fixed one-hour window.
- Twenty sends per China-calendar day and 100 per China-calendar month in total.
- Six-digit provider-generated code, valid for five minutes; five check attempts
  per browser-bound challenge; thirty check requests per IP per ten minutes.
- Successful challenges are consumed atomically. Sessions expire in eight hours;
  logout revokes the server record. Allowlist removal is checked immediately.

Failed/unknown sends still consume the reserved website quota conservatively.
No code/phone/provider error is logged. Redis contains HMAC identifiers, random
challenge IDs, and expiring session records, never SMS codes or phone plaintext.
Send counters expire within 32 days. Volcengine and Vercel have their own service logs.

Database/provider failures fail closed. There is no production OTP bypass or
in-memory fallback. All proposal responses use no-store, noindex, a nonce CSP,
and host-only Secure/HttpOnly/SameSite cookies. The private page has no analytics.

## Maintenance

Use a trusted local workstation or private repository to maintain proposal HTML
and media. Package `{html, assets}` as JSON, encrypt with `proposal-crypto.mjs`,
and replace `private/proposal.enc`. Asset IDs are fixed safe identifiers. Keep
each decoded asset below the function response limit. The server resolves no
user-supplied filesystem paths. Do not publish a plaintext preview or payload.

Keep the payload key in a protected recovery store. Rotating it requires
re-encrypting the payload and redeployment, and invalidates existing sessions.

Validate `npm test` and `npm run build`, then stage a deployment without moving
the domain. Check anonymous/direct API/asset access, genuine SMS delivery and
sign-in, wrong code handling, logout and downloads before client distribution.
