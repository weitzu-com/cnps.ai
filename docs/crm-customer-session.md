# CRM customer sessions

Customers receive a fixed 30-day session after a successful SMS verification;
administrators and sales managers remain at eight hours. Reading any page or API
does not renew the session. This covers the CRM workspace and Wasion demo only;
the separate `/w` proposal authentication is unchanged.

## Server contract

The existing host-only `__Host-cnps_crm` cookie stays Secure and HttpOnly. Customer
sessions use SameSite=Lax for external top-level links; staff and challenge
cookies stay Strict. Redis TTL, the stored absolute expiry and the cookie's
remaining Max-Age derive from the same verification timestamp. Tokens remain
random and server-stored; they are not persisted in browser JavaScript storage.

New sessions record `issuedAt`, `roleAtVerification` and internal `authEpoch`.
`GET /api/crm?view=session` adds `authenticatedAt` and `expiresAt` in milliseconds,
but does not expose the token or epoch. A long customer session cannot acquire
staff privileges without re-verification. Existing eight-hour records retain
their original expiry and are not extended by deployment.

Memberships reload current contact/company/phone ownership on each lookup.
Authorization records default to epoch zero without a data migration. Revocation
and portal phone changes increment the epoch; restoring access retains the new
epoch, while ordinary project/document scope edits do not increment it. Both
sessions and SMS challenges bind to the authentication epoch. Verification
rechecks access around asynchronous provider, session and audit operations.
Business operations recheck the principal's epoch against their directory
snapshot. Public membership responses omit the epoch.

## Browser behavior

The login screen states the applicable duration and displays the server expiry
in Asia/Shanghai time. Allowed return targets are the current host's CRM
workspace and Wasion pages. Workspace company/project/delivery IDs and the Wasion search
query are sanitized. Absolute URLs, protocol-relative URLs, encoded paths and
unrelated routes cannot be used as return targets.

Logout requires successful server-side deletion before reporting success.
History restoration hides previous content while rechecking the session; the
demo also checks the current page with an authenticated HEAD request. Service
and network errors offer a retry rather than falsely requesting another SMS.
Clearing cookies, using another browser/device, signing out or losing
authorization ends the remembered login.

## Validation and release

Controlled-clock tests cover the 30-day boundary, no sliding renewal, legacy
eight-hour sessions, staff expiry, privilege upgrades, challenge consumption,
revocation/restoration, phone-update failures and in-flight revocation. Browser
behavior tests cover return-target validation, errors, logout and history
restoration. The existing SMS policies and proposal authentication remain in
the regression suite.

Release through a pull request merged to `main`; Vercel's Git integration
publishes production. A new preview can lack branch-specific CRM bindings and
return a private 503. Do not broaden environment access to work around that.
Real customer SMS login verification is deferred at the user's request; the
30-day expiry is verified using controlled-clock tests rather than waiting
30 days in production.
