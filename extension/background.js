// Stores captured posts locally (chrome.storage.local). Nothing leaves your browser.
const HOSTS = { x: /^(x|twitter)\.com$/, li: /^www\.linkedin\.com$/, ig: /^www\.instagram\.com$/, rd: /^(www|old)\.reddit\.com$/ };
const MAX = 1500, MAX_AGE = 30 * 24 * 3600 * 1000;
let queue = Promise.resolve();

function clean(i, tabHost) {
  if (!i || typeof i !== "object" || !HOSTS[i.p] || !HOSTS[i.p].test(tabHost)) return null;
  let url; try { url = new URL(i.url); } catch { return null; }
  if (url.protocol !== "https:" || !HOSTS[i.p].test(url.hostname)) return null;
  const s = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
  const d = i.date && !isNaN(new Date(i.date)) ? new Date(i.date).toISOString() : null;
  return { p: i.p, a: s(i.a, 60), author: s(i.author, 120), text: s(i.text, 600), url: url.href, date: d, timeText: s(i.timeText, 40) || null, capturedAt: new Date().toISOString() };
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "afd-capture" || !sender.tab?.url || !Array.isArray(msg.items)) return;
  const tabHost = new URL(sender.tab.url).hostname;
  const incoming = msg.items.slice(0, 50).map(i => clean(i, tabHost)).filter(Boolean);
  if (!incoming.length) return;
  queue = queue.then(async () => {
    const { items = [] } = await chrome.storage.local.get({ items: [] });
    const byUrl = new Map(items.map(i => [i.url, i]));
    for (const n of incoming) {
      const old = byUrl.get(n.url);
      byUrl.set(n.url, old ? { ...old, text: n.text.length > old.text.length ? n.text : old.text, date: old.date || n.date, timeText: old.timeText || n.timeText } : n);
    }
    const cutoff = Date.now() - MAX_AGE;
    const next = [...byUrl.values()].filter(i => new Date(i.capturedAt).getTime() > cutoff)
      .sort((a, b) => (b.date || b.capturedAt).localeCompare(a.date || a.capturedAt)).slice(0, MAX);
    await chrome.storage.local.set({ items: next, lastCapture: new Date().toISOString() });
  }).catch(() => {});
});
