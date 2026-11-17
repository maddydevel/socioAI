// End-to-end: real browser, real server, mock provider. Run: node server/test/e2e.cjs <screenshot-dir>
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const out = process.argv[2] || ".";
const root = path.join(__dirname, "..", "..");
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const mock = spawn("node", [path.join(__dirname, "mock-provider.mjs")], { stdio: "inherit" });
  const srv = spawn("node", [path.join(root, "server", "server.mjs")], { stdio: "inherit", env: { ...process.env, PORT: "8787", OAUTH_MOCK_URL: "http://localhost:8790",
    SESSION_SECRET: "test-secret-test-secret-test-secret-123", X_CLIENT_ID: "x-client", LINKEDIN_CLIENT_ID: "li-client", LINKEDIN_CLIENT_SECRET: "li-secret",
    REDDIT_CLIENT_ID: "rd-client", REDDIT_CLIENT_SECRET: "rd-secret" } }); // Instagram deliberately not configured
  await wait(900);
  const R = {}; const errs = [];
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(e.message));
    p.on("console", m => m.type() === "error" && !/font|ERR_NAME|example\.com|Failed to load resource/i.test(m.text()) && errs.push(m.text()));
    await p.goto("http://localhost:8787/#you"); await wait(900);
    R.initial = await p.evaluate(() => [...document.querySelectorAll(".conn .status")].map(s => s.textContent));
    await p.screenshot({ path: out + "/v8-you-before.png" });

    // 1. X: pop-up, consent, verified
    const [pop] = await Promise.all([p.waitForEvent("popup"), p.click('[data-k="cauth-x"]')]);
    await wait(300);
    R.busy = await p.evaluate(() => document.querySelector('[data-k="cauth-x"]')?.textContent);
    await pop.waitForSelector("#allow"); await pop.click("#allow");
    await pop.waitForEvent("close", { timeout: 5000 }).catch(() => {});
    await wait(500);
    R.popupClosed = pop.isClosed();
    R.xVerified = await p.evaluate(() => [document.querySelector("#conn-x .status").textContent, document.querySelector("#conn-x .ident")?.innerText, document.activeElement.id, document.querySelector("#toastMsg").textContent]);
    await p.screenshot({ path: out + "/v8-you-x.png" });

    // 2. LinkedIn: user cancels -> clear error, nothing verified
    const [pop2] = await Promise.all([p.waitForEvent("popup"), p.click('[data-k="cauth-li"]')]);
    await pop2.waitForSelector("#deny"); await pop2.click("#deny");
    await pop2.waitForEvent("close", { timeout: 5000 }).catch(() => {}); await wait(400);
    R.liCancel = await p.evaluate(() => [document.querySelector("#conn-li .status").textContent, document.querySelector("#conn-li .alert")?.textContent, document.activeElement.dataset.k]);
    // 3. LinkedIn again, allow (OIDC nonce checked)
    const [pop3] = await Promise.all([p.waitForEvent("popup"), p.click('[data-k="cauth-li"]')]);
    await pop3.waitForSelector("#allow"); await pop3.click("#allow");
    await pop3.waitForEvent("close", { timeout: 5000 }).catch(() => {}); await wait(400);
    R.liVerified = await p.evaluate(() => document.querySelector("#conn-li .status").textContent);

    // 4. Reddit with pop-ups blocked: same-tab redirect and back to #you
    await p.evaluate(() => { window.open = () => null; });
    await p.click('[data-k="cauth-rd"]');
    await p.waitForURL(/localhost:8790/); await p.click("#allow");
    await p.waitForURL(/localhost:8787\/#you/); await wait(900);
    R.rdRedirect = await p.evaluate(() => [location.hash, document.querySelector("#conn-rd .status").textContent, document.querySelector("#toastMsg").textContent]);

    // 5. Persisted across reload (encrypted cookie), not in localStorage
    await p.reload(); await wait(900);
    R.afterReload = await p.evaluate(() => [...document.querySelectorAll(".conn .status")].map(s => s.textContent));
    R.cookieOpaque = (await ctx.cookies()).filter(c => c.name === "afd_sess").map(c => ({ httpOnly: c.httpOnly, sameSite: c.sameSite, readable: /ada/i.test(c.value) }));
    // 6. Tampered state is rejected
    const bad = await p.request.get("http://localhost:8787/auth/x/callback?code=abc&state=forged");
    R.forged = (await bad.text()).includes("didn't finish");
    // 7. Disconnect requires same-origin; then works from the app
    const csrf = await p.request.post("http://localhost:8787/auth/x/disconnect", { headers: { Origin: "https://evil.example" } });
    R.csrfBlocked = csrf.status();
    await p.click('[data-k="cd-x"]'); await wait(500);
    R.disconnected = await p.evaluate(() => [document.querySelector("#conn-x .status").textContent, document.activeElement.dataset.k]);
    // 8. Instagram not configured -> labelled unverified fallback
    R.ig = await p.evaluate(() => document.querySelector("#conn-ig .note")?.textContent);
    await p.screenshot({ path: out + "/v8-you-final.png", fullPage: true });
    await p.setViewportSize({ width: 375, height: 812 }); await wait(300);
    await p.screenshot({ path: out + "/v8-you-mobile.png" });
  } finally {
    console.log(JSON.stringify({ errs, R }, null, 1));
    await b.close(); srv.kill(); mock.kill();
  }
})();
