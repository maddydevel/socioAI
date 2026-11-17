// Generates accounts.json (who to capture) from ../accounts.js, the same list the app uses.
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "accounts.js"), "utf8") + "\n;globalThis.__out = {ACCTS, CATS};";
const ctx = {}; vm.createContext(ctx); vm.runInContext(src, ctx);
const out = { x: {}, li: {}, ig: {}, rd: {}, names: {} };
for (const a of ctx.__out.ACCTS) {
  out.names[a.id] = a.name;
  const L = a.links;
  if (L.x) out.x[L.x.url.split("/").pop().toLowerCase()] = a.id;
  if (L.li) out.li[new URL(L.li.url).pathname.replace(/^\/|\/$/g, "").toLowerCase()] = a.id;
  if (L.ig) out.ig[new URL(L.ig.url).pathname.replace(/^\/|\/$/g, "").toLowerCase()] = a.id;
  if (L.rd) { const k = L.rd.h.toLowerCase(); if (!out.rd[k] || a.sub) out.rd[k] = a.id; } // subreddit accounts win over company links
}
fs.writeFileSync(path.join(here, "accounts.json"), JSON.stringify(out));
console.log(`accounts.json: ${Object.keys(out.x).length} X, ${Object.keys(out.li).length} LinkedIn, ${Object.keys(out.ig).length} Instagram, ${Object.keys(out.rd).length} Reddit`);
