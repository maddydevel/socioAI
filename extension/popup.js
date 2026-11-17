const SITES = [["x", "X"], ["li", "LinkedIn"], ["ig", "Instagram"], ["rd", "Reddit"]];
const $ = s => document.querySelector(s);
let confirmClear = false;

async function render() {
  const { items = [], enabled = { x: true, li: true, ig: true, rd: true }, lastCapture = null } = await chrome.storage.local.get({ items: [], enabled: { x: true, li: true, ig: true, rd: true }, lastCapture: null });
  $("#summary").textContent = items.length
    ? `${items.length} posts saved. Last one ${new Date(lastCapture).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`
    : "No posts yet. Open X, LinkedIn, Instagram or Reddit and visit an account on your list.";
  $("#list").replaceChildren(...SITES.map(([k, name]) => {
    const li = document.createElement("li");
    const b = document.createElement("b"); b.textContent = name;
    const n = document.createElement("span"); n.textContent = String(items.filter(i => i.p === k).length);
    const sw = document.createElement("input"); sw.type = "checkbox"; sw.role = "switch"; sw.className = "sw"; sw.checked = enabled[k] !== false;
    sw.setAttribute("aria-label", `Save posts from ${name}`);
    sw.addEventListener("change", async () => { enabled[k] = sw.checked; await chrome.storage.local.set({ enabled }); });
    li.append(b, n, sw); return li;
  }));
}
$("#clear").addEventListener("click", async () => {
  if (!confirmClear) { confirmClear = true; $("#clear").textContent = "Click again to clear"; setTimeout(() => { confirmClear = false; $("#clear").textContent = "Clear saved posts"; }, 4000); return; }
  await chrome.storage.local.set({ items: [] }); confirmClear = false; $("#clear").textContent = "Cleared"; render();
});
chrome.storage.onChanged.addListener(render);
render();
