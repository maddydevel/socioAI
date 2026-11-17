# 1. Installation

> **Most people should use the [Quick start](00-quick-start.md) instead.** It installs the whole app as a Chrome add-on in 3 minutes, with nothing to configure. This guide covers the technical options: running from the source files, the verified sign-in server, and building the add-on yourself.

This guide takes you from nothing to a working app. Part A is required. Parts B and C are optional, and you can add them later.

- [Part A: Get the app running](#part-a-get-the-app-running) (5 minutes)
- [Part B: Run the server for verified sign-in](#part-b-run-the-server-for-verified-sign-in) (30–60 minutes, plus platform approval times)
- [Part C: Install the browser extension](#part-c-install-the-browser-extension) (5 minutes)
- [Part D: Install the developer tools](#part-d-install-the-developer-tools) (for refreshing data and running tests)

---

## Before you start

| You need | For | Check it |
|---|---|---|
| A modern browser (Chrome, Edge, Firefox or Safari) | The app | Any version from the last two years |
| Git | Downloading the project | `git --version` |
| Node.js 20 or later | Part B (server) and the extension's helper script | `node --version` shows `v20` or higher |
| Python 3.9 or later | Refreshing the data (Part D) | `python3 --version` |
| Chrome or Edge | Part C (extension) | Firefox and Safari aren't supported |

---

## Part A: Get the app running

### Step 1. Download the project

```bash
git clone https://github.com/maddydevel/socioAI.git
```

```bash
cd socioAI
```

> **Keep the folder named `socioAI`** (or `ai-follow-desk`). The browser extension only connects to local copies in folders with one of those names.

If you don't use Git, open the repository page on GitHub and choose **Code → Download ZIP**, then unzip it to a folder named `socioAI`.

### Step 2. Open the app

Open `index.html` in your browser. Either double-click it, or drag it into a browser window.

You should see **AI Follow Desk** with the **Today** screen and **Your AI briefing**.

### Step 3. Check it works

1. Press **Start briefing**. A full-screen reader opens with story 1. Press **→** to go to the next story, then **Esc** to close it.
2. Open **Accounts**. You should see 86 cards: 79 accounts and 7 subreddits.
3. Open **You** and choose a theme under **Appearance**.

The app is installed. Everything you tick, star or choose is saved in this browser only.

> **Tip:** to serve the app over `http://localhost` without the full server, run `python3 -m http.server 8000` in the folder and open `http://localhost:8000`. The extension (Part C) connects to `localhost` automatically.

---

## Part B: Run the server for verified sign-in

The server adds **Continue with X / LinkedIn / Reddit / Instagram**. Each platform confirms your account, and the app shows **Verified by X** with your real name, handle and picture. Without the server, saved usernames are labelled **Not verified**.

### Step 1. Start the server locally (no sign-in yet)

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

Open `http://localhost:8787`. The app now runs from the server. On **You**, each platform says "sign-in isn't set up on this server yet". That's expected until Step 3. Press **Ctrl+C** to stop the server.

### Step 2. Create your settings file

```bash
cp server/.env.example server/.env
```

Generate a session secret and paste it after `SESSION_SECRET=` in `server/.env`:

```bash
openssl rand -hex 32
```

### Step 3. Register an app on each platform you want

Do this only for the platforms you need. Each one is independent. The full details for every platform are in the [Configuration guide](02-configuration.md#2-register-a-sign-in-app-on-each-platform). In short:

1. Create a developer app on the platform.
2. Set its callback (redirect) URL to `BASE_URL/auth/<code>/callback`, using the platform code `x`, `li`, `rd` or `ig`.
3. Copy its client ID and secret into `server/.env`.

> For local testing, `BASE_URL` is `http://localhost:8787`. Some platforms only accept `https://` callbacks. For those, test on your deployed server (Step 5).

### Step 4. Start the server with your settings

```bash
set -a; . server/.env; set +a; node server/server.mjs
```

Each configured platform now prints `ready, callback http…/auth/x/callback`. Check that this URL matches what you registered, character for character.

### Step 5. Deploy it (to use it beyond your own computer)

Deploy the folder to any host that runs Node 20 or later with HTTPS. See [Configuration → Deploy](02-configuration.md#5-deploy-the-server) for Render, Fly.io, Railway and a plain Linux server. Then update `BASE_URL` and every platform's callback URL to your HTTPS address.

### Step 6. Check sign-in works

1. Open the app from the server and go to **You**.
2. Press **Continue with X**. A small window opens on X.
3. Sign in, and approve **AI Follow Desk**.
4. The window closes. **X** now shows **Verified by X** with your name, handle and picture.

---

## Part C: Install the browser extension

The extension contains the **whole app**. Clicking its toolbar icon opens AI Follow Desk in a tab, and it refreshes its updates twice a day by itself. It also saves posts from your listed accounts while you browse X, LinkedIn, Instagram and Reddit, and passes them to any copy of the app it's connected to.

> **Using it on its own?** Follow the [Quick start](00-quick-start.md); you don't need anything else from this guide. To build the add-on from source, run `./build_extension.sh`. The result is `dist/AI-Follow-Desk.zip`.

The steps below are for using the extension **together with** a copy of the app you run yourself (Part A or B).

### Step 1. Load it into Chrome or Edge

1. Open `chrome://extensions` (or `edge://extensions`).
2. Switch on **Developer mode** (top right).
3. Choose **Load unpacked** and select the `extension` folder inside `socioAI`.
4. **AI Follow Desk** appears in the list, and the app opens in a new tab. Pin it with the puzzle-piece icon so it's easy to reach.

### Step 2. Connect it to the app

It connects automatically if you open the app:

- from `http://localhost` or `http://127.0.0.1` on any port (Part A tip or Part B), or
- as a local file in a folder named `socioAI` or `ai-follow-desk`. For local files, open the extension's **Details** and switch on **Allow access to file URLs**.

If you host the app at your own address (for example `https://follow.example.com`):

1. In the app, open **You → Posts from your browser** and press **Copy address**.
2. In `chrome://extensions`, click **Details** on **AI Follow Desk**, then **Extension options**. This opens the **Connect AI Follow Desk** page.
3. Paste the address and press **Connect**, then allow access when Chrome asks.

### Step 3. Check it works

1. Reload the app and open **You**. **Posts from your browser** should say **Extension connected**.
2. Under that panel, press one of the category links. Each opens an X search of that category's accounts.
3. Let the page load and scroll a little.
4. Go back to the app. Posts appear in **Today**, and the **Social posts** source filter shows only them.

---

## Part D: Install the developer tools

You only need these to refresh the data or run the tests.

### Refreshing data

This needs Python 3 only, with no extra packages:

```bash
python3 fetch.py .
```

```bash
./build_app.sh accounts.js feed.json
```

### Running the tests

The tests drive a real browser through Playwright:

```bash
npm install playwright
```

```bash
npx playwright install chromium
```

```bash
node server/test/e2e.cjs /tmp
```

```bash
node extension/test/e2e.cjs /tmp
```

The first test checks verified sign-in against a built-in mock provider, so you don't need real platform keys. The second loads the extension and checks that it captures posts from look-alike pages. Both print a JSON summary, and an empty `"errs": []` means no page errors.

---

**Next:** [Configuration guide](02-configuration.md)
