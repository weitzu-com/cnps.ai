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
