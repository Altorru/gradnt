# Strava backend

Strava requires a `client_secret` to turn an authorization code into tokens, and
a `client_secret` cannot ship inside a mobile app. `functions/strava-exchange`
is the whole server side: it holds that secret, performs the exchange, and
returns the normalized connection plus the tokens.

It is deliberately **stateless**. It stores nothing, needs no database, no
authentication and no user model — the mobile app keeps its own tokens in the
OS keychain via `expo-secure-store`. That is why there is no `migrations/`
directory here.

## Why there is a redirect bridge

Strava's application settings accept only a bare callback **domain** — no
scheme, no slash, no path. A native custom scheme such as
`mobile://strava/callback` therefore cannot be registered there.

So Strava redirects over https to this function, and its `GET` handler forwards
that redirect to the app's own scheme:

```
Strava  --302-->  https://<ref>.supabase.co/functions/v1/strava-exchange?code=..&state=..
                            |
                            |  GET: fixed 302, forwards the query
                            v
                  mobile://strava/callback?code=..&state=..
                            |
                            |  delivered as a deep link and rewritten by
                            |  src/app/+native-intent.tsx to /strava-callback
                            v
                  app validates state, then POSTs the code back
```

The redirect target is a hard-coded constant, never derived from the request —
only the query string is forwarded — so this cannot become an open redirect.
`state` survives the hop, so the app still validates it.

## What is already built

| Piece                      | Where                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| Redirect bridge + exchange | `functions/strava-exchange/index.ts`                                |
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

`GET` (the OAuth redirect) forwards to `mobile://strava/callback` preserving the
query. It answers `400` when neither `code` nor `error` is present.

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

- **Token refresh.** Strava access tokens expire after ~6 hours. Nothing reads
  activities yet, so there is no refresh path. Add a `strava-refresh` function
  when the first activity fetch lands.
- **Rate limiting.** The endpoint is public. The code it accepts is single-use,
  short-lived and bound to the redirect URI, so the residual risk is abuse.
- **Neither endpoint has automated tests.** Deno is not installed in this repo,
  so the function is only exercised by hand against the deployed copy.
