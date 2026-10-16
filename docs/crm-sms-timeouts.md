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

## 2026-10-16 recurrence: observe the actual request

The deployment containing main `ca27e4b` still configured `api/crm.js` in
`sin1`. Existing production failures at 12:23, 12:25 and 14:13 UTC reported
`sms-send / timeout / ETIMEDOUT`. Fresh anonymous measurements at 14:21 UTC
from the prior preview's hkg1, sin1 and iad1 functions all reached an HTTP
response. These observations do not identify the phase of the production
request or prove a new regional outage. A log's ingress region must not be
substituted for the function's actual `VERCEL_REGION`.

The SMS provider call now uses `AsyncLocalStorage` and Node's
`http.client.request.created` diagnostic channel to observe only requests to
the fixed provider host. The private failure log can include bounded phase
times, actual HTTP status, socket reuse, and DNS success/failure. Missing
events remain unknown; a reused socket does not acquire fictional DNS/TCP/TLS
events. Trusted summaries are associated through a module-owned WeakMap,
never provider-supplied diagnostic fields. Listeners are removed after every
operation. No transport functions are replaced or global agent altered.
The private failure event also records `functionRegion` only when the trusted
`VERCEL_REGION` exactly matches the fixed official compute-region whitelist;
missing, unknown or malformed values are omitted. This separates actual
execution from the platform log's possible ingress-region field.

This observation changes no timeout, request, retry, quota, authorization or
public response. Node's built-in channels are experimental, so missing
observations cannot establish transport success or failure. Loopback tests
exercise real Node DNS, TCP, reuse and timeout events and the installed SDK;
they do not establish phone delivery. Only close the incident after evidence
from an actual normal verification flow, keeping provider acceptance, handset
receipt, successful verification and protected page access separate.

A temporary preview of `cef01a4` was measured at 14:39 UTC. Runtime
`VERCEL_REGION` matched each sin1/sfo1/iad1 function and Node v24.21.0. Native
and installed httpx requests received HTTP 400. An installed-SDK generic call
with `authType: Anonymous`, no credentials and a fixed nonexistent non-SMS
Action received HTTP 404 in all three regions. The observer recorded actual
DNS, TCP, TLS and response events and exactly one SDK request. This validates
the observer in the deployed runtime; it does not exercise a signed production
SMS operation or identify the earlier timeout's cause. All temporary probe
entry points and region configuration are removed from the merge candidate.
