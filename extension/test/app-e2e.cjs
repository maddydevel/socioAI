// The all-in-one extension as a first-time user meets it:
// install -> app opens by itself -> welcome -> update now (real feeds) -> browse X -> posts appear -> toolbar icon re-opens the app.
// Run: node extension/test/app-e2e.cjs <screenshot-dir>
const { chromium } = require("playwright");
const path = require("node:path"), fs = require("node:fs"), os = require("node:os");
const out = process.argv[2] || ".";
const ext = path.join(__dirname, "..");
const wait = ms => new Promise(r => setTimeout(r, ms));
const now = new Date().toISOString();

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "afd-app-"));
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: "chromium", args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`], viewport: { width: 1280, height: 950 } });
  const R = {}, errs = [];
  try {
    await ctx.route(/^https:\/\/x\.com\//, r => r.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><main>
      <article data-testid="tweet"><a href="/AnthropicAI/status/901"><time datetime="${now}">now</time></a><div data-testid="tweetText">Claude can now do something new.</div></article></main>` }));
    let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent("serviceworker");
    // 1. Installing opens the app by itself
    await wait(1500);
    let app = ctx.pages().find(p => p.url().includes("/app.html"));
    R.openedOnInstall = !!app;
    if (!app) { app = await ctx.newPage(); await app.goto(sw.url().replace("background.js", "app.html#today")); }
    app.on("pageerror", e => errs.push(e.message));
    app.on("console", m => m.type() === "error" && !/Failed to load resource|net::ERR/i.test(m.text()) && errs.push(m.text()));
    await app.reload(); await wait(1500);
    R.welcome = await app.evaluate(() => document.querySelector("#welcome-h")?.textContent || null);
    R.status = await app.evaluate(() => document.querySelector('[data-k="refresh"]')?.parentElement?.textContent || document.querySelector(".brief-hero .spin")?.parentElement?.textContent);
    await app.screenshot({ path: out + "/v10-welcome.png" });
    await app.click('[data-k="welcomed"]'); await wait(300);
    R.welcomeGone = await app.evaluate(() => !document.querySelector("#welcome-h"));
    // 2. Update now: real public feeds, fetched by the extension page
    const before = await app.evaluate(() => FEED.length);
    if (await app.$('[data-k="refresh"]')) await app.click('[data-k="refresh"]');
    await app.waitForFunction(() => !REFRESH.busy, null, { timeout: 240000 });
    await wait(800);
    R.refresh = await app.evaluate(b => ({ before: b, after: FEED.length, fetched: DATA.fetched, err: REFRESH.err, bySource: FEED.reduce((m, f) => (m[f.via] = (m[f.via] || 0) + 1, m), {}) }), before);
    // 3. Browse X: post appears without any connecting step
    const x = await ctx.newPage(); await x.goto("https://x.com/search?q=from:AnthropicAI&f=live"); await wait(2500);
    await app.bringToFront(); await wait(800);
    R.captured = await app.evaluate(() => CAPTURED.map(c => c.via + ": " + c.title));
    // 4. You: capture switches, no install instructions
    await app.goto(app.url().replace(/#.*$/, "#you")); await wait(900);
    R.youPanel = await app.evaluate(() => [!!document.querySelector('[data-k="capsw-x"]'), /Load unpacked/.test(document.querySelector("#capture").innerText)]);
    await app.click('[data-k="capsw-x"]'); await wait(400);
    R.switchOff = await sw.evaluate(async () => (await chrome.storage.local.get("enabled")).enabled);
    await app.evaluate(() => document.getElementById("capture").scrollIntoView());
    await app.screenshot({ path: out + "/v10-you.png" });
    // 5. Toolbar icon brings the app back
    await x.bringToFront();
    const pagesBefore = ctx.pages().length;
    await sw.evaluate(() => openApp());
    await wait(800);
    R.toolbar = { pagesBefore, pagesAfter: ctx.pages().length, appActive: await app.evaluate(() => document.visibilityState) };
  } finally {
    console.log(JSON.stringify({ errs, R }, null, 1));
    await ctx.close();
  }
})();
