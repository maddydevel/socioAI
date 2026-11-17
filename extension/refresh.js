// Gets fresh updates from public RSS feeds (official blogs, Reddit, Google News), the way any feed reader does.
// Same sources, windows and filters as fetch.py. Runs only inside the AI Follow Desk app page.
(() => {
  const S = window.AFD_SOURCES;
  if (!S) return;
  const DAY = 864e5;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function getText(url) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(url, { credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (r.ok) return await r.text();
        if (r.status === 429) await sleep(5000 * (i + 1)); else await sleep(1000);
      } catch { await sleep(1000); }
    }
    return null;
  }
  const textOf = html => { if (!html) return ""; const d = new DOMParser().parseFromString(html, "text/html"); return (d.body?.textContent || "").replace(/\s+/g, " ").trim(); };
  function clean(s, n = 260) {
    s = textOf(s).replace(/submitted by \/u\/\S+.*$/, "").trim();
    if (s.length <= n) return s;
    const cut = s.slice(0, n); return cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : n) + "…";
  }
  const pdate = s => { if (!s) return null; const d = new Date(s.trim()); return isNaN(d) ? null : d; };
  const recent = (d, days) => d && d > Date.now() - days * DAY && d < Date.now() + DAY;

  function parse(xml) {
    if (!xml) return [];
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) return [];
    const t = (el, name) => el.getElementsByTagName(name)[0]?.textContent || "";
    if (doc.documentElement.localName === "feed") {
      return [...doc.getElementsByTagName("entry")].map(e => {
        const links = [...e.getElementsByTagName("link")];
        const link = (links.find(l => (l.getAttribute("rel") || "alternate") === "alternate") || links[0])?.getAttribute("href") || "";
        return { title: t(e, "title").trim(), link, date: pdate(t(e, "published") || t(e, "updated")), summary: t(e, "summary") || t(e, "content") };
      });
    }
    return [...doc.getElementsByTagName("item")].map(i => ({
      title: t(i, "title").trim(), link: t(i, "link").trim(), date: pdate(t(i, "pubDate") || t(i, "dc:date")),
      summary: t(i, "description"), source: t(i, "source"),
    }));
  }
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

  async function blog(aid, url) {
    const rows = parse(await getText(url)).filter(e => recent(e.date, 45)).sort((a, b) => b.date - a.date).slice(0, 4);
    return rows.map(e => ({ a: aid, via: "Blog", title: clean(e.title, 200), body: clean(e.summary), url: e.link, src: host(url), date: e.date.toISOString() }));
  }
  async function reddit(key, url, label) {
    const rows = parse(await getText(url)).filter(e => recent(e.date, 10)).slice(0, 12);
    return rows.map(e => ({ a: key, via: "Reddit", title: clean(e.title, 220), body: clean(e.summary, 200), url: e.link, src: label, date: e.date.toISOString() }));
  }
  async function news(aid, q) {
    const url = "https://news.google.com/rss/search?" + new URLSearchParams({ q: q + " when:7d", hl: "en-US", gl: "US", ceid: "US:en" });
    const re = new RegExp(S.RELEV[aid], "i");
    const rows = parse(await getText(url)).filter(e => recent(e.date, 8)).sort((a, b) => b.date - a.date);
    const out = [], seen = new Set();
    for (const e of rows) {
      let t = e.title; const src = (e.source || "").trim();
      if (!re.test(t)) continue;
      if (src && t.endsWith(" - " + src)) t = t.slice(0, -(src.length + 3));
      const k = t.toLowerCase().slice(0, 60); if (seen.has(k)) continue; seen.add(k);
      out.push({ a: aid, via: "News", title: clean(t, 220), body: "", url: e.link, src: src || "Google News", date: e.date.toISOString() });
      if (out.length >= 3) break;
    }
    return out;
  }
  async function pool(tasks, n) {
    const res = []; let i = 0;
    await Promise.all(Array.from({ length: n }, async () => { while (i < tasks.length) { const t = tasks[i++]; try { res.push(...await t()); } catch {} } }));
    return res;
  }

  window.AFD_REFRESH = async function () {
    const items = await pool([
      ...Object.entries(S.BLOGS).map(([a, u]) => () => blog(a, u)),
      ...Object.entries(S.NEWS).map(([a, q]) => () => news(a, q)),
    ], 4);
    for (const s of [...S.SUBS, ...Object.keys(S.REDDIT_EXTRA)]) {
      const extra = S.REDDIT_EXTRA[s];
      items.push(...await reddit(extra ? s : "sub-" + s, extra || `https://www.reddit.com/r/${s}/top/.rss?t=week`, extra ? "u/Cohere" : "r/" + s).catch(() => []));
      await sleep(1500);
    }
    const OWNER = { "sub-MistralAI": "mistral", "sub-allenai": "ai2" };
    for (const it of items) if (it.via === "Reddit") {
      const tags = Object.entries(S.MENTIONS).filter(([, rx]) => new RegExp(rx, "i").test(it.title)).map(([a]) => a);
      if (it.a === "sub-kimi") { tags.unshift("moonshot"); it.a = "moonshot"; }
      else if (OWNER[it.a]) tags.unshift(OWNER[it.a]);
      it.tags = [...new Set(tags)].slice(0, 4);
    }
    const seen = new Set();
    const final = items.filter(i => i.url && i.title && /^https:\/\//.test(i.url) && !seen.has(i.url) && seen.add(i.url))
      .sort((a, b) => b.date.localeCompare(a.date));
    return { fetched: new Date().toISOString(), items: final };
  };
})();
