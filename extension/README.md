# AI Follow Desk Capture (browser extension)

This extension gets real posts from X, LinkedIn, Instagram and Reddit into AI Follow Desk without using any of their APIs.

- **It reads only pages you open yourself.** While you browse those sites in Chrome or Edge, it reads the posts already on your screen. It never loads pages on its own, scrolls, clicks, or sends requests to any site.
- **It keeps only accounts on your list.** It saves posts from the 79 accounts and 7 subreddits in your list and ignores everything else.
- **Your data stays in your browser.** Posts are stored in `chrome.storage.local`, up to 1,500 posts or 30 days. They're handed only to AI Follow Desk pages: localhost, a local copy in a folder named `ai-follow-desk`, or addresses you add on the **Connect app** page.

## Install

1. Open `chrome://extensions` (or `edge://extensions`) and switch on **Developer mode**.
2. Choose **Load unpacked** and select this `extension` folder.
3. If you open AI Follow Desk from your own server, click the extension, choose **Connect app**, and add its address. The You screen shows the address to add.
4. Browse X, LinkedIn, Instagram or Reddit. The **Today** feed picks up new posts within seconds, and the **Social posts** filter shows only them.

**Fastest way to collect:** on the You screen, under **Posts from your browser**, there's a link per category. Each opens one X search with every account in that category, newest first. Open it and scroll as you like.

## What it reads

| Site | Pages | Saved |
|---|---|---|
| X | Search, home, profiles and posts | Author handle, text, link and post time, for listed handles only |
| LinkedIn | Your feed and the company or people pages on your list | Text, link and "3h"-style age. LinkedIn doesn't show exact times. |
| Instagram | Profile grids of listed accounts, your feed and post pages | Link, plus the caption or image description |
| Reddit | Listed subreddits on new and old Reddit, and u/Cohere | Title, link and post time |

## Limits

- **Updates only arrive when you visit those pages.** Nothing is collected while the browser is closed.
- **Site redesigns can break it.** The sites change their page structure without notice. Each site has its own extractor at the top of `capture.js`, and that's where a fix would go.
- **The claude.ai preview may not work with it.** The published preview runs in a sandboxed frame the extension may not be able to reach. Use the self-hosted app (`server/`) or open `index.html` from a folder named `ai-follow-desk`. For a local file, also switch on **Allow access to file URLs** on the extension's details page.

## Rebuild the account list

If you change the list of accounts, regenerate the extension's copy:

```bash
node extension/build-accounts.mjs
```

## Test

```bash
node extension/test/e2e.cjs /tmp
```

The test loads the extension into Chromium and serves look-alike X, LinkedIn, Instagram and Reddit pages. It checks that listed accounts are captured, unlisted ones are ignored, posts that load late are picked up, and the app shows the captured posts.
