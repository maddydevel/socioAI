// Runs only on AI Follow Desk pages (localhost, a local copy, or addresses you add in Options).
// Hands the captured posts to the page; the page never gets access to the extension itself.
(() => {
  const target = location.origin === "null" ? "*" : location.origin;
  const send = async () => {
    try {
      const { items = [], lastCapture = null } = await chrome.storage.local.get({ items: [], lastCapture: null });
      window.postMessage({ type: "afd-ext-items", version: 1, items, lastCapture }, target);
    } catch { /* extension reloaded */ }
  };
  window.addEventListener("message", e => { if (e.source === window && e.data?.type === "afd-ext-request") send(); });
  chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.items) send(); });
  send();
})();
