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
- `ALIYUN_ACCESS_KEY_ID`, `ALIYUN_ACCESS_KEY_SECRET`: dedicated RAM identity.
- `ALIYUN_SMS_SIGN_NAME`, `ALIYUN_SMS_TEMPLATE_CODE`: approved PNVS system pair.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or Marketplace's
  `KV_REST_API_URL` / `KV_REST_API_TOKEN`): durable session/rate-limit storage.

The Aliyun PNVS policy allows only `dypns:SendSmsVerifyCode` and
`dypns:CheckSmsVerifyCode` against `Resource: "*"` (these API actions only support
service-level permissions). Do not grant general cloud administrator access.
This integration is Dypnsapi, not the separate Dysmsapi product.

## Enforced limits

- 60-second cooldown per phone; twenty sends per phone per China-calendar day,
  shared by proposal access and CRM through `sms-policy.mjs`.
- Ten sends per IP per rolling fixed one-hour window.
- 200 sends per China-calendar day and 3,000 per China-calendar month in total.
  CRM login, proposal login and Aliyun delivery notifications all use these same
  durable counters and shared policy constants. Existing counts are preserved.
- Six-digit provider-generated code, valid for five minutes; five check attempts
  per browser-bound challenge; thirty check requests per IP per ten minutes.
- Successful challenges are consumed atomically. Sessions expire in eight hours;
  logout revokes the server record. Allowlist removal is checked immediately.

Failed/unknown sends still consume the reserved website quota conservatively.
No code/phone/provider error is logged. Redis contains HMAC identifiers, random
challenge IDs, and expiring session records, never SMS codes or phone plaintext.
Send counters expire within 32 days. Aliyun and Vercel have their own service logs.
CRM failures record only a fixed internal stage (for example `sms-verify` or
`storage`), so service outages can be located without retaining provider error
messages, credentials, challenges, phone numbers or verification codes.

Volcengine delivery notifications use the same daily/monthly policy ceilings,
but retain separate segment-weighted provider counters. Company delivery
notifications also retain their independent 100-request monthly allowance;
this company-level guard does not limit login verification.

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
