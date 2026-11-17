# 5. Troubleshooting

Find your problem by what you see, then follow the fix.

## Installing the add-on

| What you see | Why | Fix |
|---|---|---|
| "Manifest file is missing or unreadable" after **Load unpacked** | You selected the outer folder. Windows often extracts into a folder inside a folder. | Open the folder and select the **AI-Follow-Desk** folder inside, the one that contains `manifest.json` |
| There's no **Load unpacked** button | Developer mode is off | Turn on **Developer mode** at the top right of `chrome://extensions` |
| The download link says "Not Found" | No release has been published yet | Ask whoever shared the app for the `AI-Follow-Desk.zip` file. Maintainers: see [Configuration, section 8](02-configuration.md#8-release-a-new-version). |
| Chrome shows a note about developer-mode extensions | Chrome shows it for anything not installed from the Chrome Web Store | Close it and carry on. It goes away once the add-on is on the Chrome Web Store. |
| My work laptop won't allow Developer mode | Your organisation blocks it | Ask IT to allow the add-on, or use your team's web app if there is one ([Installation, Part C](01-installation.md#part-c-run-the-server-for-verified-sign-in)) |
| I can't find the app after closing its tab | The icon is hidden | Click the puzzle-piece icon at the top right of Chrome, then pin **AI Follow Desk** |
| My follows and settings disappeared after an update | The new version was loaded from a different folder, so Chrome treats it as a new add-on | Remove the new one and load the original folder again. Next time, copy new files into the existing folder. |

## Using the app

| What you see | Why | Fix |
|---|---|---|
| "Couldn't update. Check your internet connection…" (add-on) | No internet, or the news sites didn't answer | Check your connection and press **Update now**. Your current stories stay meanwhile. |
| The same stories as yesterday (add-on) | It updates when you open it and the stories are over 12 hours old | Press **Update now** |
| The same stories every day (web app) | The web app's feed is a snapshot | Refresh it ([Configuration, section 3](02-configuration.md#3-refresh-the-web-apps-updates)), or set up the daily job |
| My ticks, stars or theme disappeared | They're saved per browser. A different browser or Chrome profile, a private window, or cleared site data starts fresh. | Use the same browser and profile. To move to another browser, re-tick in **Follow**; the queue makes it quick. |
| The feed is empty | Filters are hiding everything | Press **Clear filters**, or empty the search box |
| Fonts look plain | Google Fonts didn't load (offline or blocked) | Nothing breaks; the app falls back to system fonts |

## Posts from X, LinkedIn, Instagram and Reddit

| What you see | Why | Fix |
|---|---|---|
| No social posts at all | You haven't opened pages from listed accounts yet, or a site's switch is off | Use the quick links under **You → Posts from your browser**, and check each site's switch is on |
| Posts from a site stopped arriving after a while | The site changed its page layout | Maintainers: update that site's extractor in `extension/capture.js`, rebuild, and release |
| LinkedIn posts say "seen…" instead of a date | LinkedIn only shows ages, such as "3h" | Expected |
| Instagram posts have no date | Instagram's grid doesn't show dates | Expected |
| (Web app) **Social posts** isn't in the Source filter | The add-on isn't installed, or isn't allowed to connect to this address | Local file: name the folder `socioAI` or `ai-follow-desk`, and switch on **Allow access to file URLs** in the add-on's details. Your own domain: use **Connect app** ([Installation, Part D](01-installation.md#part-d-connect-the-add-on-to-your-web-app)). Then reload. |
| (Web app) It doesn't work inside the claude.ai preview | The preview runs in a sandboxed frame the add-on can't reach | Use the add-on itself, a local copy, or the server |

## Verified sign-in (web app with the server)

| What you see | Why | Fix |
|---|---|---|
| "X sign-in isn't set up on this server yet" | `X_CLIENT_ID` isn't set | Add the variables ([Configuration, section 1](02-configuration.md#1-server-settings)) and restart the server |
| The platform says the redirect or callback URL is invalid | The registered callback doesn't exactly match | Copy the URL the server prints at start-up into the platform's settings. Check `http` vs `https`, `www`, and trailing slashes. |
| "…couldn't be matched to this browser, so it wasn't accepted" | The sign-in started in another browser, or the security check failed | Start again from **You** in the same browser |
| "The X sign-in took too long…" | More than 10 minutes passed, or cookies are blocked | Start again, and allow cookies for the app's site |
| "X didn't confirm your account" | The token or profile request failed: a wrong secret, an app not yet approved (Reddit), or missing API access (X plan) | Check the server log line starting `[afd] x sign-in failed:` for the reason, then check the platform app's settings |
| Instagram sign-in fails for a personal account | Only business or creator accounts can sign in to outside apps | Switch the account to professional in Instagram, or skip Instagram |
| The sign-in window opens, but nothing happens after approving | The window lost its link to the app | Switch back to the app tab; it checks with the server when you return. Or press **Cancel** and try again. |
| Everyone is signed out after a restart | `SESSION_SECRET` isn't set, so a random one was used | Set a fixed `SESSION_SECRET` |
| The server won't start: "SESSION_SECRET must be at least 32 characters" | `NODE_ENV=production` without a proper secret | Generate one with `openssl rand -hex 32` |
| The add-on doesn't show "Verified by X" | Verified sign-in needs the server; the add-on saves usernames unverified | Expected. Use the web app with the server for verified sign-in. |

## Building and refreshing (maintainers)

| What you see | Why | Fix |
|---|---|---|
| `fetch.py` prints `FAIL … 429` for some subreddits | Reddit is rate-limiting | It retries automatically. If it still fails, run it again later; other sources are unaffected. |
| `fetch.py` lists "empty sources" | Those blogs or searches had nothing recent | Normal. Researchers who post mostly on X often have no recent news. |
| `Permission denied` running a `.sh` script | The script isn't executable | Run `chmod +x build_app.sh build_extension.sh` |
| A new account doesn't appear | The editions weren't rebuilt | Run `./build_extension.sh` and `./build_app.sh accounts.js feed.json`, then reload the add-on |
| A new blog's stories never appear in the add-on | The site isn't in the add-on's permissions | Run `./build_extension.sh`, which updates them, then reload the add-on. Check the feed address still returns RSS (feeds sometimes move or close). |

## Still stuck?

Run the automated tests. They check everything end to end and print what failed:

```bash
node extension/test/app-e2e.cjs /tmp
```

```bash
node extension/test/e2e.cjs /tmp
```

```bash
node server/test/e2e.cjs /tmp
```
