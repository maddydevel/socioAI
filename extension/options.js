const $ = s => document.querySelector(s);
const idFor = o => "bridge-" + btoa(o).replace(/[^A-Za-z0-9]/g, "");

async function render() {
  const { appOrigins = [] } = await chrome.storage.local.get({ appOrigins: [] });
  const rows = appOrigins.map(o => {
    const li = document.createElement("li");
    const s = document.createElement("span"); s.textContent = o;
    const b = document.createElement("button"); b.textContent = "Remove"; b.setAttribute("aria-label", `Remove ${o}`);
    b.addEventListener("click", async () => {
      await chrome.scripting.unregisterContentScripts({ ids: [idFor(o)] }).catch(() => {});
      await chrome.permissions.remove({ origins: [o + "/*"] }).catch(() => {});
      await chrome.storage.local.set({ appOrigins: appOrigins.filter(x => x !== o) });
      render();
    });
    li.append(s, b); return li;
  });
  if (!rows.length) { const li = document.createElement("li"); li.textContent = "None yet. Localhost and local copies work without adding anything."; rows.push(li); }
  $("#list").replaceChildren(...rows);
}
function showErr(msg) { const e = $("#err"); e.hidden = !msg; e.textContent = msg || ""; $("#origin").setAttribute("aria-invalid", String(!!msg)); }

$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  let origin;
  try { const u = new URL($("#origin").value.trim()); if (!/^https?:$/.test(u.protocol)) throw 0; origin = u.origin; }
  catch { showErr("Enter the full address, starting with https://"); $("#origin").focus(); return; }
  const granted = await chrome.permissions.request({ origins: [origin + "/*"] });
  if (!granted) { showErr("Chrome didn't allow access to that address, so the extension can't connect to it."); return; }
  const id = idFor(origin);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (!existing.length) await chrome.scripting.registerContentScripts([{ id, matches: [origin + "/*"], js: ["bridge.js"], runAt: "document_start", allFrames: true, persistAcrossSessions: true }]);
  const { appOrigins = [] } = await chrome.storage.local.get({ appOrigins: [] });
  if (!appOrigins.includes(origin)) await chrome.storage.local.set({ appOrigins: [...appOrigins, origin] });
  showErr(""); $("#origin").value = ""; render();
});
render();
