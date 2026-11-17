# 5. Troubleshooting

Find your problem by what you see, then follow the fix.

## The app

| What you see | Why | Fix |
|---|---|---|
| The same updates every day | The feed is a snapshot from the last refresh | Refresh the data ([Configuration, section 3](02-configuration.md#3-refresh-the-updates-data)) or set up the daily job |
| My ticks, stars or theme disappeared | They're saved per browser. A different browser, a private window or cleared site data starts fresh. | Use the same browser and profile. To move to another browser, re-tick in **Follow**; the queue makes it quick. |
| The feed is empty | Filters are hiding everything | Press **Clear filters**, or check the search box |
| **Social posts** isn't in the Source filter | The extension isn't connected | See "The extension" below |
| No posts from X, LinkedIn or Instagram | Without the extension, the app never gets posts from those sites | Install the extension and browse those sites |
| Fonts look plain | Google Fonts didn't load (offline or blocked) | Nothing breaks; the app falls back to system fonts |

## Verified sign-in (server)

| What you see | Why | Fix |
|---|---|---|
| "X sign-in isn't set up on this server yet" | `X_CLIENT_ID` isn't set | Add the variables ([Configuration, section 1](02-configuration.md#1-server-settings)) and restart the server |
| The platform says the redirect or callback URL is invalid | The registered callback doesn't exactly match | Copy the URL the server prints at start-up into the platform's settings. Check `http` vs `https`, `www`, and trailing slashes. |
| "…couldn't be matched to this browser, so it wasn't accepted" | The sign-in started in another browser, or the security check failed | Start again from **You** in the same browser |
| "The X sign-in took too long…" | More than 10 minutes passed, or cookies are blocked | Start again; allow cookies for the app's site |
| "X didn't confirm your account" | The token or profile request failed: wrong secret, an app not approved yet (Reddit), or missing API access (X plan) | Check the server log line starting `[afd] x sign-in failed:` for the reason, then check the platform app's settings |
| Instagram sign-in fails for a personal account | Only business or creator accounts can sign in to outside apps | Switch the account to professional in Instagram settings, or skip Instagram |
| The sign-in window opens, but nothing happens after approving | The window lost its link to the app | Switch back to the app tab. It checks again with the server when you return. Or press **Cancel** and try again. |
| Everyone is signed out after a restart | `SESSION_SECRET` isn't set, so a random one was used | Set a fixed `SESSION_SECRET` |
| The server refuses to start: "SESSION_SECRET must be at least 32 characters" | `NODE_ENV=production` without a proper secret | Generate one with `openssl rand -hex 32` |

## The extension

| What you see | Why | Fix |
|---|---|---|
| **You** says the extension isn't installed, but it is | It isn't allowed to connect to this address | Local file: name the folder `socioAI` or `ai-follow-desk`, and switch on **Allow access to file URLs** in the extension details. Your own domain: use **Connect app**. Then reload the app. |
| Connected, but 0 posts | You haven't opened pages from listed accounts yet, or capture is switched off for that site | Use the links on **You → Posts from your browser**, and check the switches in the extension popup |
| X posts stopped arriving after a while | X changed its page layout | Update the X extractor in `extension/capture.js`, then reload the extension |
| LinkedIn posts show "seen…" instead of a date | LinkedIn only shows ages such as "3h" | Expected |
| It doesn't work inside the claude.ai preview | The preview runs in a sandboxed frame the extension can't reach | Use a local copy or the self-hosted server |

## The data refresh

| What you see | Why | Fix |
|---|---|---|
| `fetch.py` prints `FAIL … 429` for some subreddits | Reddit is rate-limiting | It retries automatically. If it still fails, run it again later. Other sources are unaffected. |
| `fetch.py` prints a list of "empty sources" | Those blogs or searches had nothing recent | Normal. Researchers who post mostly on X often have no recent news. |
| `build_app.sh: Permission denied` | The script isn't executable | Run `chmod +x build_app.sh` |
| The new account doesn't appear | The app, or the extension's list, wasn't rebuilt | Run both build commands in [Configuration, section 4](02-configuration.md#4-change-the-account-list), then reload the extension |

## Still stuck?

Run the automated tests. They check the server and the extension end to end, and print what failed:

```bash
node server/test/e2e.cjs /tmp
```

```bash
node extension/test/e2e.cjs /tmp
```
