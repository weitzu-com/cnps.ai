# CRM verification SMS timeout

CRM verification uses Aliyun Dypnsapi through the installed Node SDK. Its
`httpx` transport passes `connectTimeout` to Node's request `timeout` option.
That socket inactivity timeout continues after TCP connection, so a shorter
connection setting also truncates the response window.

Keep the CRM connection and read settings at 10,000 ms. The CRM function has a
30-second execution limit, leaving time for authorization and challenge
storage. A delayed loopback response beyond five seconds exercises the real
SDK and Node timeout behavior without contacting Aliyun or sending an SMS.

Do not retry a send automatically: an interrupted response does not establish
whether the provider accepted the message. Preserve the existing cooldown,
budgets, code pools, `autoRetry: 0` and `returnVerifyCode: false`.

For an incident, correlate the private API request and fixed
`CNPS_CRM_AUTH_FAILURE` stage/category with the active deployment. A `timeout`
category alone does not distinguish TCP, TLS or response waiting. Do not log
raw SDK errors, credentials, phone numbers, verification codes or SMS content.

Server acceptance, handset delivery, code verification, and the protected
website/AI experience are separate checks. A timeout-budget fix or passing
loopback test does not establish live delivery; confirm it through one normal
user verification flow or a suitable provider receipt.

## 2026-10-15 regional connection incident

The production `sms-send` failure at 08:17:17 UTC reported
`timeout/ETIMEDOUT` despite the existing 10-second budget. Credential-free
preview probes against `https://dypnsapi.aliyuncs.com/` isolated the transport
before any SMS action, signing or phone data:

| Function region | DNS | TCP / TLS | Anonymous HTTP response |
| --- | --- | --- | --- |
| hkg1 | 16–17 ms, IPv4 | No TCP connection event | Timeout at 10,016–10,019 ms |
| sin1 | 105–107 ms | TCP 195–197 ms, TLS 288–292 ms | HTTP 400 at 376–384 ms |
| iad1 | 79–81 ms | TCP 299–309 ms, TLS 529–575 ms | HTTP 400 at 754–809 ms |

Native GET, native POST, installed `httpx` GET/POST and explicit IPv4 controls
agreed. This establishes an hkg1-to-provider TCP reachability failure at the
time of testing; it does not identify which network operator dropped traffic.
An anonymous HTTP 400 proves transport reachability, not SMS acceptance.

Pin only `api/crm.js` (SMS send, verification and authentication) to `sin1`.
Other CRM functions keep their existing regions. Challenge/session state,
authorization and atomic quotas use the same external Redis store, so no state
migration or counter reset is required. Preserve the 10-second timeout and all
existing retry/code-return controls. The new region must still complete the
normal authorized phone flow to establish provider acceptance and login.

Temporary preview probes were removed before merge. If this connection issue
recurs, use credential-free phase measurements from the deployed runtime; never
log raw SDK errors or enable `httpx` header/body debugging. Region changes ship
through a PR merged to `main`, as documented in `AGENTS.md`.
