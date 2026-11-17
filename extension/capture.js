// Runs on X, LinkedIn, Instagram and Reddit pages that you open yourself.
// It only reads posts already rendered on screen: no requests, no scrolling, no clicks.
// Only posts by accounts on your AI Follow Desk list are kept.
(() => {
  const host = location.hostname;
  const P = /(^|\.)(x|twitter)\.com$/.test(host) ? "x" : host.endsWith("linkedin.com") ? "li" : host.endsWith("instagram.com") ? "ig" : host.endsWith("reddit.com") ? "rd" : null;
  if (!P) return;
  let ACC = null, enabled = true;
  const sent = new Set();
  const clip = (s, n = 600) => { s = (s || "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const iso = v => { if (!v) return null; const d = new Date(/^\d+$/.test(v) ? Number(v) : v); return isNaN(d) ? null : d.toISOString(); };

  const EXTRACT = {
    x() {
      const out = [];
      for (const art of document.querySelectorAll('article[data-testid="tweet"]')) {
        const time = art.querySelector('a[href*="/status/"] time'), link = time?.closest("a");
        const m = link?.getAttribute("href")?.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/);
        if (!m) continue;
        const id = ACC.x[m[1].toLowerCase()]; if (!id) continue;
        out.push({ p: "x", a: id, author: "@" + m[1], text: clip(art.querySelector('[data-testid="tweetText"]')?.innerText), url: `https://x.com/${m[1]}/status/${m[2]}`, date: iso(time.getAttribute("datetime")) });
      }
      return out;
    },
    li() {
      const out = [];
      for (const el of document.querySelectorAll('[data-urn^="urn:li:activity:"], [data-id^="urn:li:activity:"]')) {
        const urn = el.getAttribute("data-urn") || el.getAttribute("data-id");
        let key = null;
        for (const a of el.querySelectorAll('a[href*="/company/"], a[href*="/in/"], a[href*="/showcase/"]')) {
          const mm = new URL(a.href, location.href).pathname.match(/^\/(company|in|showcase)\/([^/]+)/);
          if (mm) { key = `${mm[1]}/${decodeURIComponent(mm[2]).toLowerCase()}`; break; }
        }
        // On a company or profile page, posts belong to that page
        if (!key || !ACC.li[key]) { const pm = location.pathname.match(/^\/(company|in|showcase)\/([^/]+)/); if (pm) key = `${pm[1]}/${decodeURIComponent(pm[2]).toLowerCase()}`; }
        const id = key && ACC.li[key]; if (!id) continue;
        const name = el.querySelector(".update-components-actor__title, .update-components-actor__name")?.innerText?.split("\n")[0]?.trim();
        const when = (el.querySelector(".update-components-actor__sub-description")?.innerText || "").match(/(\d+\s*(?:mo|yr|[smhdw]))\b/i)?.[1];
        out.push({ p: "li", a: id, author: name || ACC.names[id], text: clip(el.querySelector(".update-components-text, .feed-shared-inline-show-more-text, .feed-shared-text")?.innerText), url: `https://www.linkedin.com/feed/update/${urn}/`, date: null, timeText: clip(when, 40) });
      }
      return out;
    },
    ig() {
      const out = [];
      const code = href => href?.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
      for (const art of document.querySelectorAll("article")) {
        const user = [...art.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute("href").split("/")[1]?.toLowerCase()).find(u => u && ACC.ig[u]);
        const c = code(art.querySelector('a[href*="/p/"], a[href*="/reel/"]')?.getAttribute("href"));
        if (!user || !c) continue;
        const cap = [...art.querySelectorAll("h1, span")].map(s => s.innerText).filter(t => t && t.length > 20).sort((a, b) => b.length - a.length)[0];
        out.push({ p: "ig", a: ACC.ig[user], author: "@" + user, text: clip(cap), url: `https://www.instagram.com/${c[1]}/${c[2]}/`, date: iso(art.querySelector("time[datetime]")?.getAttribute("datetime")) });
      }
      // Profile grid: posts on /username/ belong to that account
      const pm = location.pathname.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
      const owner = pm && ACC.ig[pm[1].toLowerCase()];
      if (owner) for (const a of document.querySelectorAll('main a[href*="/p/"], main a[href*="/reel/"]')) {
        const c = code(a.getAttribute("href")); if (!c) continue;
        out.push({ p: "ig", a: owner, author: "@" + pm[1], text: clip(a.querySelector("img")?.getAttribute("alt")), url: `https://www.instagram.com/${c[1]}/${c[2]}/`, date: null });
      }
      return out;
    },
    rd() {
      const out = [];
      const pick = (sub, author) => ACC.rd[(sub || "").toLowerCase()] || ACC.rd["u/" + (author || "").toLowerCase()];
      for (const el of document.querySelectorAll("shreddit-post")) {
        const id = pick(el.getAttribute("subreddit-prefixed-name"), el.getAttribute("author")); if (!id) continue;
        const pl = el.getAttribute("permalink"); if (!pl) continue;
        out.push({ p: "rd", a: id, author: el.getAttribute("subreddit-prefixed-name") || "u/" + el.getAttribute("author"), text: clip(el.getAttribute("post-title"), 300), url: new URL(pl, "https://www.reddit.com").href, date: iso(el.getAttribute("created-timestamp")) });
      }
      for (const el of document.querySelectorAll("div.thing.link")) {
        const sub = el.getAttribute("data-subreddit-prefixed") || ("r/" + (el.getAttribute("data-subreddit") || ""));
        const id = pick(sub, el.getAttribute("data-author")); if (!id) continue;
        const pl = el.getAttribute("data-permalink"); if (!pl) continue;
        out.push({ p: "rd", a: id, author: sub, text: clip(el.querySelector("a.title")?.innerText, 300), url: new URL(pl, "https://www.reddit.com").href, date: iso(el.getAttribute("data-timestamp")) });
      }
      return out;
    },
  };

  function scan() {
    if (!ACC || !enabled) return;
    const items = EXTRACT[P]().filter(i => i.url && (i.text || P === "ig") && !sent.has(i.url + "|" + i.text.length));
    if (!items.length) return;
    items.forEach(i => sent.add(i.url + "|" + i.text.length));
    chrome.runtime.sendMessage({ type: "afd-capture", items: items.slice(0, 50) }).catch(() => {});
  }
  let t = null;
  const soon = () => { clearTimeout(t); t = setTimeout(scan, 700); };

  chrome.storage.local.get({ enabled: { x: true, li: true, ig: true, rd: true } }).then(s => { enabled = s.enabled[P] !== false; });
  chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.enabled) enabled = ch.enabled.newValue?.[P] !== false; });
  fetch(chrome.runtime.getURL("accounts.json")).then(r => r.json()).then(j => {
    ACC = j; scan();
    new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  });
})();
