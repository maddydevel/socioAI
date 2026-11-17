# socioAI documentation

> **Not technical? Start here: [Quick start](00-quick-start.md).** Download one file, add it to Chrome, and you're done in about 3 minutes, with nothing to configure.

socioAI (the app is called **AI Follow Desk**) helps you follow the 79 AI companies, leaders, researchers and labs, plus 7 subreddits, from *The Follow List* by AI with Divyam. It works across X, LinkedIn, Instagram and Reddit.

It gives you:

- **A daily briefing.** Recent updates from official blogs, news coverage and Reddit, grouped by category, which you can read one story at a time.
- **A follow tracker.** You open each account's profile, follow it there, and tick it off. It tracks your progress for all 165 profile links.
- **Real social posts.** While you browse X, LinkedIn, Instagram and Reddit, posts from accounts on your list are saved and shown in the app.

## Two ways to use it

| | **Chrome add-on** (recommended) | **Web app** (for technical users) |
|---|---|---|
| Who it's for | Anyone with Chrome or Edge on a computer | People who want it on a phone, a shared team address, or verified sign-in |
| How to install | [Quick start](00-quick-start.md): download, unzip, **Load unpacked** | [Installation](01-installation.md): open `index.html`, or run the server |
| New stories | Fetched by itself when you open it and the last update is over 12 hours old, or press **Update now** | Refreshed by whoever runs it (`fetch.py`, for example daily) |
| Social posts as you browse | Built in | Needs the add-on as well, connected to the web app |
| Works on phones | No (computers only) | Yes |
| Verified "Continue with X" sign-in | No: usernames are saved but not verified | Yes, with the server and your own platform developer apps |
| Setup | None | Some: see [Configuration](02-configuration.md) |

## The guides

| # | Guide | Read it when you want to… |
|---|---|---|
| 0 | [Quick start](00-quick-start.md) | install and use the add-on in 3 minutes (most people) |
| 1 | [Installation](01-installation.md) | build the add-on from source, run the web app, or run the server |
| 2 | [Configuration](02-configuration.md) | change settings, set up verified sign-in, refresh data, edit the account list, deploy, or release a new version |
| 3 | [User manual](03-user-manual.md) | learn every screen and control |
| 4 | [Real-world scenarios](04-scenarios.md) | see complete walk-throughs, from a 3-minute install to a team set-up |
| 5 | [Troubleshooting](05-troubleshooting.md) | fix something that isn't working |

## The pieces at a glance

```text
socioAI/
├── extension/          the Chrome/Edge add-on (the whole app + saving posts as you browse)
│   ├── app.html, app.js, data.js   the app inside the add-on (built; don't edit by hand)
│   ├── refresh.js, sources.js      gets new stories from public feeds (sources.js is built)
│   ├── capture.js                  saves posts on X, LinkedIn, Instagram and Reddit pages you open
│   └── background.js, bridge.js, options.html, manifest.json, icons/
├── build_extension.sh  builds the add-on and packs dist/AI-Follow-Desk.zip
├── app.src.html        the app's source (shared by the add-on and the web app)
├── accounts.js         the account list (79 accounts + 7 subreddits)
├── fetch.py            the list of news sources, and the data refresh for the web app
├── feed.json           the latest snapshot of updates
├── index.html          the web app (built)
├── build_app.sh, build.py   rebuild index.html
├── server/             optional web-app server with verified sign-in (OAuth)
└── docs/               these guides
```

## What it can't do

- **It doesn't browse X, LinkedIn or Instagram on its own.** Those sites block automated access, and this project doesn't use their APIs. Posts from them arrive only while you browse, through the add-on.
- **It can't follow accounts for you.** You follow each account on the platform itself, and the app tracks your progress.
- **It can't see who you follow.** Follow ticks are what you mark yourself. Verified sign-in, in the web app with the server, confirms who you are, not who you follow.
- **The add-on doesn't run on phones.** Chrome add-ons only work on computers.
