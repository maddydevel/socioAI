# 2. Configuration

This guide covers everything you can set or change:

0. [The add-on needs no configuration](#0-the-add-on-needs-no-configuration)
1. [Server settings](#1-server-settings) (web app with the server)
2. [Register a sign-in app on each platform](#2-register-a-sign-in-app-on-each-platform) (web app with the server)
3. [Refresh the web app's updates](#3-refresh-the-web-apps-updates)
4. [Change the account list or news sources](#4-change-the-account-list-or-news-sources)
5. [Deploy the server](#5-deploy-the-server)
6. [Add-on settings and permissions](#6-add-on-settings-and-permissions)
7. [App settings and stored data](#7-app-settings-and-stored-data)
8. [Release a new version](#8-release-a-new-version)

---

## 0. The add-on needs no configuration

If you use the Chrome add-on ([Quick start](00-quick-start.md)), there's nothing to set up. Everything optional is on the **You** page:

| Setting | Where in the app |
|---|---|
| Theme | **You → Appearance**, or the icon at the top right |
| Your usernames on X, LinkedIn, Instagram and Reddit (unverified; adds shortcuts to your own feeds) | **You → Linked accounts** |
| Save posts per site, or delete saved posts | **You → Posts from your browser** |
| Get new stories now | **Today → Update now** |

Sections 1–5 below are for the web app and the server. Sections 6–8 also apply to the add-on.

---

## 1. Server settings

The server reads environment variables. Copy `server/.env.example` to `server/.env`, fill it in, and start the server with:

```bash
set -a; . server/.env; set +a; node server/server.mjs
```

| Variable | Required | Example | What it does |
|---|---|---|---|
| `BASE_URL` | Yes, in production | `https://follow.example.com` | The public address. Callback URLs are built from it, and cookies are marked Secure when it starts with `https://`. Defaults to `http://localhost:PORT`. |
| `PORT` | No | `8787` | Port to listen on. Most hosts set this for you. |
| `NODE_ENV` | Yes, in production | `production` | Makes the server refuse to start without a proper `SESSION_SECRET`, and refuse test settings. |
| `SESSION_SECRET` | Yes, in production | 64 hex characters | Encrypts the sign-in cookie. At least 32 characters; create one with `openssl rand -hex 32`. If you change it, everyone is signed out. |
| `X_CLIENT_ID`, `X_CLIENT_SECRET` | For X sign-in | — | From your X developer app |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | For LinkedIn sign-in | — | From your LinkedIn developer app |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | For Reddit sign-in | — | From your Reddit app |
| `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | For Instagram sign-in | — | Your Instagram app ID and secret, from Meta |
| `APP_FILE` | No | `/srv/socioAI/index.html` | Which built page to serve. Defaults to `index.html` next to the `server` folder. |
| `OAUTH_MOCK_URL` | Tests only | — | Points sign-in at the test mock provider. Refused when `NODE_ENV=production`. |

**Rules to keep in mind:**

- A platform is switched on only when its client ID is set. X can work with only a client ID, because it uses PKCE. The others also need the secret.
- Never commit `server/.env`. It's already listed in `.gitignore`.
- Sign-ins last 30 days. The cookie holds only the verified profile (account ID, username, name, picture and when it was verified), never tokens or passwords.

**Check the server is healthy:**

```bash
curl -s http://localhost:8787/healthz
```

It should print `{"ok":true}`. To see which platforms are configured:

```bash
curl -s http://localhost:8787/api/me
```

---

## 2. Register a sign-in app on each platform

For every platform, the callback (redirect) URL is:

| Platform | Code | Callback URL to register |
|---|---|---|
| X | `x` | `BASE_URL/auth/x/callback` |
| LinkedIn | `li` | `BASE_URL/auth/li/callback` |
| Reddit | `rd` | `BASE_URL/auth/rd/callback` |
| Instagram | `ig` | `BASE_URL/auth/ig/callback` |

The server prints the exact URL for each platform when it starts. Copy it from there, so the scheme, host and path match exactly.

> Platform consoles change their menus often. If a step below doesn't match what you see, look for the equivalent setting.

### X

1. Sign in at **developer.x.com** and create a Project and an App.
2. Open the app's **User authentication settings** and choose **Set up**.
3. App permissions: **Read**. Type of app: **Web App, Automated App or Bot** (a confidential client).
4. Callback URI: `BASE_URL/auth/x/callback`. Website URL: your `BASE_URL`.
5. Save, then copy the **OAuth 2.0 Client ID** and **Client Secret** into `X_CLIENT_ID` and `X_CLIENT_SECRET`.

The app asks for the scopes `users.read tweet.read` and reads only `users/me`. These calls count against your X API plan.

### LinkedIn

1. Go to **linkedin.com/developers** and choose **Create app**. You need a LinkedIn Page to attach it to.
2. Under **Products**, add **Sign In with LinkedIn using OpenID Connect**.
3. Under **Auth**, add the redirect URL `BASE_URL/auth/li/callback`.
4. Copy the **Client ID** and **Primary Client Secret** into the `LINKEDIN_…` variables.

The scopes are `openid profile`. LinkedIn returns your name and picture, but not your public profile URL, so the app shows your name.

### Reddit

1. Go to **reddit.com/prefs/apps** and choose **create another app…**. Pick the type **web app**.
2. Redirect URI: `BASE_URL/auth/rd/callback`.
3. The client ID is the string under the app name; the secret is labelled **secret**. Copy both into the `REDDIT_…` variables.
4. **Request API access.** Since November 2025, Reddit approves new apps under its Responsible Builder Policy. Until it does, sign-in may be refused.

The scope is `identity`, with a temporary token.

### Instagram

1. Go to **developers.facebook.com**, create an app, and add the **Instagram** product.
2. Choose **API setup with Instagram login**.
3. Under **Set up Instagram business login**, add the redirect URI `BASE_URL/auth/ig/callback`.
4. Copy the **Instagram app ID** and **Instagram app secret** into `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`.
5. While the app is in development, add yourself as an Instagram tester under **App roles**, and accept the invitation in Instagram's settings.

The scope is `instagram_business_basic`. **Only professional (business or creator) Instagram accounts can sign in.** To let other people sign in, Meta needs to review your app.

---

## 3. Refresh the web app's updates

> **Add-on users can skip this section.** The add-on gets new stories by itself when you open it and the last update is more than 12 hours old. **Update now** does it straight away. If a source can't be reached, its previous stories are kept.

The web app's feed is a snapshot. To refresh it:

```bash
python3 fetch.py .
```

```bash
./build_app.sh accounts.js feed.json
```

`fetch.py` writes `feed.json`, and `build_app.sh` rebuilds `index.html`. A running server serves the new file straight away, with no restart.

**What `fetch.py` collects:**

| Source | Accounts | Window | Kept per account |
|---|---|---|---|
| Official blog and newsletter RSS (16 feeds) | OpenAI, Google DeepMind, NVIDIA, Hugging Face, Together, ElevenLabs, Cursor, Qwen, Karpathy, Mollick, Chip Huyen, Raschka, Lilian Weng, Jay Alammar, Phil Schmid, Simon Willison | Last 45 days | 4 newest |
| Reddit RSS: top posts of the week | The 7 subreddits, plus r/kimi and u/Cohere | Last 10 days | 12 per subreddit |
| Google News RSS search | Every account | Last 7 days | 3 newest relevant headlines |

**Refresh it every day automatically** (Linux or macOS, with cron). Open your crontab:

```bash
crontab -e
```

Then add this line, using your own folder path:

```text
5 6 * * * cd /srv/socioAI && python3 fetch.py . && ./build_app.sh accounts.js feed.json >> refresh.log 2>&1
```

This refreshes at 06:05 every day. On Windows, use Task Scheduler with the same two commands.

The add-on uses the same sources, time windows and filters. They're copied from `fetch.py` into `extension/sources.js` whenever you run `./build_extension.sh`.

**Fine-tuning:** the windows and limits are near the top of `fetch.py`:

- `recent(..., 45)` sets the blog window;
- `rows[:12]` sets the Reddit limit;
- `len(res) >= 3` sets the news limit.

---

## 4. Change the account list or news sources

The accounts live in `accounts.js`, in the `RAW` list. Each row is:

```js
[id, name, role, category, xHandle, linkedinPath, instagramUser, redditPath, isPerson]
// example:
["karpathy","Andrej Karpathy","Neural nets, LLM education","res","karpathy","in/andrej-karpathy-9a650716",null,null,1],
```

| Field | Values |
|---|---|
| `id` | Short unique ID, such as `karpathy` |
| `category` | `us` (US & Europe), `cn` (China), `ceo` (Leaders), `res` (Researchers), `lab` (Emerging labs) |
| `xHandle` | Without `@`. Use `null` if the account isn't on X. |
| `linkedinPath` | The part after `linkedin.com/`, such as `company/openai` or `in/andrewyng` |
| `instagramUser` | Without `@`, or `null` |
| `redditPath` | `r/Subreddit` or `u/User`, or `null` |
| `isPerson` | `1` for people (round avatar). Leave it out for organisations. |

Subreddits are in the `SUBS` list as `[name, description]`.

**To include the account in fetched updates,** also edit `fetch.py`:

- add a news search to `NEWS`, keyed by the account `id`;
- optionally add its blog's RSS feed to `BLOGS`;
- optionally add keywords to `MENTIONS`, which tags Reddit posts that mention it.

**Then rebuild both editions:**

```bash
./build_app.sh accounts.js feed.json
```

```bash
./build_extension.sh
```

The second command also updates the add-on's account list, its copy of the news sources, and the list of feed sites it may read (its permissions). Reload the add-on in `chrome://extensions`. To share the change, release a new version (section 8).

> **Adding a blog feed?** The add-on can only read sites listed in its permissions, so a new site needs `./build_extension.sh` and a reload. Chrome may then ask users to accept the new permission when they update.

---

## 5. Deploy the server

Any host that runs Node 20 or later behind HTTPS works. The server has no npm dependencies. On every host:

- **Start command:** `node server/server.mjs`
- **Environment:** the variables from section 1, with `BASE_URL` set to the public HTTPS address and `NODE_ENV=production`
- **Health check:** `/healthz`

### Render

1. Choose **New → Web Service** and connect the `socioAI` repository.
2. Runtime: **Node**. Build command: leave empty, or use `true`. Start command: `node server/server.mjs`.
3. Add the environment variables. Render sets `PORT` itself.
4. After the first deploy, set `BASE_URL` to the `https://….onrender.com` address, or your custom domain, and redeploy.
5. Update every platform's callback URL to use that address.

### Fly.io or Railway

The same idea: deploy the repository with the start command `node server/server.mjs`, set the variables, and use the HTTPS address the platform gives you as `BASE_URL`.

### Your own Linux server (systemd + Caddy)

1. Copy the project to `/srv/socioAI` and create `/srv/socioAI/server/.env`.
2. Create `/etc/systemd/system/socioai.service`:

```ini
[Unit]
Description=socioAI (AI Follow Desk)
After=network.target

[Service]
WorkingDirectory=/srv/socioAI
EnvironmentFile=/srv/socioAI/server/.env
ExecStart=/usr/bin/node server/server.mjs
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl enable --now socioai
```

4. Put HTTPS in front with Caddy. In `/etc/caddy/Caddyfile`:

```text
follow.example.com {
    reverse_proxy localhost:8787
}
```

5. Reload Caddy:

```bash
sudo systemctl reload caddy
```

Add the daily refresh from section 3 to the same server's crontab.

---

## 6. Add-on settings and permissions

Click the **AI Follow Desk** toolbar icon to open the app. The add-on's settings are in the app itself, under **You → Posts from your browser**:

| Setting | Where | What it does |
|---|---|---|
| Save posts from X / LinkedIn / Instagram / Reddit | The switch next to each site | Turns saving on or off for that site. Saved posts stay. |
| Delete saved posts | Below the switches (press twice to confirm) | Deletes every saved post in this browser |
| Update now | Under *Your AI briefing* on **Today** | Fetches the latest blog, news and Reddit updates. It also happens by itself when you open the app and the stories are more than 12 hours old. |
| Connect app | `chrome://extensions` → **Details** → **Extension options** | Adds or removes self-hosted AI Follow Desk addresses the add-on may pass posts to. Only needed if you run your own copy. |

Built-in limits: up to **1,500 posts**, each kept for **30 days**. Older posts drop off automatically.

**Permissions the add-on asks for, and why:**

| Permission | Why |
|---|---|
| Read x.com, twitter.com, linkedin.com, instagram.com and reddit.com pages | To save posts from accounts on your list when **you** open those pages. It never opens them itself. |
| Read 16 blog sites, news.google.com and www.reddit.com | To fetch their public RSS feeds for new stories |
| Storage | To keep your saved posts, settings and latest stories in your browser |
| Scripting | Only used by **Connect app** to pass posts to a web app address you add |

Inside the add-on, the app needs no connecting. For copies of the app you run yourself, the add-on connects automatically to `http://localhost`, `http://127.0.0.1` on any port, and local copies in folders named `socioAI` or `ai-follow-desk`. Any other address needs **Connect app**.

---

## 7. App settings and stored data

| Setting | Where | Stored in |
|---|---|---|
| Theme (Match system / Light / Dark) | **You → Appearance**, or the header icon | This browser (`afd:theme`) |
| Follow ticks | Accounts, Follow, account details | This browser (`afd:followed`) |
| Starred accounts (up to 5) | Star buttons | This browser (`afd:starred`) |
| Unverified usernames | **You → Linked accounts** | This browser (`afd:conn`) |
| Briefing position | Automatic | This browser (`afd:briefPos`) |
| Verified sign-ins | **You → Connected accounts** (server only) | Encrypted cookie `afd_sess` (30 days) |

**The add-on also keeps** (in Chrome's extension storage, on your computer):
- saved posts (`items`, up to 1,500, 30 days each);
- the latest fetched stories (`feed`);
- the per-site switches (`enabled`);
- the addresses added with Connect app.

All of it, along with the settings above, is removed when you remove the add-on.

> Chrome ties this data to the folder you loaded the add-on from. Load updates from the same folder, or the add-on starts fresh.

Open tabs stay in sync. A change in one tab shows up in the others.

**To reset everything in a browser,** clear this site's data. In Chrome: the padlock or site-info icon in the address bar → **Site settings** → **Delete data**. To sign out of a platform, use **Disconnect** on **You**.

---

## 8. Release a new version

### Step 1. Bump the version

Raise `"version"` in `extension/manifest.json`, for example `1.1.0` to `1.2.0`.

### Step 2. Build and test

```bash
./build_extension.sh
```

```bash
node extension/test/app-e2e.cjs /tmp
```

### Step 3. Publish the download on GitHub

The Quick start's download link always points to the newest release's `AI-Follow-Desk.zip`:

1. Commit and push.
2. Open `https://github.com/maddydevel/socioAI/releases/new`.
3. Set **Tag** to the version, for example `v1.2.0`, and the title to `AI Follow Desk 1.2.0`.
4. Drag `dist/AI-Follow-Desk.zip` into the assets area. Keep that exact file name, because the link depends on it.
5. Press **Publish release**.

Users update by following [Quick start → Getting a new version](00-quick-start.md#getting-a-new-version).

### Step 4 (optional). Publish to the Chrome Web Store

The Chrome Web Store gives users a one-click **Add to Chrome**, without Developer mode, and updates them automatically.

1. Register at the Chrome Web Store Developer Dashboard (a one-time $5 fee).
2. Choose **New item** and upload `dist/AI-Follow-Desk.zip`.
3. Fill in the listing: description, screenshots (1280×800) and the 128px icon (`extension/icons/128.png`).
4. Fill in the privacy section. The add-on stores everything locally and sends no personal data anywhere. Explain each permission using the table in section 6.
5. Submit for review. Reviews usually take a few days.

After the first review, upload each new version's zip to the same item, and users get it automatically.

---

**Next:** [User manual](03-user-manual.md)
