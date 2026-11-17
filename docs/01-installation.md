# 1. Installation

> **Most people only need the [Quick start](00-quick-start.md).** It installs the whole app as a Chrome add-on in 3 minutes, with nothing to configure. This guide is for technical users.

Pick the path you need:

| Path | You get | Time |
|---|---|---|
| [Part A: Build the add-on from source](#part-a-build-the-add-on-from-source) | The same add-on as the Quick start, built from the latest code | 5 minutes |
| [Part B: Run the web app](#part-b-run-the-web-app) | AI Follow Desk in any browser, including phones, with no add-on | 5 minutes |
| [Part C: Run the server for verified sign-in](#part-c-run-the-server-for-verified-sign-in) | The web app at your own address, with "Continue with X" confirmed by each platform | 30–60 minutes, plus platform approval times |
| [Part D: Connect the add-on to your web app](#part-d-connect-the-add-on-to-your-web-app) | Posts saved by the add-on also shown in your web app | 5 minutes |
| [Part E: Developer tools](#part-e-developer-tools) | Refreshing the web app's data, and running the tests | 10 minutes |

---

## Before you start

| You need | For | Check it |
|---|---|---|
| Git | Downloading the code | `git --version` |
| Chrome or Edge | The add-on (Parts A and D) | Firefox and Safari aren't supported |
| Node.js 20 or later | Building the add-on (A), the server (C) | `node --version` shows `v20` or higher |
| Python 3.9 or later | Building the add-on (A), refreshing data (E) | `python3 --version` |
| Any modern browser | The web app (Part B) | Any version from the last two years |

Download the code once, for every path:

```bash
git clone https://github.com/maddydevel/socioAI.git
```

```bash
cd socioAI
```

> **Keep the folder named `socioAI`** (or `ai-follow-desk`). The add-on only connects to local copies of the web app in folders with one of those names (Part D).

---

## Part A: Build the add-on from source

### Step 1. Build it

```bash
./build_extension.sh
```

You should see:

```text
sources.js: 16 blogs, 9 Reddit feeds, 79 news searches
accounts.json: 75 X, 59 LinkedIn, 20 Instagram, 9 Reddit
app.html, app.js, data.js written
dist/AI-Follow-Desk.zip ready
```

This updates the files in `extension/` and packs `dist/AI-Follow-Desk.zip`, the file you share with other people.

### Step 2. Load it into Chrome or Edge

1. Open `chrome://extensions` (or `edge://extensions`).
2. Switch on **Developer mode** (top right).
3. Choose **Load unpacked** and select the `extension` folder inside `socioAI`.

**AI Follow Desk** appears in the list, and the app opens in a new tab with a **Welcome** card. Pin it with the puzzle-piece icon; one click on the red icon then opens the app.

### Step 3. Check it works

1. Press **Got it** on the welcome card, then **Update now** under *Your AI briefing*. After about a minute, it says **Updated just now**.
2. Press **Start briefing**, then **→** and **Esc**.
3. Open a few X posts by accounts on the list, such as `https://x.com/OpenAI`. Back in the app, choose **Source → Social posts**: the posts are there.

> **After changing the code,** run `./build_extension.sh` again, then press the reload arrow on **AI Follow Desk** in `chrome://extensions`. Your follows and saved posts are kept, as long as you load from the same folder.

---

## Part B: Run the web app

The web app is the same app as an ordinary web page. Use it on phones, or wherever the add-on can't run.

1. Open `index.html` in a browser: double-click it, or drag it into a browser window.
2. You should see **AI Follow Desk** with **Today** and **Your AI briefing**.
3. Check it: press **Start briefing**, open **Accounts** (86 cards), and pick a theme under **You → Appearance**.

> **To serve it over `http://localhost`,** run `python3 -m http.server 8000` in the folder and open `http://localhost:8000`.

**Two differences from the add-on:**
- The web app's stories are a snapshot. It doesn't fetch new ones by itself, so refresh them with `fetch.py` (see [Part E](#part-e-developer-tools) and [Configuration, section 3](02-configuration.md#3-refresh-the-web-apps-updates)).
- Social posts appear only if the add-on is installed and connected (see [Part D](#part-d-connect-the-add-on-to-your-web-app)).

---

## Part C: Run the server for verified sign-in

The server hosts the web app at your own address and adds **Continue with X / LinkedIn / Reddit / Instagram**. Each platform confirms the account, and the app shows **Verified by X** with the real name, handle and picture.

### Step 1. Start it locally

```bash
node server/server.mjs
```

You should see:

```text
[afd] SESSION_SECRET not set: using a random one, so sign-ins reset when the server restarts.
[afd] AI Follow Desk on http://localhost:8787
[afd]   X         not configured (set X_CLIENT_ID/_CLIENT_SECRET)
[afd]   LinkedIn  not configured (set LINKEDIN_CLIENT_ID/_CLIENT_SECRET)
[afd]   Reddit    not configured (set REDDIT_CLIENT_ID/_CLIENT_SECRET)
[afd]   Instagram not configured (set INSTAGRAM_CLIENT_ID/_CLIENT_SECRET)
```

Open `http://localhost:8787`. On **You**, each platform says "sign-in isn't set up on this server yet". That's expected until Step 3. Press **Ctrl+C** to stop.

### Step 2. Create your settings file

```bash
cp server/.env.example server/.env
```

Generate a session secret and paste it after `SESSION_SECRET=` in `server/.env`:

```bash
openssl rand -hex 32
```

### Step 3. Register a sign-in app on each platform you want

Each platform is independent; set up only the ones you need. The full steps are in [Configuration, section 2](02-configuration.md#2-register-a-sign-in-app-on-each-platform). In short:

1. Create a developer app on the platform.
2. Set its callback URL to `BASE_URL/auth/<code>/callback`, using the code `x`, `li`, `rd` or `ig`.
3. Copy the client ID and secret into `server/.env`.

> Locally, `BASE_URL` is `http://localhost:8787`. Some platforms only accept `https://` callbacks. For those, test on your deployed server (Step 5).

### Step 4. Start the server with your settings

```bash
set -a; . server/.env; set +a; node server/server.mjs
```

Each configured platform now prints `ready, callback http…/auth/x/callback`. That URL must match what you registered, character for character.

### Step 5. Deploy it

Deploy the folder to any host with Node 20 or later and HTTPS. See [Configuration, section 5](02-configuration.md#5-deploy-the-server) for Render, Fly.io, Railway and a Linux server. Then set `BASE_URL`, and every platform's callback URL, to your HTTPS address.

### Step 6. Check sign-in works

1. Open your server's address and go to **You**.
2. Press **Continue with X**. A small window opens on X.
3. Sign in, and approve **AI Follow Desk**.
4. The window closes, and **X** shows **Verified by X** with your name, handle and picture.

---

## Part D: Connect the add-on to your web app

Inside the add-on, the app already shows saved posts with no connecting. This part is only needed if you also want those posts in **your web app** (Part B or C).

1. Install the add-on: use the [Quick start](00-quick-start.md) or [Part A](#part-a-build-the-add-on-from-source).
2. **Local copies connect automatically.** That means `http://localhost` or `http://127.0.0.1` on any port, and `index.html` opened from a folder named `socioAI` or `ai-follow-desk`. For a local file, open `chrome://extensions` → **Details** on AI Follow Desk, and switch on **Allow access to file URLs**.
3. **For your own address** (for example `https://follow.example.com`):
   1. In the web app, open **You → Posts from your browser** and press **Copy address**.
   2. In `chrome://extensions`, click **Details** on **AI Follow Desk**, then **Extension options**.
   3. Paste the address, press **Connect**, and allow access when Chrome asks.
4. Reload the web app. **You → Posts from your browser** should say **Extension connected**.

---

## Part E: Developer tools

### Refreshing the web app's data

This needs Python 3 only, with no extra packages:

```bash
python3 fetch.py .
```

```bash
./build_app.sh accounts.js feed.json
```

This rebuilds `index.html` with the latest stories. To also give the add-on a fresher starting snapshot, run `./build_extension.sh` afterwards.

### Running the tests

The tests drive a real browser through Playwright:

```bash
npm install playwright
```

```bash
npx playwright install chromium
```

| Test | What it checks |
|---|---|
| `node extension/test/app-e2e.cjs /tmp` | The add-on as a first-time user meets it: the app opens on install with the welcome card, **Update now** works against the real public feeds, a browsed post appears, the switches work, and the toolbar icon reopens the app |
| `node extension/test/e2e.cjs /tmp` | Saving posts from look-alike X, LinkedIn, Instagram and Reddit pages, and handing them to the web app |
| `node server/test/e2e.cjs /tmp` | Verified sign-in against a built-in mock provider (no real platform keys needed) |

Each test prints a JSON summary. An empty `"errs": []` means no page errors.

---

**Next:** [Configuration](02-configuration.md)
