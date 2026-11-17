// Loads the unpacked extension in Chromium, serves look-alike X/LinkedIn/Instagram/Reddit pages,
// and checks that only listed accounts are captured and handed to the app.
// Run: node extension/test/e2e.cjs <screenshot-dir>   (starts the app server on :8787)
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs"), os = require("node:os");
const out = process.argv[2] || ".";
const root = path.join(__dirname, "..", "..");
const ext = path.join(root, "extension");
const wait = ms => new Promise(r => setTimeout(r, ms));
const now = new Date().toISOString();

const PAGES = {
  "https://x.com/search": `<main>
    <article data-testid="tweet"><div data-testid="User-Name"><a href="/OpenAI">OpenAI</a></div><a href="/OpenAI/status/111"><time datetime="${now}">1m</time></a><div data-testid="tweetText">Introducing a new model for developers.\nAvailable today in the API.</div></article>
    <article data-testid="tweet"><div data-testid="User-Name"><a href="/randomperson">Someone</a></div><a href="/randomperson/status/222"><time datetime="${now}">2m</time></a><div data-testid="tweetText">Not on the list</div></article>
  </main><script>setTimeout(()=>{document.querySelector('main').insertAdjacentHTML('beforeend','<article data-testid="tweet"><a href="/karpathy/status/333"><time datetime="${now}">now</time></a><div data-testid="tweetText">Late-loading post from Karpathy</div></article>')},1500)</script>`,
  "https://www.linkedin.com/company/anthropicresearch/posts/": `<div data-urn="urn:li:activity:7001"><a href="https://www.linkedin.com/company/anthropicresearch/">Anthropic</a><span class="update-components-actor__title">Anthropic</span><span class="update-components-actor__sub-description">3h • Edited</span><div class="update-components-text">We're hiring researchers in London.</div></div>`,
  "https://www.instagram.com/nvidia/": `<main><a href="/p/ABC123/"><img alt="Photo by NVIDIA showing a new GPU on stage at GTC"></a><a href="/p/DEF456/"><img alt="Behind the scenes at our robotics lab"></a></main>`,
  "https://www.reddit.com/r/LocalLLaMA/new/": `<shreddit-post permalink="/r/LocalLLaMA/comments/abc/new_open_model/" post-title="New open model beats last month's best" author="someone" subreddit-prefixed-name="r/LocalLLaMA" created-timestamp="${now}"></shreddit-post>
    <shreddit-post permalink="/r/funny/comments/zzz/x/" post-title="Off-topic" author="x" subreddit-prefixed-name="r/funny" created-timestamp="${now}"></shreddit-post>`,
};

(async () => {
  const srv = spawn("node", [path.join(root, "server", "server.mjs")], { stdio: "ignore", env: { ...process.env, PORT: "8787", SESSION_SECRET: "x".repeat(40) } });
  await wait(800);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "afd-ext-"));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: "chromium", args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`], viewport: { width: 1280, height: 950 } });
  const R = {}, errs = [];
  try {
    await ctx.route(/^https:\/\/(x\.com|www\.linkedin\.com|www\.instagram\.com|www\.reddit\.com)\//, r => {
      const u = r.request().url().split("?")[0];
      const key = Object.keys(PAGES).find(k => u.startsWith(k));
      r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><title>t</title><body>${key ? PAGES[key] : ""}</body>` });
    });
    let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent("serviceworker");
    R.extensionLoaded = !!sw;
    const site = await ctx.newPage();
    for (const u of ["https://x.com/search?q=from:OpenAI&f=live", "https://www.linkedin.com/company/anthropicresearch/posts/", "https://www.instagram.com/nvidia/", "https://www.reddit.com/r/LocalLLaMA/new/"]) {
      await site.goto(u); await wait(2600);
    }
    R.stored = await sw.evaluate(async () => (await chrome.storage.local.get({ items: [] })).items.map(i => `${i.p}:${i.a}:${i.text.slice(0, 30)}`));

    const app = await ctx.newPage();
    app.on("pageerror", e => errs.push(e.message));
    await app.goto("http://localhost:8787/#today"); await wait(1200);
    R.hero = await app.evaluate(() => document.querySelector(".brief-hero p:not(.date)")?.textContent);
    await app.click('[data-k="side-via-Social"]'); await wait(500);
    R.socialFeed = await app.evaluate(() => [...document.querySelectorAll("#view-today .item")].map(i => i.querySelector(".kind").textContent + " | " + i.querySelector("h4").textContent + " | " + i.querySelector("time").textContent));
    await app.screenshot({ path: out + "/v9-social.png" });
    // live update: a new post arrives while the app is open
    await site.goto("https://x.com/search?q=from:OpenAI&f=live"); await wait(2600);
    await app.bringToFront(); await wait(800);
    R.afterLive = await app.evaluate(() => document.querySelectorAll("#view-today .item").length);
    await app.goto("http://localhost:8787/#you"); await wait(1000);
    R.panel = await app.evaluate(() => document.querySelector("#capture")?.innerText.split("\n").slice(0, 4));
    await app.evaluate(() => document.getElementById("capture").scrollIntoView());
    await app.screenshot({ path: out + "/v9-capture.png" });
  } finally {
    console.log(JSON.stringify({ errs, R }, null, 1));
    await ctx.close(); srv.kill();
  }
})();
