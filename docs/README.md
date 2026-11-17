# socioAI documentation

socioAI (the app is called **AI Follow Desk**) helps you follow the 79 AI companies, leaders, researchers and labs, plus 7 subreddits, from *The Follow List* by AI with Divyam. It works across X, LinkedIn, Instagram and Reddit.

You get three things:

- **A daily briefing.** It shows recent updates from official blogs, news coverage and Reddit, grouped by category, and you can read them one story at a time.
- **A follow tracker.** You open each account's profile, follow it there, and tick it off. It tracks your progress for all 165 profile links.
- **Real social posts, optionally.** A browser extension saves posts from your list while you browse X, LinkedIn, Instagram and Reddit.

## Read in this order

| # | Guide | Read it when you want to… |
|---|---|---|
| 1 | [Installation](01-installation.md) | get the app, the optional server and the optional extension running |
| 2 | [Configuration](02-configuration.md) | set up verified sign-in, refresh the data, change the account list, or deploy |
| 3 | [User manual](03-user-manual.md) | learn every screen and control |
| 4 | [Real-world scenarios](04-scenarios.md) | see complete walk-throughs of typical days and set-ups |
| 5 | [Troubleshooting](05-troubleshooting.md) | fix something that isn't working |

## The pieces at a glance

```text
socioAI/
├── index.html          the app (built file: open it in a browser)
├── app.src.html        the app's source, before data is added
├── accounts.js         the account list (79 accounts + 7 subreddits)
├── feed.json           the latest fetched updates
├── fetch.py            fetches updates from blogs, Reddit RSS and Google News
├── build.py            puts feed.json into index.html
├── build_app.sh        rebuilds index.html from app.src.html + accounts.js + feed.json
├── server/             optional: serves the app and adds verified sign-in (OAuth)
├── extension/          optional: Chrome/Edge extension that saves posts as you browse
└── docs/               these guides
```

## Choose how to run it

| Option | What you get | What you need |
|---|---|---|
| **A. Just the app** | Briefing, feed, follow tracker. Usernames are saved but not verified. | A browser |
| **B. App + server** | Everything in A, plus "Continue with X" sign-in that each platform confirms | Node 20+, HTTPS hosting and developer apps on each platform |
| **C. Add the extension** to A or B | Real posts from X, LinkedIn, Instagram and Reddit in your feed | Chrome or Edge |

## What it can't do

Know these limits before you start:

- **It doesn't read X, LinkedIn or Instagram on its own.** Those sites block automated access, and this project doesn't use their APIs. Real posts arrive only through the extension, while you browse.
- **It can't follow accounts for you.** You follow each account on the platform itself, and the app keeps track of your progress.
- **It can't see who you follow.** Your follow ticks are what you mark yourself. Verified sign-in confirms who you are, not who you follow.
