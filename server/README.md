# AI Follow Desk server: verified sign-in

The published AI Follow Desk page can't confirm who you are on X, LinkedIn, Reddit or Instagram. This small server adds that. It uses each platform's official OAuth sign-in, so the platform itself confirms the account.

## What people see

1. On **You**, they press **Continue with X** (or LinkedIn, Reddit, Instagram).
2. The platform's own sign-in opens in a small window. They sign in there if needed and approve "AI Follow Desk", which can only read their public profile.
3. The window closes by itself. The account appears as **Verified by X**, with the name, handle and picture that X returned.

If pop-ups are blocked, sign-in continues in the same tab and returns to **You** afterwards. Cancelling, an expired attempt or a tampered request each show a clear message and nothing is saved.

## How it confirms an account

- It uses the OAuth 2.0 authorization-code flow:
  - PKCE (S256) for X;
  - OpenID Connect with a nonce and audience check for LinkedIn;
  - a random `state` value checked in constant time for every provider.
- The server swaps the one-time code for a token over HTTPS using your client secret. It then reads the profile from the provider's API: `users/me`, `userinfo` or `api/v1/me`.
- It never stores access tokens. It keeps only the verified profile (account ID, username, name, picture and when it was verified) in an AES-256-GCM encrypted, HttpOnly, SameSite=Lax cookie, which is Secure on HTTPS. Sign-ins last 30 days.
- **Disconnect** only accepts requests from the app's own origin.
- Every page is served with a strict Content Security Policy that uses per-request nonces.

## Run it

Requires Node 20 or later. There are no npm dependencies.

```bash
cp server/.env.example server/.env    # fill in the values, then:
```

```bash
set -a; . server/.env; set +a; node server/server.mjs
```

On start it prints which providers are ready and the exact callback URL to register for each one. A provider without credentials shows "isn't set up on this server yet", and users can still save an unverified username for it.

Deploy it on any Node host with HTTPS, such as Render, Fly.io, Railway or a VM behind a reverse proxy. Set `BASE_URL` to the public HTTPS address.

## Register the apps

| Platform | Where | Callback URL to register | Scope used | Things to know |
|---|---|---|---|---|
| X | developer.x.com, your app, User authentication settings: OAuth 2.0, type "Web App" | `BASE_URL/auth/x/callback` | `users.read tweet.read` | Reading `users/me` uses your X API plan. Follow actions are not used, since reports say they need the Enterprise plan. |
| LinkedIn | linkedin.com/developers: add the product "Sign In with LinkedIn using OpenID Connect" | `BASE_URL/auth/li/callback` | `openid profile` | LinkedIn returns a name and picture but no public profile URL. |
| Reddit | reddit.com/prefs/apps: create a "web app" | `BASE_URL/auth/rd/callback` | `identity` | Since November 2025, new apps need Reddit's approval under its Responsible Builder Policy. |
| Instagram | developers.facebook.com: Instagram product, "API setup with Instagram login" | `BASE_URL/auth/ig/callback` | `instagram_business_basic` | Only professional (business or creator) accounts can sign in. Accounts outside your app's roles need Meta app review. |

Check each platform's current developer docs when you register. Their endpoints, scopes and access rules change, and the provider definitions are at the top of `server.mjs`.

## Test it without real apps

```bash
node server/test/e2e.cjs /tmp
```

This starts the server against a mock provider (`server/test/mock-provider.mjs`) and drives a real browser through these cases:
- the X pop-up sign-in;
- a cancelled LinkedIn sign-in, then a successful retry;
- Reddit with pop-ups blocked (same-tab redirect);
- staying signed in after a reload;
- a forged callback being rejected;
- a cross-site Disconnect returning 403;
- Disconnect from the app;
- an unconfigured Instagram.

`OAUTH_MOCK_URL` is refused when `NODE_ENV=production`.

## Rebuild the page

```bash
./build_app.sh accounts.js feed.json
```

`fetch.py` refreshes `feed.json`, and `build_app.sh` rebuilds `index.html`, which the server serves.
