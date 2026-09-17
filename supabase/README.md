# GRADNT backend — Supabase and Strava

Strava requires a `client_secret` to turn an authorization code into tokens, and
a `client_secret` cannot ship inside a mobile app. `functions/strava-exchange`
is the whole server side: it holds that secret, performs the exchange, and
returns the normalized connection plus the tokens.

The Strava exchange and refresh functions remain **stateless**. Strava tokens
are kept in the mobile OS keychain via `expo-secure-store`.

GRADNT accounts now use Supabase Auth. `migrations/` creates private product
documents for onboarding settings and training calendars, protected by RLS.
Those documents contain no Strava API activities. Read the
[commercialisation development log](../docs/2026-09-17-developpement-commercialisation.md)
for the current product decisions and remaining work.

## Why there is a redirect bridge

Strava's application settings accept only a bare callback **domain** — no
scheme, no slash, no path. A native custom scheme such as
`gradnt://strava/callback` therefore cannot be registered there.

So Strava redirects over https to this function, and its `GET` handler forwards
that redirect to the app's own scheme:

```
Strava  --302-->  https://<ref>.supabase.co/functions/v1/strava-exchange?code=..&state=..
                            |
                            |  GET: fixed 302, forwards the query
                            v
                  gradnt://strava/callback?code=..&state=..
                            |
                            |  delivered as a deep link and rewritten by
                            |  src/app/+native-intent.tsx to /strava-callback
                            v
                  app validates state, then POSTs the code back
```

The redirect target is a hard-coded constant, never derived from the request —
only the query string is forwarded — so this cannot become an open redirect.
`state` survives the hop, so the app still validates it.

## Why `verify_jwt` is off

`supabase/config.toml` sets `verify_jwt = false` for this function. That is
deliberate, not an oversight: Edge Functions verify a JWT by default, and this
one is called by a native app that holds no Supabase session, so every request
would be rejected with `UNAUTHORIZED_NO_AUTH_HEADER` before reaching the code.

The function stores nothing and needs no user identity, which is what makes the
trade acceptable. Re-enabling it without adding auth would break the whole flow.

## Scopes are parsed with either delimiter

Strava documents scopes as "a comma- or URL-safe space-delimited string", and
**the two endpoints disagree in practice**: the redirect callback sends commas,
the token response sends spaces. Splitting on only one of them silently yields
an empty scope list, which surfaces as "insufficient authorisations" for scopes
the rider did grant.

Both sides therefore split on `/[\s,]+/` — here and in
`apps/mobile/src/services/strava/oauth/strava-callback.ts`.

## What is already built

| Piece                      | Where                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| Redirect bridge + exchange | `functions/strava-exchange/index.ts`                                |
| Token refresh              | `functions/strava-refresh/index.ts`                                 |
| Browser + redirect flow    | `apps/mobile/src/services/strava/oauth/strava-connect.ts`           |
| Mobile HTTP broker         | `apps/mobile/src/services/strava/oauth/strava-token-broker.http.ts` |
| Token storage              | `apps/mobile/src/services/strava/oauth/strava-token.persistence.ts` |

## Setup

### 1. Deploy the function

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase functions deploy strava-exchange
```

Note the deployed URL: `https://<project-ref>.supabase.co/functions/v1/strava-exchange`.

### 2. Register the Strava application

At <https://www.strava.com/settings/api>:

- **Authorization Callback Domain**: `<project-ref>.supabase.co` — the bare
  domain only, matching the deployed function's host.
- Note the **Client ID** and **Client Secret**.

Confirmed against a live project: requesting the authorize endpoint with the
deployed function URL as `redirect_uri` returns a 302 to `/login`. An invalid
`redirect_uri` is rejected with an error page that names it instead.

### 3. Set the secrets

```bash
npx supabase secrets set \
  STRAVA_CLIENT_ID=<client-id> \
  STRAVA_CLIENT_SECRET=<client-secret>
```

### 4. Configure the mobile app

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in both values.
Until they are present the Strava onboarding screen reports `not_configured`
instead of failing.

## Request / response contract

`GET` (the OAuth redirect) forwards to `gradnt://strava/callback` preserving the
query. It answers `400` when neither `code` nor `error` is present.

`POST /strava-refresh` with `{ "refreshToken": "..." }` returns the same
`tokens` shape:

```json
{
  "grantedScopes": ["profile:read_all", "activity:read_all"],
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": "2026-09-15T12:00:00.000Z"
  }
}
```

**Strava rotates the refresh token on every refresh**: the one sent is already
spent, so the caller must persist what comes back before using the access token.
A lost response is therefore unrecoverable rather than retryable, which is why a
dead refresh token is answered `401 refresh_rejected` — distinctly from a
transient `502` — so the client can clear its session and ask the rider to
authorize again.

Errors: `missing_refresh_token` 400, `not_configured` 500, `strava_unreachable`
502, `strava_unexpected_response` 502, `refresh_rejected` 401.

`POST` with `{ "code": "<authorization code>" }`:

```json
{
  "athleteId": "12345678",
  "displayName": "Jane Doe",
  "grantedScopes": ["profile:read_all", "activity:read_all"],
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": "2026-09-15T12:00:00.000Z"
  }
}
```

Errors are `{ "error": "<code>" }` with a non-2xx status: `missing_code`,
`not_configured`, `strava_exchange_failed`, `strava_unreachable`,
`strava_unexpected_response`. Strava's own error body is never forwarded,
because it can echo the submitted credentials back.

## Not done yet

- **Rate limiting.** Both endpoints are public. The code the exchange accepts is
  single-use, short-lived and bound to the redirect URI, so the residual risk is
  abuse.
- **The refresh path has only been exercised against a rejected token.** A bogus
  refresh token returns `401 refresh_rejected`, which proves the wiring reaches
  Strava, but token _rotation_ needs a real connection to confirm.
- **Neither function has automated tests.** Deno is not installed in this repo,
  so they are only exercised by hand against the deployed copy.

## Private accounts and calendars

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in
`apps/mobile/.env.local`. Use a `sb_publishable_` key, never a secret/service-role
key. The account screen supports email/password sign-up, email confirmation
and sign-in. Google and password recovery remain launch prerequisites.

Authenticated riders store settings and calendar history in their own
`user_documents` rows. There is no silent local fallback on cloud failure.
Writes use an expected revision through `save_user_document`: a stale device
must reload rather than overwrite another device. Without a GRADNT account,
settings remain local and calendars use SQLite on native platforms.

Importing settings into a new account requires an explicit action. Existing
local calendars are preserved on the device; the first cloud calendar is new.
Strava must be connected again for that account/device. Cloud workspace data
is not written into the unowned local workspace when signing out.

A new native build is necessary to include `expo-sqlite`. Test on both iOS and
Android before distribution. Configure authentication email delivery and
confirmation URLs for the target environment; avoid relying on the default
email service for a public launch.

Local verification (no remote test accounts or emails):

```sh
supabase start
supabase test db
node infra/scripts/test-private-workspace.mjs
```

The API smoke test refuses remote endpoints, creates two confirmed temporary
users, verifies isolation and stale-write protection, then deletes them.
