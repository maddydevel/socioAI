# 4. Real-world scenarios

Each scenario is a complete walk-through, from start to finish.

| # | Scenario | Who | Uses |
|---|---|---|---|
| 1 | [Setting up a non-technical colleague in 3 minutes](#1-setting-up-a-non-technical-colleague-in-3-minutes) | Anyone | Add-on |
| 2 | [The ten-minute morning briefing](#2-the-ten-minute-morning-briefing) | Busy professional | Add-on |
| 3 | [First day: follow everything in one sitting](#3-first-day-follow-everything-in-one-sitting) | New user | Add-on |
| 4 | [Tracking Chinese open-model releases](#4-tracking-chinese-open-model-releases) | ML engineer | Add-on |
| 5 | [A model launch day, as it happens](#5-a-model-launch-day-as-it-happens) | Product manager | Add-on |
| 6 | [Rolling it out to a team, with phones and verified sign-in](#6-rolling-it-out-to-a-team-with-phones-and-verified-sign-in) | Team lead | Add-on, web app and server |
| 7 | [Adding a new lab and releasing an update](#7-adding-a-new-lab-and-releasing-an-update) | Maintainer | Configuration |

---

## 1. Setting up a non-technical colleague in 3 minutes

**Ravi** wants his manager, **Helen**, to have AI Follow Desk. Helen uses Chrome on a Windows laptop and has never installed an add-on.

1. Ravi sends Helen the link to the [Quick start](00-quick-start.md), or the `AI-Follow-Desk.zip` file itself.
2. Helen downloads the zip and right-clicks it → **Extract All…** → **Extract**.
3. In Chrome she types `chrome://extensions`, turns on **Developer mode**, and clicks **Load unpacked**.
4. She opens the extracted folder, sees a second **AI-Follow-Desk** folder inside (the one with `manifest.json`), selects it and clicks **Select Folder**.
5. AI Follow Desk opens in a new tab by itself, with a **Welcome** card: Read, Follow, Browse. She presses **Got it**.
6. Ravi shows her the puzzle-piece icon, and she pins the red AI Follow Desk icon.

**Total time: about 3 minutes.** There was no account to create and nothing to configure. Her follows and settings stay in her own Chrome.

---

## 2. The ten-minute morning briefing

**Priya** is a consultant. Before her first meeting, she wants the AI essentials in ten minutes, without scrolling X.

1. She clicks the red AI Follow Desk icon. The app opens on **Today**.
2. The stories are from last night, more than 12 hours ago, so the app shows *Getting the latest updates…* for about a minute, then *Updated just now*.
3. The briefing card says *"… the 18 newest stories, about ten minutes of reading."* She presses **Start briefing**.
4. She moves through the stories with **→**: US & Europe AI companies first, then the Chinese AI companies, and so on. The progress bar fills as she goes.
5. A story about Andrej Karpathy interests her, so she presses **Follow @karpathy**. X opens and she follows him. When she switches back, the app asks *"Back from X. Did you follow Andrej Karpathy?"* and she presses **Mark followed**.
6. Her meeting starts at story 11, so she presses **Esc**.
7. After lunch she clicks the icon again. The button says **Resume at story 11**, and she finishes.

**Why it works:** one main button, one story per screen, fresh stories without asking, and the app remembers her place.

> On her phone, Priya can use the web version if her team hosts one (scenario 6). The add-on itself only runs on computers.

---

## 3. First day: follow everything in one sitting

**Marco** has just installed the add-on and wants to follow the whole list on X and LinkedIn in about 30 minutes.

1. He opens **Follow** and chooses **X** (`0/75`).
2. The first account is **OpenAI**. He presses **Open on X**, follows on X, comes back, and presses **Mark followed**. The ring moves to 1%, and the next account, **Anthropic**, slides in.
3. He isn't ready to follow **Elon Musk**, so he presses **Skip**, and the account moves to the end of the queue.
4. Twenty minutes later the ring shows **74 of 75**. Only the skipped account is left.
5. He switches to **LinkedIn** (`0/59`) and repeats. Accounts without a LinkedIn page are left out automatically.
6. On **You**, his progress shows `133 of 165`.
7. He stars five accounts: Karpathy, Andrew Ng, OpenAI, Anthropic and Hugging Face. Each star reminds him to turn on X notifications for that account, which he does from their profiles.

**Tip:** Marco saves his X username under **You → Linked accounts**. The Follow sprint then links to **Your Following list** on X, so he can check his follows.

---

## 4. Tracking Chinese open-model releases

**Wei** is an ML engineer. She tests new open-weight models the week they appear, so she watches the Chinese AI companies and r/LocalLLaMA.

1. She installs the add-on with the [Quick start](00-quick-start.md). There's nothing to connect.
2. On **Today** she chooses the **Chinese AI companies** category. Only those updates remain, for example *"Alibaba Releases Qwen4-Max"* and *"Kimi K3.1 Pro weights land on Hugging Face"*.
3. She stars **DeepSeek**, **Alibaba Qwen** and **Moonshot AI**, then turns on **Starred accounts only**.
4. In the category heading she presses **Live** (X icon). One X search opens for `from:deepseek_ai OR from:Alibaba_Qwen OR …`, newest first, and she scrolls it for a minute.
5. Back in the app, the summary now says *"… including 14 posts saved from X, LinkedIn, Instagram and Reddit as you browsed"*. Under **Source → Social posts (14)** she sees those X posts, marked **Post on X**, with exact times.
6. She also opens **You → Posts from your browser → All 7 subreddits**. Reddit threads that mention Qwen or DeepSeek appear in the feed with those accounts' name tags. One tap on a tag shows everything about Qwen.
7. Each morning she repeats steps 4–6 in about three minutes.

**Why it works:** the add-on turns pages she already reads into a filtered feed of just her accounts, without APIs or automated browsing.

---

## 5. A model launch day, as it happens

**Sam** is a product manager. A major lab is expected to launch a model this afternoon, and he wants one place to follow the reaction.

1. He clicks the AI Follow Desk icon, chooses **Source → Social posts**, and keeps that tab open.
2. In other tabs he opens:
   - the **US & Europe AI companies → Live** X search;
   - the lab's LinkedIn page, from its account details;
   - r/LocalLLaMA and r/singularity.
3. Each time he refreshes those tabs, new posts are saved. His app tab updates within seconds: the lab's announcement on X, the LinkedIn post *"seen just now, posted 1h ago"*, and the first Reddit threads.
4. He presses **/** and types the model's name. Only matching posts and headlines remain.
5. The next morning, his briefing includes the launch coverage from blogs and news.

**Note:** posts are only saved from pages Sam actually opens. If he doesn't open X, nothing from X arrives. If he needs a break from saving, he turns that site's switch off under **You → Posts from your browser**.

---

## 6. Rolling it out to a team, with phones and verified sign-in

**Aisha** leads a ten-person research team. Everyone uses Chrome at work, and several people also want the briefing on their phones.

**Laptops: the add-on (10 minutes in total)**

1. She shares the Quick start link, or the zip, in the team chat. Each person installs it as in scenario 1.
2. Each person's follows, stars and saved posts stay in their own Chrome. Nobody sees anyone else's.

**Phones and a shared address: the web app with the server (an afternoon, once)**

3. She deploys the repository to Render ([Configuration, section 5](02-configuration.md#5-deploy-the-server)) with:
   - `NODE_ENV=production`;
   - a fresh `SESSION_SECRET` from `openssl rand -hex 32`;
   - `BASE_URL=https://follow.ourteam.dev`.
4. She adds a daily refresh, so the web app gets new stories each morning ([Configuration, section 3](02-configuration.md#3-refresh-the-web-apps-updates)). On Render she uses a Cron Job service running `python3 fetch.py . && ./build_app.sh accounts.js feed.json`.
5. **Verified sign-in (optional):**
   - **X:** she creates an X developer app with the callback `https://follow.ourteam.dev/auth/x/callback` and adds `X_CLIENT_ID` and `X_CLIENT_SECRET`.
   - **LinkedIn:** she does the same with **Sign In with LinkedIn using OpenID Connect**.
   - **Reddit:** she requests API access and leaves it unconfigured until Reddit approves.
6. People open `https://follow.ourteam.dev` on their phones and add it to the home screen. On **You**, **Continue with X** opens a small X window. They approve, it closes, and they see **Verified by X** with their own name and picture.
7. **Optional for laptops:** to see add-on posts in the shared web app too, people add `https://follow.ourteam.dev` under the add-on's **Extension options → Connect app** ([Installation, Part D](01-installation.md#part-d-connect-the-add-on-to-your-web-app)).

**What the server stores:** nothing on disk. Each person's verified profile sits in their own encrypted cookie for 30 days, and tokens and passwords are never kept.

---

## 7. Adding a new lab and releasing an update

A new lab, *Example Labs* (`@examplelabs` on X, `company/example-labs` on LinkedIn), becomes important, and the maintainer wants it in everyone's app.

1. **Add the account** to `accounts.js`, in the `RAW` list among the emerging labs:

```js
["examplelabs","Example Labs","Frontier research lab","lab","examplelabs","company/example-labs"],
```

2. **Give it news coverage:** in `fetch.py`, add `"examplelabs":'"Example Labs"',` to `NEWS`.
3. **Raise the version** in `extension/manifest.json`, for example from `1.1.0` to `1.2.0`.
4. **Rebuild and test:**

```bash
./build_extension.sh
```

```bash
./build_app.sh accounts.js feed.json
```

```bash
node extension/test/app-e2e.cjs /tmp
```

5. **Check it:** reload the add-on in `chrome://extensions`. Example Labs appears in **Accounts** under Emerging labs, and in the **Follow** queues for X and LinkedIn. After **Update now**, its news appears in **Today**.
6. **Release it:** commit, push, and publish a GitHub release `v1.2.0` with `dist/AI-Follow-Desk.zip` attached ([Configuration, section 8](02-configuration.md#8-release-a-new-version)).
7. **Update the team:** people follow [Quick start → Getting a new version](00-quick-start.md#getting-a-new-version), copying the new files into their **existing** folder so they keep their follows. If the add-on is on the Chrome Web Store, they get the update automatically. The deployed web app picks up the change when the repository redeploys.

---

**Next:** [Troubleshooting](05-troubleshooting.md)
