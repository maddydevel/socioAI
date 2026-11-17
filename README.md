# socioAI: AI Follow Desk

A daily AI briefing and follow tracker for the 79 accounts and 7 subreddits in *The Follow List* (AI with Divyam), across X, LinkedIn, Instagram and Reddit.

**Documentation:** start with [docs/README.md](docs/README.md). It covers [installation](docs/01-installation.md), [configuration](docs/02-configuration.md), the [user manual](docs/03-user-manual.md), [real-world scenarios](docs/04-scenarios.md) and [troubleshooting](docs/05-troubleshooting.md).

| Part | What it does | Guide |
|---|---|---|
| `index.html` (built from `app.src.html`) | The app: Today feed by category, swipeable briefing, Accounts directory, Follow sprint, You (progress, accounts, theme) | this file |
| `server/` | Optional Node server: serves the app and adds verified sign-in with X, LinkedIn, Reddit and Instagram (OAuth) | `server/README.md` |
| `extension/` | Chrome/Edge extension that saves posts from listed accounts while you browse those sites, without their APIs | `extension/README.md` |
| `fetch.py`, `build.py`, `build_app.sh` | Refresh the blog, news and Reddit snapshot and rebuild the app | below |

## Quick start

```bash
# open the app locally (no server): just open index.html in a browser
# or run the server (verified sign-in needs app keys, see server/README.md):
node server/server.mjs
```

## Refresh the data

```bash
python3 fetch.py .          # writes feed.json from official blogs, Reddit RSS and Google News
./build_app.sh accounts.js feed.json
node extension/build-accounts.mjs   # only if the account list changed
```

## Tests

```bash
node server/test/e2e.cjs /tmp       # verified sign-in against a mock provider
node extension/test/e2e.cjs /tmp    # extension capture against look-alike pages
```

Both need Playwright with Chromium installed.
