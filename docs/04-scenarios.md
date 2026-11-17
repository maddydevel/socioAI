# 4. Real-world scenarios

Each scenario is a complete walk-through, from start to finish.

| # | Scenario | Who | Uses |
|---|---|---|---|
| 1 | [The ten-minute morning briefing](#1-the-ten-minute-morning-briefing) | Anyone, on a phone | App |
| 2 | [First day: follow everything in one sitting](#2-first-day-follow-everything-in-one-sitting) | New user | App |
| 3 | [Tracking Chinese open-model releases](#3-tracking-chinese-open-model-releases) | ML engineer | App and extension |
| 4 | [A model launch day, as it happens](#4-a-model-launch-day-as-it-happens) | Product manager | Extension |
| 5 | [Self-hosting for a team with verified sign-in](#5-self-hosting-for-a-team-with-verified-sign-in) | Team lead | Server |
| 6 | [Keeping the data fresh every morning](#6-keeping-the-data-fresh-every-morning) | Whoever runs the server | Server and cron |
| 7 | [Adding a new lab to the list](#7-adding-a-new-lab-to-the-list) | Maintainer | Configuration |

---

## 1. The ten-minute morning briefing

**Priya** is a consultant who reads AI news on the train. She wants the essentials in ten minutes, without scrolling X.

1. She opens AI Follow Desk on her phone. It opens on **Today**.
2. The briefing card says *"260 updates from 63 accounts… the 18 newest stories, about ten minutes of reading."* She presses **Start briefing**.
3. She swipes through the stories. The first is from US & Europe AI companies, *"Qwen4-Max opens to general API access…"* is from Chinese AI companies, and so on. The progress bar fills as she goes.
4. A story about Andrej Karpathy interests her, so she presses **Follow @karpathy**. X opens and she follows him. When she switches back, the app asks *"Back from X. Did you follow Andrej Karpathy?"* and she taps **Mark followed**.
5. Her train arrives at story 11. She closes the briefing.
6. That evening she opens the app. The button says **Resume at story 11**, and she finishes the last stories.

**Why it works:** one main button, one story per screen, and the app remembers her position. She never has to search X or decide what to read next.

---

## 2. First day: follow everything in one sitting

**Marco** has just found *The Follow List* and wants to follow all of it on X and LinkedIn in about 30 minutes.

1. He opens **Follow** and chooses **X** (`0/75`).
2. The first account is **OpenAI**. He presses **Open on X**, follows on X, comes back, and presses **Mark followed**. The ring moves to 1%, and the next account, **Anthropic**, slides in.
3. **Elon Musk** is on his list, but Marco doesn't want to follow him yet, so he presses **Skip** and the account moves to the end of the queue.
4. To save time he uses the queue on the right instead. He opens each profile from **Accounts**, follows it on X, and presses the round button next to each name.
5. Twenty minutes later the ring shows **74 of 75**. Only the skipped account is left.
6. He switches to **LinkedIn** (`0/59`) and repeats. Accounts without a LinkedIn page are left out automatically.
7. On **You**, his progress shows `133 of 165`.
8. He stars five accounts (Karpathy, Andrew Ng, OpenAI, Anthropic, Hugging Face). Each star reminds him to turn on X notifications for that account, which he does from their profiles.

**Tip:** to check his follows really worked, Marco links his X username on **You**. The Follow sprint then shows a link to **Your Following list** on X.

---

## 3. Tracking Chinese open-model releases

**Wei** is an ML engineer. She tests new open-weight models the week they appear, so she cares about the Chinese AI companies and r/LocalLLaMA.

1. She installs the extension ([Installation, Part C](01-installation.md#part-c-install-the-browser-extension)) and runs the app locally from the `socioAI` folder, so it connects automatically.
2. On **Today** she chooses the **Chinese AI companies** category. Only that category's updates remain, for example:
   - *"Alibaba Releases Qwen4-Max"*;
   - *"Tencent Releases Hy4 flash"*;
   - *"Kimi K3.1 Pro weights land on Hugging Face"*.
3. She stars **DeepSeek**, **Alibaba Qwen** and **Moonshot AI**, then turns on **Starred accounts only**.
4. In the category heading she presses **Live** (X icon). It opens one X search for `from:deepseek_ai OR from:Alibaba_Qwen OR …`, newest first. She scrolls it for a minute.
5. Back in the app, the hero says *"…including 14 posts saved from X…"*. Under **Source → Social posts**, she sees those X posts, marked **Post on X**, with exact times.
6. She also opens **Reddit communities → Live** (r/LocalLLaMA and the others, newest first). Reddit threads that mention Qwen or DeepSeek appear in the feed with those accounts' name tags, so one tap shows everything about Qwen.
7. Each morning she repeats steps 4–6 in about three minutes.

**Why it works:** the extension turns the pages she already reads into a filtered, searchable feed of just her accounts, with no API and no automated browsing.

---

## 4. A model launch day, as it happens

**Sam** is a product manager. A major lab is expected to launch a model this afternoon, and he wants one place to follow the reaction.

1. Before the launch, he opens **Today**, chooses **Source → Social posts**, and keeps the app open in one tab.
2. In other tabs he opens:
   - the **US & Europe AI companies → Live** X search;
   - the lab's LinkedIn page, from its account details;
   - r/LocalLLaMA and r/singularity, from **You → Posts from your browser → All 7 subreddits**.
3. As he refreshes those tabs, new posts are saved. When he switches back, his app tab updates within seconds: the lab's announcement on X, the LinkedIn post *"seen just now, posted 1h ago"*, and the first Reddit threads.
4. He searches for the model's name (**/**, then type it). Only matching posts and headlines remain.
5. The next morning, the briefing includes the launch stories alongside the rest of the news.

**Note:** posts are only saved from pages Sam actually opens. If he doesn't open X, nothing from X arrives.

---

## 5. Self-hosting for a team with verified sign-in

**Aisha** leads a ten-person research team. She wants everyone to use the same app at `https://follow.ourteam.dev`, with sign-in confirmed by each platform.

1. **Deploy:** she deploys the repository to Render ([Configuration, section 5](02-configuration.md#5-deploy-the-server)) with these settings:
   - `NODE_ENV=production`;
   - a fresh `SESSION_SECRET` from `openssl rand -hex 32`;
   - `BASE_URL=https://follow.ourteam.dev`.
2. **X:** she creates an X app with the callback `https://follow.ourteam.dev/auth/x/callback` and adds `X_CLIENT_ID` and `X_CLIENT_SECRET`.
3. **LinkedIn:** she creates a LinkedIn app with **Sign In with LinkedIn using OpenID Connect** and the callback `…/auth/li/callback`.
4. **Reddit:** she requests Reddit API access and waits for approval, leaving Reddit unconfigured for now.
5. **Check the log:** after a restart, it shows `X ready…`, `LinkedIn ready…`, `Reddit not configured…`, `Instagram not configured…`.
6. **Share it:** she sends the link to her team. Each person opens **You** and presses **Continue with X**. A small X window opens; they approve, it closes, and they see **Verified by X** with their own name and picture.
7. **Each person's state is their own.** One person's follow ticks, stars and sign-ins are stored in their own browser, so nobody sees anyone else's.
8. **Extension:** team members who want social posts install the extension, then use **Connect app** with `https://follow.ourteam.dev`.
9. **Later:** when Reddit approves the app, Aisha adds `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` and restarts. **Continue with Reddit** appears for everyone.

**What the server stores:** nothing on disk. Each person's verified profile is in their own encrypted cookie for 30 days. Tokens and passwords are never kept.

---

## 6. Keeping the data fresh every morning

Aisha wants the briefing to have new stories every day, without anyone doing anything.

1. On the server, she adds a daily job (`crontab -e`):

```text
5 6 * * * cd /srv/socioAI && python3 fetch.py . && ./build_app.sh accounts.js feed.json >> refresh.log 2>&1
```

2. At 06:05 each day, `fetch.py` collects the latest official blog posts, the week's top Reddit posts and the last 7 days of news. Then `build_app.sh` rebuilds `index.html`.
3. The server serves the new page straight away, with no restart. People see the new date on **Today**, and **Start briefing** begins a fresh set of stories.
4. If a run fails, for example because a site is temporarily down, she checks `refresh.log`. The previous day's page stays in place until the next successful run.

**On Render** (no cron on the free plan), she uses a **Cron Job** service with the same command. Or she runs it from her own computer and pushes `feed.json` and `index.html` to the repository, which redeploys.

---

## 7. Adding a new lab to the list

A new lab, *Example Labs* (`@examplelabs` on X, `company/example-labs` on LinkedIn), becomes important and Aisha wants it in the app.

1. **Add it** to `accounts.js` in the `RAW` list, among the emerging labs:

```js
["examplelabs","Example Labs","Frontier research lab","lab","examplelabs","company/example-labs"],
```

2. **Give it news coverage:** in `fetch.py`, add `"examplelabs":'"Example Labs"',` to `NEWS`.
3. **Rebuild** the data, the app and the extension's list:

```bash
python3 fetch.py .
```

```bash
./build_app.sh accounts.js feed.json
```

```bash
node extension/build-accounts.mjs
```

4. **Rebuild and reload the add-on:** run `./build_extension.sh`, then in `chrome://extensions` press reload on **AI Follow Desk**.
5. **Check it:** Example Labs now appears in **Accounts** under Emerging labs, in the **Follow** queues for X and LinkedIn, and, once there's news or you browse its X page, in **Today**.
6. **Commit and push**, so the deployed server and the team's extensions pick it up.

---

**Next:** [Troubleshooting](05-troubleshooting.md)
