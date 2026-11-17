// Built from app.src.html by build-app.mjs. Edit app.src.html, not this file.
let DATA = window.AFD_FEED || JSON.parse(document.getElementById("feed-data").textContent.replace("/*FEED*/","").replace("/*END*/",""));
let BASE_FEED = DATA.items.filter(f=>BY[f.a]).sort((a,b)=>b.date.localeCompare(a.date));
let FEED = BASE_FEED, CAPTURED = [];
const EXT = {connected:false, last:null};
let FETCHED = new Date(DATA.fetched);
const updatesFor = id => FEED.filter(f=>f.a===id || (f.tags||[]).includes(id));

/* ---------- icons (inline SVG, one stroke style) ---------- */
const ICONS = {
  today:'<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  accounts:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.7-3 3-4.8 5.5-4.8s4.8 1.8 5.5 4.8"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.4c2.3.1 4 1.7 4.7 4.6"/>',
  follow:'<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.6 2.6 5-5.4"/>',
  you:'<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.9-3.6 3.8-5.6 7-5.6s6.1 2 7 5.6"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  star:'<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke-linejoin="round"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  play:'<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke-linejoin="round"/>',
  left:'<path d="m15 5-7 7 7 7"/>', right:'<path d="m9 5 7 7-7 7"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  monitor:'<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16.5V20"/>',
  blog:'<path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5M8.5 13h7M8.5 16.5h5"/>',
  news:'<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M7 9h6M7 12.5h10M7 16h10"/>',
  alert:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.2v.3"/>',
  shield:'<path d="M12 3 5 6v5.5c0 4.3 2.9 7.7 7 9.5 4.1-1.8 7-5.2 7-9.5V6z" stroke-linejoin="round"/><path d="m8.8 12.2 2.3 2.3 4.2-4.6"/>',
  live:'<circle cx="12" cy="12" r="2"/><path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8"/>',
};
const PICONS = {
  x:'<path d="M4.5 4h4l11 16h-4z" fill="currentColor" stroke="none"/><path d="M19 4l-6.3 7.2M5 20l6.3-7.2" stroke-width="1.8"/>',
  li:'<rect x="3" y="3" width="18" height="18" rx="3.5" fill="currentColor" stroke="none"/><path d="M8 10.5V17M8 7.3v.2M11.5 17v-6.5M11.5 13.2c0-1.6 1-2.8 2.5-2.8s2.3 1 2.3 2.8V17" stroke="var(--card)" stroke-width="2"/>',
  ig:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  rd:'<circle cx="12" cy="13.5" r="7" /><circle cx="9.3" cy="13" r="1" fill="currentColor"/><circle cx="14.7" cy="13" r="1" fill="currentColor"/><path d="M9.5 16.2c1.5 1 3.5 1 5 0M12 6.5l1.2-3.3 3.3.8"/><circle cx="17.5" cy="4.3" r="1.1"/>',
};
function svg(paths, size=20, extra=""){
  const t = document.createElement("template");
  t.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true" ${extra}>${paths}</svg>`;
  return t.content.firstChild;
}
const icon = (n, s) => svg(ICONS[n], s);
const pIcon = (p, s=18) => { const el = svg(PICONS[p], s); el.classList.add("pi"); el.style.setProperty("--pc", `var(${PL[p].col})`); return el; };

/* ---------- safe DOM building ---------- */
function h(tag, props, ...kids){
  const el = document.createElement(tag);
  for (const [k,v] of Object.entries(props||{})){
    if (v==null || v===false) continue;
    if (k==="class") el.className = v;
    else if (k==="style") el.style.cssText = v;
    else if (k==="data") Object.assign(el.dataset, v);
    else el.setAttribute(k, v===true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c!=null && c!==false) el.append(c instanceof Node ? c : String(c));
  return el;
}
// replaceChildren() would print "null" and stringify arrays; put() flattens and skips empties
const put = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k=>k!=null && k!==false));
const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
const newTab = () => h("span",{class:"sr-only"}," (opens in a new tab)");
const ext = (href, props, ...kids) => { const u = safeUrl(href); return u ? h("a", {href:u, target:"_blank", rel:"noopener noreferrer", ...props}, ...kids, newTab()) : h("span", props, ...kids); };

/* ---------- state ---------- */
const store = {
  get(k,d){ try { const v = localStorage.getItem("afd:"+k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k,v){ try { localStorage.setItem("afd:"+k, JSON.stringify(v)); } catch {} }
};
let followed = store.get("followed", {});
let starred = store.get("starred", []);
let conn = store.get("conn", {});
const VIEWS = [["today","Today","today"],["accounts","Accounts","accounts"],["follow","Follow","follow"],["you","You","you"]];
const VIEW_IDS = VIEWS.map(v=>v[0]);
const state = {view:"today", cat:"", plat:"", q:"", starOnly:false, via:"", acct:"", sprintPlat:"x", open:{}, skipped:[], welcome:null, connEdit:null, lastKey:{}};

const $ = s => document.querySelector(s);
const catOf = id => CATS.find(c=>c.id===id);
const initials = n => n.replace(/^r\//,"").split(/[\s.]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const avatar = (a, s=36) => h("div", {class:`av${a.person?" person":""}`, style:`--cat:var(${catOf(a.cat).color});--s:${s}px`, "aria-hidden":"true"}, initials(a.name));
const ago = iso => { const hr = Math.max(0, (Date.now() - new Date(iso))/36e5); if (hr<1) return "just now"; if (hr<24) return Math.round(hr)+"h ago"; const d = Math.round(hr/24); return d<8 ? d+"d ago" : new Date(iso).toLocaleDateString(undefined,{day:"numeric",month:"short"}); };
const announce = msg => { const l = $("#live"); l.textContent = ""; setTimeout(()=>{ l.textContent = msg; }, 60); };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const wide = matchMedia("(min-width: 1024px)");
const VIA = {Blog:{label:"Official blog",col:"--ok",ic:"blog"}, News:{label:"News",col:"--muted",ic:"news"}, Reddit:{label:"Reddit",col:"--rd",pic:"rd"}, X:{label:"Post on X",col:"--fg",pic:"x"}, LinkedIn:{label:"LinkedIn post",col:"--li",pic:"li"}, Instagram:{label:"Instagram post",col:"--ig",pic:"ig"}};

function matches(a){
  if (state.cat && a.cat!==state.cat) return false;
  if (state.plat && !a.links[state.plat]) return false;
  if (state.starOnly && !starred.includes(a.id)) return false;
  if (state.q){ const hay = (a.name+" "+a.role+" "+Object.values(a.links).map(l=>l.h).join(" ")).toLowerCase(); if (!hay.includes(state.q.toLowerCase())) return false; }
  return true;
}
function feedItemOk(f){
  if (state.via==="Social"){ if (!f.captured) return false; }
  else if (state.via && f.via!==state.via) return false;
  if (state.acct && f.a!==state.acct && !(f.tags||[]).includes(state.acct)) return false;
  if (state.q){ const q = state.q.toLowerCase(); if (!(f.title+" "+f.body+" "+f.src+" "+BY[f.a].name).toLowerCase().includes(q) && !matches(BY[f.a])) return false; }
  return true;
}
const activeFilters = () => [state.via, state.plat, state.starOnly, state.acct].filter(Boolean).length;
// Lists animate in only when what they show changes, not on every re-render
function freshList(view){ const key = [view,state.cat,state.via,state.q,state.acct,state.plat,state.starOnly,JSON.stringify(state.open)].join("|"); const fresh = state.lastKey[view]!==key; state.lastKey[view] = key; return fresh && !reduceMotion.matches; }

/* ---------- toast (feedback with undo) ---------- */
let toastTimer = null, toastUndo = null;
function toast(msg, undo){
  const t = $("#toast"); $("#toastMsg").textContent = msg;
  toastUndo = undo || null; $("#toastUndo").hidden = !undo;
  t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 5000);
}
function hideToast(){ $("#toast").classList.remove("show"); toastUndo = null; }
$("#toast").addEventListener("pointerenter", ()=>clearTimeout(toastTimer));
$("#toast").addEventListener("pointerleave", ()=>{ toastTimer = setTimeout(hideToast, 2500); });
$("#toast").addEventListener("focusin", ()=>clearTimeout(toastTimer));
$("#toastUndo").addEventListener("click", ()=>{ const u = toastUndo; hideToast(); u?.(); });

/* ---------- actions ---------- */
function setFollowed(key, on, {quiet=false}={}){
  const [id,p] = key.split(":");
  if (on) followed[key] = true; else delete followed[key];
  store.set("followed", followed); renderAll();
  if ($("#brief").open){ const cards = $("#bTrack").querySelectorAll(".b-card"); deck.forEach((f,i)=>{ if (!f.done && f.a===id){ const nc = briefCard(f,i); cards[i].replaceWith(nc); briefObs?.observe(nc); } }); setBriefIdx(briefIdx, false); }
  if (!quiet) toast(on ? `${BY[id].name} marked followed on ${PL[p].name}` : `${BY[id].name} unmarked on ${PL[p].name}`, ()=>setFollowed(key, !on, {quiet:true}));
}
function toggleStar(id, btn){
  if (starred.includes(id)){ starred = starred.filter(s=>s!==id); toast(`${BY[id].name} unstarred`, ()=>{ starred.push(id); store.set("starred",starred); renderAll(); }); }
  else if (starred.length<5){ starred.push(id); const left = 5-starred.length; toast(`${BY[id].name} starred. Turn on their notifications on X. ${left} star${left===1?"":"s"} left.`, ()=>{ starred = starred.filter(s=>s!==id); store.set("starred",starred); renderAll(); }); }
  else return toast("You can star five accounts. Unstar one first.");
  store.set("starred", starred); renderAll();
  requestAnimationFrame(()=>document.querySelectorAll(`[data-star="${CSS.escape(id)}"]`).forEach(b=>{ b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }));
}
const starBtn = (a, k) => a.sub ? null : h("button",{class:"star","aria-pressed":String(starred.includes(a.id)),"aria-label":`Star ${a.name} for notifications`, data:{star:a.id, k}}, icon("star",20));

/* ---------- navigation ---------- */
function renderNav(){
  const mk = (pre) => VIEWS.map(([id,label,ic])=>h("a",{href:"#"+id, "aria-current": state.view===id ? "page" : null, "data-k":`${pre}-nav-${id}`}, icon(ic, 22), h("span",null,label)));
  put($("#topNav"), ...mk("t"));
  put($("#bottomNav"), ...mk("b"));
  const n = Object.keys(PL).filter(p=>isVerified(p)).length;
  put($("#meBtn"), icon("you",22), n ? h("span",{class:"dot","aria-hidden":"true"}) : null);
  $("#meBtn").setAttribute("aria-label", `You: ${n} of 4 accounts verified, follow progress`);
}

/* ---------- filters (sidebar on desktop, sheet on smaller screens) ---------- */
function catCounts(){ return Object.fromEntries(CATS.map(c=>[c.id, FEED.filter(f=>BY[f.a].cat===c.id).length])); }
function filterControls(prefix){
  const counts = catCounts();
  const plats = [["","All platforms"],["x","On X"],["li","On LinkedIn"],["ig","On Instagram"],["rd","On Reddit"]];
  return [
    wide.matches || prefix==="side" ? h("div",null, h("h2",null,"Categories"), h("div",{class:"side-list", role:"group", "aria-label":"Category"},
      h("button",{class:"side-cat","aria-pressed":String(state.cat===""), style:"--cat:var(--fg)", data:{cat:"", k:prefix+"-cat-all"}}, h("span",{class:"dot"}), "All categories", h("span",{class:"n"}, FEED.length)),
      CATS.map(c=>h("button",{class:"side-cat","aria-pressed":String(state.cat===c.id), style:`--cat:var(${c.color})`, data:{cat:c.id, k:prefix+"-cat-"+c.id}}, h("span",{class:"dot"}), c.name.replace(" AI companies","").replace("AI researchers & builders","Researchers & builders").replace("CEOs & industry leaders","Leaders"), h("span",{class:"n"}, counts[c.id], h("span",{class:"sr-only"}," updates")))))) : null,
    h("div",null, h("h2",null,"Source"), h("div",{class:"seg", role:"group", "aria-label":"Source"},
      [["","All"], EXT.connected ? ["Social",`Social posts (${CAPTURED.length})`] : null,["Blog","Official blogs"],["News","News"],["Reddit","Reddit"]].filter(Boolean).map(([v,l])=>h("button",{"aria-pressed":String(state.via===v), data:{via:v, k:prefix+"-via-"+(v||"all")}}, l)))),
    h("div",{class:"field-s"}, h("label",{for:prefix+"-plat"},"Accounts on"), (()=>{ const s = h("select",{id:prefix+"-plat", "data-k":prefix+"-plat", "data-platsel":"1"}, plats.map(([v,l])=>h("option",{value:v}, l))); s.value = state.plat; return s; })()),
    h("button",{class:"switch", role:"switch", "aria-checked":String(state.starOnly), data:{staronly:"1", k:prefix+"-star"}}, "Starred accounts only", h("span",{class:"track","aria-hidden":"true"})),
    activeFilters() ? h("button",{class:"linkish clear", data:{clearall:"1", k:prefix+"-clear"}}, "Clear filters") : null,
  ];
}
function renderFilters(){
  put($("#sideHost"), ...(wide.matches ? filterControls("side") : []));
  const d = $("#filterDlg");
  if (d.open) put(d.querySelector(".dlg-body"), ...filterControls("sheet"));
  const n = activeFilters();
  put($("#filterBtn"), icon("filter",22), n ? h("span",{class:"n","aria-hidden":"true"}, n) : null);
  $("#filterBtn").setAttribute("aria-label", n ? `Filters, ${n} active` : "Filters");
  const counts = catCounts();
  put($("#catChips"), 
    h("button",{class:"chip","aria-pressed":String(state.cat===""), data:{cat:"", k:"chip-all"}}, "All", h("span",{class:"n"}, FEED.length)),
    CATS.map(c=>h("button",{class:"chip","aria-pressed":String(state.cat===c.id), style:`--cat:var(${c.color})`, data:{cat:c.id, k:"chip-"+c.id}}, h("span",{class:"dot","aria-hidden":"true"}), c.short, h("span",{class:"n"}, counts[c.id]))));
  $("#toolbar").hidden = state.view==="you";
}
function openFilters(){
  const d = $("#filterDlg");
  put(d, h("div",{class:"grab","aria-hidden":"true"}),
    h("div",{class:"dlg-head"}, h("h3",{id:"filterTitle", style:"flex:1"}, "Filters"), h("button",{class:"icon-btn", data:{dlgclose:"filterDlg", k:"f-close"}, "aria-label":"Close filters"}, icon("close",22))),
    h("div",{class:"dlg-body"}, filterControls("sheet")),
    h("div",{class:"dlg-body", style:"padding-top:0"}, h("button",{class:"btn primary", data:{dlgclose:"filterDlg", k:"f-done"}}, "Show results")));
  d.showModal();
}

/* ---------- Today ---------- */
function liveLinks(accts){
  const out = [];
  const handles = accts.filter(a=>a.links.x).map(a=>a.links.x.h.slice(1));
  if (handles.length) out.push(ext(`https://x.com/search?q=${encodeURIComponent(handles.map(x=>"from:"+x).join(" OR "))}&f=live`, {class:"btn sm quiet", title:"Newest posts from these accounts on X"}, pIcon("x",16), "Live"));
  const subs = [...new Set(accts.filter(a=>a.links.rd && a.links.rd.h.startsWith("r/")).map(a=>a.links.rd.h.slice(2)))];
  if (subs.length) out.push(ext(`https://www.reddit.com/r/${subs.join("+")}/new/`, {class:"btn sm quiet", title:"Newest posts in these subreddits"}, pIcon("rd",16), "Live"));
  return out;
}
function postCard(f, n, anim){
  const a = BY[f.a], v = VIA[f.via];
  const tags = (f.tags||[]).filter(t=>t!==f.a && BY[t]).slice(0,3);
  const fk = a.links.x ? a.id+":x" : null;
  return h("article",{class:"item"+(anim?" enter":""), style:`--cat:var(${catOf(a.cat).color});--n:${Math.min(n,8)}`},
    h("div",{class:"meta"}, avatar(a, 28),
      h("button",{class:"who", data:{acct:a.id}, "aria-haspopup":"dialog"}, a.name),
      h("span",{class:"kind", style:`--kc:var(${v.col})`}, v.ic ? icon(v.ic,15) : pIcon(v.pic,15), v.label),
      h("span",null, f.captured || f.via==="Reddit" ? f.src : `via ${f.src}`),
      h("time",{datetime:f.date, title: f.captured ? "Saved from your browser" : null}, f.noDate ? `seen ${ago(f.date)}${f.timeText ? ", posted "+f.timeText+" ago" : ""}` : ago(f.date))),
    h("h4",null, ext(f.url, null, f.title)),
    f.body ? h("p",null,f.body) : null,
    h("div",{class:"acts"},
      tags.map(t=>h("button",{class:"tag", data:{acct:t}, "aria-haspopup":"dialog"}, BY[t].name)),
      h("span",{class:"spacer"}),
      fk && !followed[fk] ? ext(a.links.x.url, {class:"btn sm", "data-ret":fk}, pIcon("x",15), "Follow") : null,
      starBtn(a, `star-${f.url}`)));
}
function feedsRow(){
  const ps = Object.keys(PL).filter(p=>handleOf(p) || isVerified(p));
  if (!ps.length) return h("p",{class:"note"}, "Connect your accounts to open your own X, LinkedIn, Reddit and Instagram feeds from here. ", h("a",{href:"#you", class:"linkish"}, "Connect accounts"));
  return h("div",{class:"feeds-row", role:"group", "aria-label":"Your feeds"}, h("span",{class:"lbl"},"Your feeds"), ps.flatMap(p=>CONNECT[p].watch.map(([l,u])=>ext(u,{class:"btn sm"}, pIcon(p,16), l))));
}
function renderToday(){
  const anim = freshList("today");
  const counts = catCounts();
  const deck = buildDeck();
  const pos = store.get("briefPos", {});
  const resumeAt = pos.ed===DATA.fetched && pos.i>0 && pos.i<deck.length ? pos.i : 0;
  const hero = h("section",{class:"brief-hero", "aria-labelledby":"h-today"},
    h("p",{class:"date", style:"margin:0"}, h("span",{class:"live","aria-hidden":"true"}), FETCHED.toLocaleDateString(undefined,{weekday:"long", day:"numeric", month:"long"})),
    h("h2",{id:"h-today", tabindex:"-1", class:"view-title-anchor"}, "Your AI briefing"),
    IN_EXT ? h("p",{class:"note", style:"display:flex;align-items:center;gap:10px;flex-wrap:wrap", "aria-live":"polite"},
      REFRESH.busy ? [h("span",{class:"spin","aria-hidden":"true"}), "Getting the latest updates…"]
      : [REFRESH.err ? h("span",{style:"color:var(--bad)"}, REFRESH.err) : `Updated ${ago(DATA.fetched)}. Refreshes by itself twice a day.`, h("button",{class:"linkish", data:{refresh:"1", k:"refresh"}}, "Update now")]) : null,
    h("p",null, `${FEED.length} updates from ${new Set(FEED.map(f=>f.a)).size} accounts${CAPTURED.length ? `, including ${CAPTURED.length} posts saved from X, LinkedIn, Instagram and Reddit as you browsed` : ""}. The briefing walks you through the ${deck.length-1} newest stories, about ten minutes of reading.`),
    h("div",{class:"cta-row"},
      h("button",{class:"btn primary", data:{brief:String(resumeAt), k:"brief-start"}}, icon("play",18), resumeAt ? `Resume at story ${resumeAt+1}` : "Start briefing"),
      resumeAt ? h("button",{class:"btn quiet", data:{brief:"0", k:"brief-restart"}}, "Start over") : null),
    h("div",{class:"mix"},
      h("div",{class:"mix-bar"+(anim?" intro":""), role:"img", "aria-label":"Updates by category: "+CATS.map(c=>`${c.short} ${counts[c.id]}`).join(", ")}, CATS.map((c,i)=>h("span",{style:`--cat:var(${c.color});--n:${counts[c.id]};--i:${i}`}))),
      h("div",{class:"legend","aria-hidden":"true"}, CATS.map(c=>h("span",{style:`--cat:var(${c.color})`}, h("i"), `${c.short} ${counts[c.id]}`)))),
    feedsRow(),
    EXT.connected ? null : h("p",{class:"note"}, "Want real posts from X, LinkedIn, Instagram and Reddit here? ", h("a",{href:"#you", class:"linkish", "data-capture":"1"}, "Add the browser extension"), " and they're saved as you browse."));
  const bar = state.acct ? h("div",{class:"cta-row"}, h("span",{class:"muted"}, "Showing updates about"), h("button",{class:"chip","aria-pressed":"true", data:{clearacct:"1", k:"clearacct"}}, BY[state.acct].name, icon("close",16), h("span",{class:"sr-only"},", remove filter"))) : null;
  const sections = [];
  let n = 0;
  for (const c of (state.cat ? CATS.filter(c=>c.id===state.cat) : CATS)){
    const accts = ACCTS.filter(a=>a.cat===c.id && (!state.plat || a.links[state.plat]) && (!state.starOnly || starred.includes(a.id)));
    if (!accts.length) continue;
    const ids = new Set(accts.map(a=>a.id));
    const items = FEED.filter(f=>ids.has(f.a) && feedItemOk(f));
    if (!items.length && (state.acct || state.q || state.via)) continue;
    const lim = state.open[c.id] ? items.length : 4;
    const hid = "cat-h-"+c.id;
    sections.push(h("section",{class:"cat-sec", style:`--cat:var(${c.color})`, "aria-labelledby":hid},
      h("div",{class:"cat-head"}, h("span",{class:"dot","aria-hidden":"true"}), h("h3",{id:hid}, c.name), h("span",{class:"count"}, `${items.length} update${items.length===1?"":"s"}`), h("div",{class:"live"}, liveLinks(accts))),
      items.length ? h("div",{class:"list"}, items.slice(0,lim).map(f=>postCard(f, n++, anim)))
                   : h("p",{class:"empty"}, "No updates in the last few weeks. These accounts post mostly on X; use Live to see their newest posts."),
      items.length>4 ? h("button",{class:"more", "aria-expanded":String(!!state.open[c.id]), data:{more:c.id, k:"more-"+c.id}}, state.open[c.id] ? "Show fewer" : `Show ${items.length-4} more from ${c.short}`) : null));
  }
  if (!sections.length) sections.push(h("p",{class:"empty"}, "Nothing matches these filters. ", h("button",{class:"linkish", data:{clearall:"1", k:"empty-clear"}}, "Clear filters")));
  const welcome = IN_EXT && !store.get("welcomed", false) ? h("section",{class:"panel", "aria-labelledby":"welcome-h", style:"border-color:var(--primary)"},
    h("h3",{id:"welcome-h"}, "Welcome to AI Follow Desk"),
    h("ol",{class:"steps-mini", style:"color:var(--fg);font-size:15.5px;gap:8px"},
      h("li",null, h("b",null,"Read: "), "press Start briefing for today's top AI stories, one at a time."),
      h("li",null, h("b",null,"Follow: "), "open Follow and work through the accounts on X, LinkedIn, Instagram and Reddit."),
      h("li",null, h("b",null,"Browse: "), "use those sites as usual. Posts from your list show up here by themselves.")),
    h("div",{class:"cta-row"}, h("button",{class:"btn primary", data:{welcomed:"1", k:"welcomed"}}, "Got it"))) : null;
  put($("#view-today"), welcome, hero, bar, ...sections);
}

/* ---------- Accounts ---------- */
function platRow(a, p, prefix){
  const l = a.links[p];
  if (!l) return h("div",{class:"plat none"}, h("span",null, pIcon(p,18), h("span",{class:"sr-only"}, `No official ${PL[p].name} profile`), h("span",{"aria-hidden":"true"},"Not on "+PL[p].name)));
  const key = a.id+":"+p, f = !!followed[key];
  return h("div",{class:"plat"},
    ext(l.url, {title:`Open ${a.name} on ${PL[p].name}`, "data-ret":key}, pIcon(p,18), h("span",{class:"sr-only"}, PL[p].name+" "), h("span",{class:"h"}, l.h)),
    h("button",{"aria-pressed":String(f), "aria-label":`Followed on ${PL[p].name}`, data:{follow:key, k:prefix+key}}, icon(f?"check":"plus",18)));
}
function renderAccounts(){
  const anim = freshList("accounts");
  const list = ACCTS.filter(matches);
  put($("#view-accounts"), 
    h("div",null, h("h2",{class:"view-title", id:"h-accounts", tabindex:"-1"}, "Accounts"), h("p",{class:"lede"}, `${list.length} accounts and communities. Open a profile, follow it there, then tick it here.`)),
    list.length ? h("div",{class:"dir"}, list.map((a,i)=>{
      const c = catOf(a.cat), n = updatesFor(a.id).length;
      return h("article",{class:"acct"+(anim?" enter":""), style:`--cat:var(${c.color});--n:${i}`},
        h("div",{class:"acct-top"}, avatar(a,44),
          h("div",{class:"t"}, h("button",{class:"name", data:{acct:a.id, k:"d-name-"+a.id}, "aria-haspopup":"dialog"}, a.name), h("span",{class:"role"}, a.role)),
          starBtn(a,"d-star-"+a.id)),
        h("div",{class:"row-sb"}, h("span",{class:"cat-pill"}, h("i"), c.short),
          n ? h("button",{class:"linkish", data:{feedacct:a.id, k:"d-upd-"+a.id}}, `${n} recent update${n>1?"s":""}`) : null),
        h("div",{class:"plats"}, Object.keys(PL).filter(p=>!(a.sub && p!=="rd")).map(p=>platRow(a,p,"d-"))));
    })) : h("p",{class:"empty"}, "No accounts match. ", h("button",{class:"linkish", data:{clearall:"1", k:"acc-clear"}}, "Clear filters")));
}

/* ---------- Follow ---------- */
function ring(done, total, col, label){
  const r = 28, C = 2*Math.PI*r, frac = total ? done/total : 0;
  const s = svg(`<circle class="bg" cx="32" cy="32" r="${r}"/><circle class="fg" cx="32" cy="32" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-frac)).toFixed(1)}"/>`, 64);
  s.setAttribute("viewBox","0 0 64 64"); s.removeAttribute("stroke");
  return h("div",{class:"ring", style:`--rc:var(${col})`, role:"img", "aria-label":label}, s, h("b",{"aria-hidden":"true"}, Math.round(frac*100)+"%"));
}
let lastSprintKey = null;
function renderFollow(){
  const p = state.sprintPlat;
  const q = ACCTS.filter(a=>a.links[p] && matches(a)).map(a=>({a, l:a.links[p], key:a.id+":"+p}));
  const order = [...q].sort((x,y)=>state.skipped.indexOf(x.key)-state.skipped.indexOf(y.key));
  const pending = order.filter(i=>!followed[i.key]);
  const cur = pending[0];
  const done = q.length - pending.length;
  const swap = cur && lastSprintKey && cur.key!==lastSprintKey && !reduceMotion.matches;
  lastSprintKey = cur?.key || null;
  put($("#view-follow"), 
    h("div",null, h("h2",{class:"view-title", id:"h-follow", tabindex:"-1"}, "Follow sprint"), h("p",{class:"lede"}, "One account at a time: open the profile, follow it there, come back and mark it.")),
    h("div",{class:"seg", role:"group", "aria-label":"Platform"}, Object.keys(PL).map(k=>{ const tot = ACCTS.filter(a=>a.links[k]).length, d = ACCTS.filter(a=>a.links[k] && followed[a.id+":"+k]).length; return h("button",{"aria-pressed":String(k===p), data:{sprint:k, k:"sp-"+k}, style:"display:inline-flex;align-items:center;gap:8px"}, pIcon(k,16), PL[k].name, h("span",{class:"muted", style:"font-size:13px"}, `${d}/${tot}`)); })),
    h("div",{class:"sprint"},
      h("div",{class:"sprint-now"},
        h("div",{style:"display:flex;align-items:center;gap:14px"}, ring(done, q.length, PL[p].col, `${done} of ${q.length} followed on ${PL[p].name}`),
          h("div",null, h("b",{style:"font-size:18px"}, `${done} of ${q.length} followed`), h("span",{class:"muted", style:"display:block;font-size:14px"},
            handleOf(p) ? [isVerified(p) ? `Signed in as ${CONNECT[p].display(handleOf(p))}. ` : `${CONNECT[p].display(handleOf(p))} (not verified). `, ext(CONNECT[p].verify(handleOf(p))[0], {class:"linkish"}, CONNECT[p].verify(handleOf(p))[1])]
                    : [h("a",{href:"#you", class:"linkish", "data-linkp":p}, `Connect your ${PL[p].name} account`), " to check your list."]))),
        cur ? [
          h("div",{class:"sprint-who"+(swap?" swap":"")}, avatar(cur.a,60), h("div",null, h("b",null,cur.a.name), h("span",null,cur.a.role), h("span",null,cur.l.h))),
          h("div",{class:"cta-row"},
            ext(cur.l.url,{class:"btn primary", "data-k":"sp-open", "data-ret":cur.key}, pIcon(p,18), `Open on ${PL[p].name}`),
            h("button",{class:"btn", data:{follownext:cur.key, k:"sp-done"}}, icon("check",18), "Mark followed"),
            h("button",{class:"btn quiet", data:{skip:cur.key, k:"sp-skip"}}, "Skip"))
        ] : h("div",{class:"sprint-who"}, h("div",{class:"b-done"}, h("div",{class:"big"}, icon("check",40))), h("div",null, h("b",null,`All done on ${PL[p].name}`), h("span",null,`All ${q.length} accounts in this filter are marked followed.`)))),
      h("div",{style:"display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0"},
        h("ul",{class:"queue", "aria-label":`${PL[p].name} accounts`}, q.map(i=>h("li",{class:"qrow"+(followed[i.key]?" done":"")}, avatar(i.a,32), h("span",{class:"name"}, i.a.name), h("span",{class:"h"}, i.l.h),
          h("button",{class:"check","aria-pressed":String(!!followed[i.key]), "aria-label":`${i.a.name} followed on ${PL[p].name}`, data:{follow:i.key, k:"q-"+i.key}}, icon("check",20))))),
        p==="rd" ? h("div",{class:"subs"}, SUBS.map(([s,d])=>h("div",{class:"sub"}, ext(`https://www.reddit.com/r/${s}/`,null,"r/"+s), h("span",null,d)))) : null)));
}

/* ---------- You (progress, linked accounts, appearance) ---------- */
const strip = (v, re) => v.replace(/^https?:\/\//i,"").replace(/^(www\.|m\.)/i,"").replace(re,"").split(/[/?#]/)[0];
const ALL_SUBS = `https://www.reddit.com/r/${SUBS.map(s=>s[0]).join("+")}/new/`;
const CONNECT = {
  x:{ label:"Your X handle", hint:"Up to 15 letters, numbers or underscores. Paste your profile link or type it, like @karpathy.", err:"Enter an X handle with up to 15 letters, numbers or underscores, like @karpathy.",
      login:"https://x.com/i/flow/login", re:/^[A-Za-z0-9_]{1,15}$/, norm:v=>strip(v,/^(x|twitter)\.com\//i).replace(/^@/,""), display:h=>"@"+h,
      verify:h=>[`https://x.com/${h}/following`,"Your Following list"], links:h=>[["Your profile",`https://x.com/${h}`],["Who you follow",`https://x.com/${h}/following`],["Notifications","https://x.com/notifications"]],
      watch:[["X home","https://x.com/home"],["X notifications","https://x.com/notifications"]] },
  li:{ label:"Your LinkedIn profile", hint:"The part after linkedin.com/in/ in your profile link, like andrewyng. Pasting the full link works too.", err:"Enter the name from your profile link (after linkedin.com/in/), using letters, numbers or hyphens.",
      login:"https://www.linkedin.com/login", re:/^[A-Za-z0-9\-_%]{3,100}$/, norm:v=>strip(v.replace(/^\/?in\//i,""),/^linkedin\.com\/in\//i), display:h=>"in/"+h,
      verify:()=>["https://www.linkedin.com/mynetwork/network-manager/company/","Pages you follow"], links:h=>[["Your profile",`https://www.linkedin.com/in/${h}/`],["Pages you follow","https://www.linkedin.com/mynetwork/network-manager/company/"],["People you follow","https://www.linkedin.com/mynetwork/network-manager/people-follow/following/"]],
      watch:[["LinkedIn feed","https://www.linkedin.com/feed/"]] },
  ig:{ label:"Your Instagram username", hint:"Up to 30 letters, numbers, periods or underscores, like @natgeo.", err:"Enter an Instagram username with up to 30 letters, numbers, periods or underscores.",
      login:"https://www.instagram.com/accounts/login/", re:/^[A-Za-z0-9._]{1,30}$/, norm:v=>strip(v,/^instagram\.com\//i).replace(/^@/,""), display:h=>"@"+h,
      verify:h=>[`https://www.instagram.com/${h}/following/`,"Who you follow"], links:h=>[["Your profile",`https://www.instagram.com/${h}/`],["Who you follow",`https://www.instagram.com/${h}/following/`]],
      watch:[["Instagram feed","https://www.instagram.com/"]] },
  rd:{ label:"Your Reddit username", hint:"3 to 20 letters, numbers, hyphens or underscores, like u/spez.", err:"Enter a Reddit username of 3 to 20 letters, numbers, hyphens or underscores.",
      login:"https://www.reddit.com/login/", re:/^[A-Za-z0-9_\-]{3,20}$/, norm:v=>strip(v.replace(/^\/?u\//i,""),/^(old\.)?reddit\.com\/(user|u)\//i), display:h=>"u/"+h,
      verify:()=>["https://www.reddit.com/subreddits/mine/","Your subscriptions"], links:h=>[["Your profile",`https://www.reddit.com/user/${h}/`],["Your subscriptions","https://www.reddit.com/subreddits/mine/"],["All 7 communities",ALL_SUBS]],
      watch:[["Reddit home","https://www.reddit.com/"],["All 7 communities",ALL_SUBS]] },
};
function progressNumbers(){
  const tot = {x:0,li:0,ig:0,rd:0}, done = {x:0,li:0,ig:0,rd:0};
  ACCTS.forEach(a=>Object.keys(a.links).forEach(p=>{ tot[p]++; if (followed[a.id+":"+p]) done[p]++; }));
  const T = Object.values(tot).reduce((s,n)=>s+n,0), D = Object.values(done).reduce((s,n)=>s+n,0);
  return {tot, done, T, D};
}
const AUTH = {server:false, configured:{}, me:{}, busy:null, err:{}, checked:false};
const verifiedHandle = p => AUTH.me[p]?.username || null;
const handleOf = p => verifiedHandle(p) || conn[p] || null;
const isVerified = p => !!AUTH.me[p];
const AUTH_ERR = {
  cancelled: n => `You cancelled ${n} sign-in. Try again when you're ready.`,
  expired: n => `The ${n} sign-in took too long or was opened in another browser. Start it again here.`,
  state_mismatch: n => `${n} sign-in couldn't be matched to this browser, so it wasn't accepted. Start it again here.`,
  verify_failed: n => `${n} didn't confirm your account. Try again; if it keeps failing, the app's ${n} settings may need checking.`,
  provider_error: n => `${n} returned an error. Try again in a moment.`,
  blocked: n => `Your browser blocked the ${n} sign-in window. Allow pop-ups for this site, or continue in this tab.`,
};
function identity(p){
  const v = AUTH.me[p];
  const fallback = () => h("div",{class:"av person", style:`--cat:var(${PL[p].col});--s:48px`, "aria-hidden":"true"}, initials(v.name||v.username||"?"));
  let img = fallback();
  if (v.avatar){ img = h("img",{src:v.avatar, alt:"", width:"48", height:"48", referrerpolicy:"no-referrer"}); img.addEventListener("error", ()=>img.replaceWith(fallback()), {once:true}); }
  return h("div",{class:"ident"}, img, h("div",{style:"min-width:0"}, h("b",null, v.name || CONNECT[p].display(v.username)),
    h("span",null, [v.username ? CONNECT[p].display(v.username) : null, `Verified by ${PL[p].name} on ${new Date(v.verifiedAt).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`].filter(Boolean).join(". "))));
}
function usernameForm(p, editing){
  const c = CONNECT[p], v = conn[p], id = "conn-in-"+p, back = state.welcome===p;
  return h("form",{class:"field", novalidate:true, data:{connform:p}},
    back ? h("p",{class:"welcome", id:id+"-welcome"}, `Welcome back. Enter your ${PL[p].name} username to finish linking.`) : null,
    h("label",{for:id}, c.label),
    h("span",{class:"hint", id:id+"-hint"}, c.hint),
    h("span",{class:"err", id:id+"-err", hidden:true}),
    h("div",{class:"inrow"},
      h("input",{id, name:"handle", type:"text", required:true, autocomplete:"off", autocapitalize:"none", spellcheck:"false", enterkeyhint:"done", "aria-describedby":`${back?id+"-welcome ":""}${id}-hint ${id}-err`, "data-k":"ci-"+p, value: editing ? v : null}),
      h("button",{class:"btn", type:"submit", "data-k":"cs-"+p}, editing ? "Save" : "Save username"),
      editing ? h("button",{class:"btn quiet", type:"button", data:{conncancel:p, k:"cc-"+p}}, "Cancel") : null));
}
function connSection(p){
  const c = CONNECT[p], n = PL[p].name;
  const canVerify = AUTH.server && AUTH.configured[p];
  const busy = AUTH.busy?.p===p, err = AUTH.err[p];
  let status;
  if (isVerified(p)) status = h("span",{class:"status verified"}, icon("shield",16), `Verified by ${n}`);
  else if (conn[p]) status = h("span",{class:"status unverified"}, `Not verified: ${c.display(conn[p])}`);
  else status = h("span",{class:"status"}, "Not connected");
  const head = h("div",{class:"conn-head"}, h("span",{class:"pbadge"}, pIcon(p,22)), h("h4",{id:"ch-"+p}, n), status);
  const sec = (...kids) => h("section",{class:"conn"+(state.welcome===p||AUTH.flash===p?" flash":""), "aria-labelledby":"ch-"+p, id:"conn-"+p, "aria-busy":busy?"true":null}, head, ...kids);
  const errBox = err ? h("p",{class:"alert", role:"alert"}, icon("alert",18), (AUTH_ERR[err]||AUTH_ERR.provider_error)(n)) : null;
  const h4 = handleOf(p);
  const links = h4 || p==="li" ? h("div",{class:"linkrow"}, (h4 ? c.links(h4) : c.links("").slice(1)).map(([l,u])=>ext(u,{class:"btn sm"}, l, icon("ext",15)))) : null;

  // Verified
  if (isVerified(p)) return sec(identity(p), links,
    h("div",{class:"cta-row"}, h("button",{class:"linkish", style:"color:var(--bad)", data:{disconnect:p, k:"cd-"+p}}, `Disconnect ${n}`)));

  // Server can verify: one primary action
  if (canVerify) return sec(errBox,
    busy ? h("div",{class:"cta-row"},
      h("button",{class:"btn primary auth-btn", "aria-busy":"true", disabled:true, "data-k":"cauth-"+p}, h("span",{class:"spin","aria-hidden":"true"}), `Waiting for ${n}…`),
      h("button",{class:"btn quiet", data:{authcancel:p, k:"cx-"+p}}, "Cancel"),
      AUTH.busy.win ? h("button",{class:"linkish", data:{authfocus:p, k:"cf-"+p}}, "Show sign-in window") : null)
    : h("button",{class:"btn primary auth-btn", data:{auth:p, k:"cauth-"+p}}, pIcon(p,20), `Continue with ${n}`),
    h("ol",{class:"steps-mini"},
      h("li",null, `${n} opens in a small window. Sign in there if you aren't already.`),
      h("li",null, `Approve "AI Follow Desk". It can only read your public profile.`),
      h("li",null, `The window closes and your verified ${n} account appears here.`)),
    p==="ig" ? h("p",{class:"note"}, "Instagram sign-in works with professional (business or creator) accounts. Personal accounts can't sign in to outside apps.") : null,
    conn[p] ? h("p",{class:"note"}, `You saved ${c.display(conn[p])} earlier without verification. Signing in replaces it with your verified account.`) : null);

  // No verification available here: labelled, unverified fallback
  const why = AUTH.server ? `${n} sign-in isn't set up on this server yet, so ${n} can't confirm your account.` : `Verified sign-in needs the AI Follow Desk server, and this copy of the app runs without it. Your username is saved in this browser without confirmation from ${n}.`;
  if (conn[p] && state.connEdit!==p) return sec(h("p",{class:"note"}, why), links,
    h("div",{class:"cta-row"}, h("button",{class:"linkish", data:{connedit:p, k:"ce-"+p}}, "Change username"), h("button",{class:"linkish", style:"color:var(--bad)", data:{connunlink:p, k:"cu-"+p}}, `Remove ${n} username`)));
  return sec(h("p",{class:"note"}, why), usernameForm(p, state.connEdit===p));
}

/* ---------- verified sign-in (server mode) ---------- */
async function loadAuth(){
  if (IN_EXT){ AUTH.server = false; AUTH.checked = true; return; }
  try {
    const r = await fetch("/api/me", {credentials:"same-origin", headers:{Accept:"application/json"}, cache:"no-store"});
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    if (j.app!=="afd") throw new Error("not afd");
    AUTH.server = true; AUTH.configured = j.configured || {}; AUTH.me = j.providers || {};
  } catch { AUTH.server = false; }
  AUTH.checked = true;
  let pend = null; try { pend = sessionStorage.getItem("afd:authPending"); sessionStorage.removeItem("afd:authPending"); } catch {}
  if (pend && AUTH.me[pend]) onAuthDone({provider:pend, ok:true, profile:AUTH.me[pend]}, true);
  else renderAll();
}
function startAuth(p){
  AUTH.err[p] = null;
  const w = 520, ht = 720, left = Math.max(0, Math.round(screenX + (outerWidth - w)/2)), top = Math.max(0, Math.round(screenY + (outerHeight - ht)/2));
  let win = null;
  try { win = window.open(`/auth/${p}/start?mode=popup`, "afd-auth", `popup=yes,width=${w},height=${ht},left=${left},top=${top}`); } catch {}
  if (!win){ // pop-ups blocked: continue in this tab and come back to #you
    try { sessionStorage.setItem("afd:authPending", p); } catch {}
    location.assign(`/auth/${p}/start?mode=redirect`); return;
  }
  AUTH.busy = {p, win, at:Date.now()};
  render(); $(`[data-k="cx-${p}"]`)?.focus();
  announce(`${PL[p].name} sign-in opened in a new window`);
}
function onAuthDone(d, fromReload){
  const p = d.provider; if (!PL[p]) return;
  if (AUTH.busy?.p===p) AUTH.busy = null;
  if (d.ok && d.profile){
    AUTH.me[p] = d.profile; AUTH.err[p] = null; AUTH.flash = p;
    if (d.profile.username){ conn[p] = d.profile.username; store.set("conn", conn); }
    if (state.view!=="you" && !fromReload) location.hash = "you";
    render(); if (fromReload) renderAll();
    const t = document.getElementById("ch-"+p); t?.setAttribute("tabindex","-1"); t?.focus({preventScroll:true}); t?.closest("section")?.scrollIntoView({block:"center", behavior: reduceMotion.matches ? "auto" : "smooth"});
    toast(`Signed in. ${PL[p].name} verified you as ${d.profile.username ? CONNECT[p].display(d.profile.username) : d.profile.name}.`);
    setTimeout(()=>{ AUTH.flash = null; }, 1300);
  } else {
    AUTH.err[p] = d.error || "provider_error"; render();
    $(`[data-k="cauth-${p}"]`)?.focus();
  }
}
// Results arrive from the sign-in window: postMessage (same origin only) or BroadcastChannel if the window lost its opener
addEventListener("message", e=>{ if (e.origin===location.origin && e.data?.type==="afd-auth") onAuthDone(e.data); });
try { new BroadcastChannel("afd-auth").onmessage = e=>{ if (e.data?.type==="afd-auth") onAuthDone(e.data); }; } catch {}
// Coming back to this tab while waiting: re-check with the server in case the message was missed
addEventListener("focus", async ()=>{
  if (!AUTH.busy || Date.now()-AUTH.busy.at < 1500) return;
  const p = AUTH.busy.p;
  try { const j = await (await fetch("/api/me",{credentials:"same-origin", cache:"no-store"})).json(); if (j.providers?.[p] && AUTH.busy?.p===p) onAuthDone({provider:p, ok:true, profile:j.providers[p]}); } catch {}
});
async function disconnect(p){
  const n = PL[p].name;
  try {
    const r = await fetch(`/auth/${p}/disconnect`, {method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:"{}"});
    if (!r.ok) throw new Error(r.status);
    delete AUTH.me[p]; delete conn[p]; store.set("conn", conn);
    render(); $(`[data-k="cauth-${p}"]`)?.focus();
    toast(`${n} disconnected. Sign in again any time.`);
  } catch { toast(`Couldn't disconnect ${n}. Check your connection and try again.`); }
}

function themeSeg(group){
  const pref = store.get("theme","system");
  return [["system","Match system","monitor"],["light","Light","sun"],["dark","Dark","moon"]].map(([v,l,ic])=>h("label",null, h("input",{type:"radio", name:"theme-"+group, value:v, checked: pref===v ? true : null, "data-theme-input":"1"}), icon(ic,17), l));
}
function renderYou(){
  const {tot, done, T, D} = progressNumbers();
  put($("#view-you"), 
    h("div",null, h("h2",{class:"view-title", id:"h-you", tabindex:"-1"}, "You"), h("p",{class:"lede"}, AUTH.server ? "Your follow progress, connected accounts and settings. Sign-ins are verified by each platform and kept in an encrypted cookie in this browser." : "Your follow progress, linked accounts and settings. Everything here is saved in this browser only, and this app never sees your passwords.")),
    h("section",{class:"panel", "aria-labelledby":"you-prog"}, h("h3",{id:"you-prog"}, "Follow progress"),
      h("div",{class:"prog"}, ring(D, T, "--primary", `${D} of ${T} profile links followed`),
        h("div",{class:"bars"}, Object.keys(PL).map(p=>h("div",{class:"bar"}, h("div",{class:"t"}, h("span",{style:"display:inline-flex;gap:6px;align-items:center"}, pIcon(p,16), PL[p].name), h("span",null, `${done[p]} of ${tot[p]}`)), h("div",{class:"meter", role:"img", "aria-label":`${done[p]} of ${tot[p]} on ${PL[p].name}`}, h("span",{style:`--pc:var(${PL[p].col});--v:${tot[p]?done[p]/tot[p]:0}`})))))),
      h("p",{class:"note"}, `${starred.length} of 5 accounts starred for notifications.`)),
    h("section",{class:"panel", "aria-labelledby":"you-linked"}, h("h3",{id:"you-linked"}, AUTH.server ? "Connected accounts" : "Linked accounts"),
      h("p",{class:"note"}, AUTH.server ? "Sign in with each platform to confirm it's you. AI Follow Desk only reads your public profile and never sees your password." : "Save your username for each platform. Verified sign-in needs the AI Follow Desk server; this copy shows usernames as not verified."),
      h("div",{class:"conns"}, Object.keys(PL).map(connSection))),
    capturePanel(),
    h("section",{class:"panel", "aria-labelledby":"you-theme"}, h("h3",{id:"you-theme"}, "Appearance"),
      h("fieldset",{style:"border:0;margin:0;padding:0"}, h("legend",{class:"sr-only"}, "Theme"), h("div",{class:"theme-seg"}, themeSeg("you")))),
    h("p",{class:"note"}, "Accounts come from The Follow List by AI with Divyam (links checked 12 Nov 2026). Updates come from 17 official blogs and newsletters, 7 subreddits plus u/Cohere, and a Google News search per account. X, LinkedIn and Instagram block automated reading, so their posts open through Live and the profile links."));
}

/* ---------- posts from your browser (AI Follow Desk Capture extension) ---------- */
function fromCapture(c){
  if (!c || !BY[c.a] || !PL[c.p]) return null;
  const u = safeUrl(c.url); if (!u) return null;
  const text = String(c.text||"").trim(), first = text.split("\n")[0].trim();
  const title = first ? (first.length>180 ? first.slice(0,177)+"…" : first) : `${BY[c.a].name} posted on ${PL[c.p].name}`;
  const date = c.date && !isNaN(new Date(c.date)) ? c.date : c.capturedAt;
  return {a:c.a, via:{x:"X", li:"LinkedIn", ig:"Instagram", rd:"Reddit"}[c.p], title, body:text.slice(first.length).trim().slice(0,320), url:u,
    src: `${String(c.author||PL[c.p].name).slice(0,80)} on ${PL[c.p].name}`, date, noDate:!c.date, timeText: c.timeText ? String(c.timeText).slice(0,30) : null, captured:true, p:c.p};
}
function applyCaptured(items, last){
  EXT.connected = true; EXT.last = last || null;
  CAPTURED = (items||[]).slice(0,1500).map(fromCapture).filter(Boolean);
  const seen = new Set(CAPTURED.map(f=>f.url));
  FEED = [...CAPTURED, ...BASE_FEED.filter(f=>!seen.has(f.url))].sort((a,b)=>b.date.localeCompare(a.date));
}
addEventListener("message", e=>{
  if (e.source!==window || e.data?.type!=="afd-ext-items" || !Array.isArray(e.data.items)) return;
  applyCaptured(e.data.items, e.data.lastCapture); renderAll();
});
/* ---------- running inside the AI Follow Desk extension: no server, no setup ---------- */
const IN_EXT = location.protocol==="chrome-extension:" && !!globalThis.chrome?.storage?.local;
const REFRESH = {busy:false, err:null};
const STALE = 12*3600e3;
function setBaseFeed(feed){
  DATA = feed; FETCHED = new Date(feed.fetched);
  BASE_FEED = feed.items.filter(f=>BY[f.a]).sort((a,b)=>b.date.localeCompare(a.date));
}
async function loadExt(){
  const s = await chrome.storage.local.get({items:[], lastCapture:null, feed:null, enabled:{x:true,li:true,ig:true,rd:true}});
  EXT.enabled = s.enabled;
  if (s.feed?.fetched && s.feed.fetched > DATA.fetched) setBaseFeed(s.feed);
  applyCaptured(s.items, s.lastCapture); renderAll();
}
async function refreshFeed(manual){
  if (!IN_EXT || !window.AFD_REFRESH || REFRESH.busy) return;
  REFRESH.busy = true; REFRESH.err = null; render();
  try {
    const f = await window.AFD_REFRESH();
    if (!f.items.length) throw new Error("no items");
    // A source that couldn't be reached keeps its previous items instead of disappearing
    for (const via of ["Blog","News","Reddit"]) if (!f.items.some(i=>i.via===via)) f.items.push(...DATA.items.filter(i=>i.via===via));
    f.items.sort((a,b)=>b.date.localeCompare(a.date));
    await chrome.storage.local.set({feed:f});
    if (manual) toast(`Updated. ${f.items.length} updates from blogs, news and Reddit.`);
  } catch { REFRESH.err = "Couldn't update. Check your internet connection, then press Update now."; }
  REFRESH.busy = false; renderAll();
}
if (IN_EXT){
  EXT.connected = true;
  chrome.storage.onChanged.addListener((ch, area)=>{ if (area==="local" && (ch.items || ch.feed || ch.enabled)) loadExt(); });
  loadExt().then(()=>{ if (Date.now() - new Date(DATA.fetched) > STALE) refreshFeed(false); });
  setInterval(()=>{ if (!document.hidden && Date.now() - new Date(DATA.fetched) > STALE) refreshFeed(false); }, 30*60e3);
}
const askExt = () => window.postMessage({type:"afd-ext-request"}, location.origin==="null" ? "*" : location.origin);
addEventListener("focus", askExt);
document.addEventListener("visibilitychange", ()=>{ if (!document.hidden) askExt(); });
function collectLinks(){
  const out = [];
  for (const c of CATS){ const accts = ACCTS.filter(a=>a.cat===c.id && a.links.x); if (accts.length) out.push(ext(`https://x.com/search?q=${encodeURIComponent(accts.map(a=>"from:"+a.links.x.h.slice(1)).join(" OR "))}&f=live`, {class:"btn sm"}, pIcon("x",15), c.short)); }
  out.push(ext("https://www.linkedin.com/feed/", {class:"btn sm"}, pIcon("li",15), "LinkedIn feed"));
  out.push(ext("https://www.instagram.com/", {class:"btn sm"}, pIcon("ig",15), "Instagram feed"));
  out.push(ext(ALL_SUBS, {class:"btn sm"}, pIcon("rd",15), "All 7 subreddits"));
  return out;
}
function capturePanel(){
  const counts = Object.fromEntries(Object.keys(PL).map(p=>[p, CAPTURED.filter(f=>f.p===p).length]));
  const copyBtn = h("button",{class:"btn sm", data:{copyorigin:"1", k:"copy-origin"}}, "Copy address");
  return h("section",{class:"panel", "aria-labelledby":"you-capture", id:"capture"}, h("h3",{id:"you-capture"}, "Posts from your browser"),
    IN_EXT ? [
      h("p",{class:"note"}, "While you browse X, LinkedIn, Instagram and Reddit in this browser, posts from accounts on your list are saved here automatically. Nothing else is read, and nothing leaves your browser."),
      h("div",{class:"conns"}, Object.keys(PL).map(p=>{ const on = EXT.enabled?.[p]!==false; return h("div",{class:"conn", style:"display:flex;align-items:center;gap:12px;padding:12px 14px"},
        h("span",{class:"pbadge"}, pIcon(p,20)), h("div",{style:"flex:1;min-width:0"}, h("b",null, PL[p].name), h("span",{class:"muted", style:"display:block;font-size:14px"}, `${counts[p]} posts saved`)),
        h("button",{class:"switch", style:"width:auto", role:"switch", "aria-checked":String(on), "aria-label":`Save posts from ${PL[p].name}`, data:{capsw:p, k:"capsw-"+p}}, h("span",{class:"track","aria-hidden":"true"}))); })),
      h("p",{class:"note"}, "Quick ways to collect posts: open one of these and scroll as usual."),
      h("div",{class:"linkrow"}, collectLinks()),
      h("div",{class:"cta-row"}, h("button",{class:"linkish", style:"color:var(--bad)", data:{capclear:"1", k:"capclear"}}, state.confirmClear ? "Press again to delete all saved posts" : "Delete saved posts"))
    ] : EXT.connected ? [
      h("div",{class:"conn-head"}, h("span",{class:"status verified"}, icon("check",16), "Extension connected"),
        h("span",{class:"muted", style:"font-size:14px"}, EXT.last ? `Last post saved ${ago(EXT.last)}` : "No posts saved yet")),
      h("div",{class:"bars"}, Object.keys(PL).map(p=>h("div",{class:"bar"}, h("div",{class:"t"}, h("span",{style:"display:inline-flex;gap:6px;align-items:center"}, pIcon(p,16), PL[p].name), h("span",null, `${counts[p]} posts`))))),
      h("p",{class:"note"}, "Open any of these pages and browse as usual. Posts from accounts on your list are saved automatically and appear in Today."),
      h("div",{class:"linkrow"}, collectLinks()),
      h("p",{class:"note"}, "Company and people pages work too: open an account from Accounts. The extension reads only what's on your screen, and stores it only in this browser.")
    ] : [
      h("p",{class:"note"}, "The AI Follow Desk Capture extension saves posts from your list while you browse X, LinkedIn, Instagram and Reddit in this browser. It doesn't use their APIs and doesn't browse on its own: it reads only the pages you open."),
      h("ol",{class:"steps-mini", style:"color:var(--fg);font-size:15px;gap:8px"},
        h("li",null, "Open ", h("b",null,"chrome://extensions"), " (or ", h("b",null,"edge://extensions"), ") and switch on Developer mode."),
        h("li",null, "Choose ", h("b",null,"Load unpacked"), " and select the ", h("b",null,"extension"), " folder from AI Follow Desk."),
        h("li",null, location.hostname==="localhost"||location.protocol==="file:" ? "That's it for this copy: it connects automatically. Reload this page." : ["Open the extension's ", h("b",null,"Connect app"), " page and add this address: ", h("code",{style:"overflow-wrap:anywhere"}, location.origin), " ", copyBtn]),
        h("li",null, "Visit X, LinkedIn, Instagram or Reddit. New posts from your list show up here within seconds.")),
      h("p",{class:"note"}, "Inside the claude.ai preview the extension may not be able to reach this page. Use the self-hosted app or a local copy for browser capture.")
    ]);
}

/* ---------- right rail (desktop) ---------- */
function renderRail(){
  if (!matchMedia("(min-width:1280px)").matches){ put($("#railHost"), ); return; }
  const {T, D} = progressNumbers();
  put($("#railHost"), 
    h("section",{class:"rcard", "aria-labelledby":"r-prog"}, h("h2",{id:"r-prog"}, "Follow progress"),
      h("div",{style:"display:flex;gap:12px;align-items:center"}, ring(D, T, "--primary", `${D} of ${T} followed`), h("div",null, h("b",null, `${D} of ${T}`), h("span",{class:"muted", style:"display:block;font-size:14px"}, "profile links followed"))),
      h("a",{href:"#follow", class:"btn sm"}, "Continue follow sprint")),
    h("section",{class:"rcard", "aria-labelledby":"r-linked"}, h("h2",{id:"r-linked"}, "Your accounts"),
      h("div",{class:"lp"}, Object.keys(PL).map(p=>h("a",{href:"#you", class:isVerified(p)?"on":"", "data-linkp":p, title: isVerified(p) ? `Verified by ${PL[p].name}` : conn[p] ? "Not verified" : null}, pIcon(p,16), isVerified(p) ? [AUTH.me[p].username ? CONNECT[p].display(AUTH.me[p].username) : AUTH.me[p].name, icon("shield",14)] : conn[p] ? `${CONNECT[p].display(conn[p])} (not verified)` : `Connect ${PL[p].name}`)))),
    h("section",{class:"rcard", "aria-labelledby":"r-star"}, h("h2",{id:"r-star"}, `Starred (${starred.length} of 5)`),
      starred.length ? starred.map(id=>h("div",{class:"mini-acct"}, avatar(BY[id],28), h("button",{data:{acct:id}, "aria-haspopup":"dialog"}, BY[id].name)))
                     : h("p",{class:"note"}, "Star up to five accounts you want notifications from.")));
}

/* ---------- account sheet ---------- */
let dlgAcct = null;
function renderDialog(){
  const a = BY[dlgAcct]; if (!a) return;
  const k = document.activeElement?.dataset?.k;
  const ups = updatesFor(a.id).slice(0,5);
  put($("#acctDlg"), h("div",{class:"grab","aria-hidden":"true"}),
    h("div",{class:"dlg-head"}, avatar(a,48),
      h("div",{style:"flex:1;min-width:0"}, h("h3",{id:"dlgTitle"}, a.name), h("span",{class:"muted", style:"font-size:14.5px"}, `${a.role}, in ${catOf(a.cat).name}`)),
      starBtn(a,"m-star"),
      h("button",{class:"icon-btn", data:{dlgclose:"acctDlg", k:"m-close"}, "aria-label":"Close", autofocus:true}, icon("close",22))),
    h("div",{class:"dlg-body"},
      h("h4",null,"Profiles"),
      h("div",{class:"plats"}, Object.keys(PL).filter(p=>!(a.sub && p!=="rd")).map(p=>platRow(a,p,"m-"))),
      h("h4",null, ups.length ? "Recent updates" : "No updates in the last few weeks"),
      ups.length ? h("div",{class:"mini"}, ups.map(f=>ext(f.url,null, h("b",null,f.title), h("span",null, `${VIA[f.via].label} from ${f.src}, ${ago(f.date)}`)))) : null,
      ups.length ? h("button",{class:"btn primary", data:{feedacct:a.id, k:"m-feed"}}, "Show all in Today") : null));
  if (k){ const el = $("#acctDlg").querySelector(`[data-k="${CSS.escape(k)}"]`); el?.focus(); }
}
function openDialog(id){ dlgAcct = id; renderDialog(); const d = $("#acctDlg"); if (!d.open) d.showModal(); }
$("#acctDlg").addEventListener("close", ()=>{ dlgAcct = null; });
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click", e=>{ if (e.target===d && d.id!=="brief" && !("closedBy" in HTMLDialogElement.prototype)) d.close(); }));

/* ---------- briefing reader ---------- */
function buildDeck(){
  const picks = [];
  for (const c of CATS){
    const seen = new Set();
    const items = FEED.filter(f=>BY[f.a].cat===c.id).filter(f=>{ if (seen.has(f.a)) return false; seen.add(f.a); return true; }).slice(0,3);
    picks.push(...items);
  }
  return [...picks, {done:true}];
}
let deck = [], briefIdx = 0, briefObs = null;
function briefCard(f, i){
  if (f.done) return h("article",{class:"b-card", "data-i":i, "aria-roledescription":"slide", "aria-label":`${i+1} of ${deck.length}`},
    h("div",{class:"b-in b-done"}, h("div",{class:"big"}, icon("check",44)), h("h3",null,"You're caught up"),
      h("p",null, `That's the ${deck.length-1} newest stories across all six categories. Browse the full feed for more, or follow the accounts you liked.`),
      h("div",{class:"b-acts", style:"justify-content:center"}, h("button",{class:"btn primary", data:{briefclose:"today", k:"b-feed"}}, "Back to Today"), h("button",{class:"btn", data:{briefclose:"follow", k:"b-follow"}}, "Start follow sprint"))));
  const a = BY[f.a], c = catOf(a.cat), v = VIA[f.via], fk = a.links.x ? a.id+":x" : null;
  return h("article",{class:"b-card", "data-i":i, "aria-roledescription":"slide", "aria-label":`${i+1} of ${deck.length}`, style:`--cat:var(${c.color})`},
    h("div",{class:"b-in"},
      h("span",{class:"b-cat"}, h("i"), c.name),
      h("h3",null, f.title),
      f.body ? h("p",null, f.body) : null,
      h("div",{class:"b-who"}, avatar(a,32), h("b",null,a.name), h("span",null, `${v.label}, ${f.via==="Reddit" ? f.src : "via "+f.src}, ${ago(f.date)}`)),
      h("div",{class:"b-acts"},
        ext(f.url,{class:"btn primary"}, "Read the story", icon("ext",16)),
        fk ? (followed[fk] ? h("span",{class:"btn quiet", style:"color:var(--ok)"}, icon("check",18), `Following ${a.links.x.h}`) : ext(a.links.x.url,{class:"btn", "data-ret":fk}, pIcon("x",16), `Follow ${a.links.x.h}`)) : null,
        starBtn(a,"b-star-"+i))));
}
function openBrief(start){
  deck = buildDeck();
  const d = $("#brief");
  put(d, 
    h("div",{class:"b-top"},
      h("div",{class:"b-prog","aria-hidden":"true"}, deck.map(()=>h("span"))),
      h("div",{class:"b-bar"}, h("span",{class:"pos", id:"bPos", "aria-live":"polite"}), h("button",{class:"icon-btn", data:{briefclose:"", k:"b-close"}, "aria-label":"Close briefing"}, icon("close",24)))),
    h("div",{class:"b-track", id:"bTrack", tabindex:"0", "aria-label":"Stories. Use the arrow keys or swipe."}, deck.map(briefCard)),
    h("div",{class:"b-foot"},
      h("button",{class:"btn", data:{bstep:"-1", k:"b-prev"}}, icon("left",18), "Previous"),
      h("button",{class:"btn primary", data:{bstep:"1", k:"b-next"}}, "Next", icon("right",18))));
  d.showModal();
  const track = $("#bTrack");
  briefObs?.disconnect();
  briefObs = new IntersectionObserver(es=>{ es.forEach(e=>{ if (e.isIntersecting && e.intersectionRatio>.6) setBriefIdx(+e.target.dataset.i, false); }); }, {root:track, threshold:[.6]});
  track.querySelectorAll(".b-card").forEach(c=>briefObs.observe(c));
  goBrief(start, true);
  $('[data-k="b-next"]').focus();
}
function setBriefIdx(i, scroll){
  briefIdx = Math.max(0, Math.min(deck.length-1, i));
  const d = $("#brief"); if (!d.open) return;
  d.querySelectorAll(".b-prog span").forEach((s,j)=>s.classList.toggle("done", j<=briefIdx));
  d.querySelectorAll(".b-card").forEach((c,j)=>{ c.classList.toggle("active", j===briefIdx); c.inert = j!==briefIdx; });
  $("#bPos").textContent = deck[briefIdx].done ? "Done" : `Story ${briefIdx+1} of ${deck.length-1}`;
  $('[data-k="b-prev"]').disabled = briefIdx===0;
  $('[data-k="b-next"]').hidden = !!deck[briefIdx].done;
  store.set("briefPos", {ed:DATA.fetched, i: deck[briefIdx].done ? 0 : briefIdx});
  if (scroll){ const c = d.querySelectorAll(".b-card")[briefIdx]; $("#bTrack").scrollTo({left:c.offsetLeft, behavior: reduceMotion.matches ? "auto" : "smooth"}); }
}
const goBrief = (i, instant) => { if (instant){ const tr = $("#bTrack"); const prev = tr.style.scrollBehavior; tr.style.scrollBehavior = "auto"; setBriefIdx(i, true); tr.style.scrollBehavior = prev; } else setBriefIdx(i, true); };
$("#brief").addEventListener("keydown", e=>{
  if (e.target.closest("input")) return;
  if (e.key==="ArrowRight"){ e.preventDefault(); goBrief(briefIdx+1); }
  if (e.key==="ArrowLeft"){ e.preventDefault(); goBrief(briefIdx-1); }
});
$("#brief").addEventListener("close", ()=>{ briefObs?.disconnect(); renderAll(); });

/* ---------- rendering + routing ---------- */
function render(){
  const k = document.activeElement?.dataset?.k;
  renderNav(); renderFilters();
  VIEW_IDS.forEach(v=>{ $("#view-"+v).hidden = v!==state.view; });
  ({today:renderToday, accounts:renderAccounts, follow:renderFollow, you:renderYou})[state.view]();
  renderRail();
  if (k){ const el = document.querySelector(`[data-k="${CSS.escape(k)}"]`); if (el && el!==document.activeElement && !el.closest("[hidden]")) el.focus({preventScroll:true}); }
}
const renderAll = () => { render(); if (dlgAcct) renderDialog(); };
let renderCtl = null;
function scheduleRender(){
  renderCtl?.abort();
  if (globalThis.TaskController && globalThis.scheduler?.postTask){ renderCtl = new TaskController({priority:"user-visible"}); scheduler.postTask(render, {signal:renderCtl.signal}).catch(()=>{}); }
  else { const t = setTimeout(render, 0); renderCtl = {abort:()=>clearTimeout(t)}; }
}
function setView(v, {focus=true}={}){
  if (!VIEW_IDS.includes(v)) v = "today";
  if (v===state.view && $("#view-"+v).childElementCount) return;
  const dir = VIEW_IDS.indexOf(v) >= VIEW_IDS.indexOf(state.view) ? 1 : -1;
  const go = ()=>{
    state.view = v; render(); window.scrollTo({top:0});
    const p = state.pendingFocusConn; state.pendingFocusConn = null;
    if (v==="you" && state.pendingCapture){ state.pendingCapture = false; const c = document.getElementById("you-capture"); c?.setAttribute("tabindex","-1"); c?.focus({preventScroll:true}); c?.scrollIntoView({block:"start"}); return; }
    const target = v==="you" && p && ($(`[data-k="cauth-${p}"]`) || $(`[data-k="ci-${p}"]`) || $(`[data-k="ce-${p}"]`) || $(`[data-k="cd-${p}"]`));
    if (target){ target.focus({preventScroll:true}); target.closest("section")?.scrollIntoView({block:"center"}); }
    else if (focus) document.getElementById("h-"+v)?.focus({preventScroll:true});
  };
  if (document.startViewTransition && !reduceMotion.matches && state.view!==v){
    document.documentElement.style.setProperty("--dir", dir);
    VIEW_IDS.forEach(x=>$("#view-"+x).style.viewTransitionName = "");
    $("main").style.viewTransitionName = "view";
    document.startViewTransition(go);
  } else go();
}
// Views are real links (#today, #accounts, #follow, #you): back/forward and deep links work
addEventListener("hashchange", ()=>{ const v = location.hash.slice(1) || "today"; if (VIEW_IDS.includes(v)) setView(v); });

/* ---------- events ---------- */
document.addEventListener("click", e=>{
  const a = e.target.closest?.("a[data-linkp]");
  if (a){ state.pendingFocusConn = a.dataset.linkp; }
  if (e.target.closest?.("a[data-capture]")) state.pendingCapture = true;
  const t = e.target.closest("button"); if (!t) return;
  const d = t.dataset;
  if (d.cat!==undefined){ state.cat = d.cat; render(); return announce(d.cat ? `Showing ${catOf(d.cat).name}` : "Showing all categories"); }
  if (d.via!==undefined){ state.via = d.via; return render(); }
  if (d.staronly){ state.starOnly = !state.starOnly; return render(); }
  if (d.clearall){ Object.assign(state, {cat:"", via:"", plat:"", starOnly:false, acct:"", q:""}); $("#q").value = ""; render(); return announce("Filters cleared"); }
  if (d.clearacct){ state.acct = ""; render(); return announce("Showing all accounts"); }
  if (d.more){ state.open[d.more] = !state.open[d.more]; return render(); }
  if (d.acct) return openDialog(d.acct);
  if (d.dlgclose) return $("#"+d.dlgclose).close();
  if (t.id==="filterBtn") return openFilters();
  if (d.feedacct){
    state.acct = d.feedacct; state.via = ""; state.cat = "";
    document.querySelectorAll("dialog[open]").forEach(x=>x.close());
    if (location.hash!=="#today") location.hash = "today"; else render();
    return announce(`Today filtered to ${BY[d.feedacct].name}`);
  }
  if (d.follow){ const k = d.follow; return setFollowed(k, !followed[k]); }
  if (d.follownext){ setFollowed(d.follownext, true); $('[data-k="sp-open"]')?.focus(); return; }
  if (d.skip){ state.skipped = state.skipped.filter(x=>x!==d.skip).concat(d.skip); render(); $('[data-k="sp-open"]')?.focus(); return; }
  if (d.sprint){ state.sprintPlat = d.sprint; lastSprintKey = null; return render(); }
  if (d.star) return toggleStar(d.star, t);
  if (d.brief!==undefined) return openBrief(+d.brief);
  if (d.bstep) return goBrief(briefIdx + (+d.bstep));
  if (d.briefclose!==undefined){ $("#brief").close(); if (d.briefclose && location.hash!=="#"+d.briefclose) location.hash = d.briefclose; return; }
  if (d.auth) return startAuth(d.auth);
  if (d.authcancel){ const p = d.authcancel; try { AUTH.busy?.win?.close(); } catch {} AUTH.busy = null; render(); $(`[data-k="cauth-${p}"]`)?.focus(); return announce(`${PL[p].name} sign-in cancelled`); }
  if (d.authfocus){ try { AUTH.busy?.win?.focus(); } catch {} return; }
  if (d.disconnect) return disconnect(d.disconnect);
  if (d.refresh) return refreshFeed(true);
  if (d.welcomed){ store.set("welcomed", true); render(); $("[data-k='brief-start']")?.focus(); return; }
  if (d.capsw){ const p = d.capsw, en = {...(EXT.enabled||{x:true,li:true,ig:true,rd:true})}; en[p] = en[p]===false; chrome.storage.local.set({enabled:en}); return toast(en[p] ? `Saving posts from ${PL[p].name}` : `Stopped saving posts from ${PL[p].name}`); }
  if (d.capclear){
    if (!state.confirmClear){ state.confirmClear = true; render(); setTimeout(()=>{ state.confirmClear = false; render(); }, 4000); return; }
    state.confirmClear = false; chrome.storage.local.set({items:[]}); return toast("Saved posts deleted");
  }
  if (d.copyorigin){ navigator.clipboard?.writeText(location.origin).then(()=>toast("Address copied"), ()=>toast(`Copy this address: ${location.origin}`)); return; }
  if (d.connedit){ state.connEdit = d.connedit; render(); $(`[data-k="ci-${d.connedit}"]`)?.focus(); return; }
  if (d.conncancel){ state.connEdit = null; render(); $(`[data-k="ce-${d.conncancel}"]`)?.focus(); return; }
  if (d.connunlink){
    const p = d.connunlink, old = conn[p]; delete conn[p]; store.set("conn", conn); render(); $(`[data-k="ci-${p}"]`)?.focus();
    return toast(`${PL[p].name} unlinked`, ()=>{ conn[p] = old; store.set("conn", conn); render(); });
  }
});
document.addEventListener("change", e=>{
  if (e.target.dataset?.platsel){ state.plat = e.target.value; render(); }
  if (e.target.dataset?.themeInput){ store.set("theme", e.target.value); applyTheme(e.target.value); }
});
$("#q").addEventListener("input", e=>{ state.q = e.target.value.trim(); scheduleRender(); });
document.addEventListener("keydown", e=>{
  if (e.key==="/" && !e.target.closest("input,textarea,select,[contenteditable]") && !document.querySelector("dialog[open]")){ e.preventDefault(); $("#q").focus(); }
});
wide.addEventListener("change", ()=>{ if ($("#filterDlg").open) $("#filterDlg").close(); render(); });
matchMedia("(min-width:1280px)").addEventListener("change", renderRail);

/* linking forms */
function validateHandle(form, show){
  const p = form.dataset.connform, c = CONNECT[p], inp = form.elements.handle, err = form.querySelector(".err");
  const v = c.norm(inp.value.trim()), ok = c.re.test(v);
  inp.setCustomValidity(ok ? "" : c.err);
  if (show || inp.getAttribute("aria-invalid")==="true"){ inp.setAttribute("aria-invalid", String(!ok)); err.hidden = ok; put(err, ...(ok ? [] : [icon("alert",16), c.err])); }
  return ok ? v : null;
}
document.addEventListener("submit", e=>{
  const f = e.target.closest("form[data-connform]"); if (!f) return;
  e.preventDefault();
  const p = f.dataset.connform, v = validateHandle(f, true);
  if (!v){ f.elements.handle.focus(); return; }
  conn[p] = v; store.set("conn", conn); state.connEdit = null; state.welcome = null;
  render(); $(`[data-k="ce-${p}"]`)?.focus();
  toast(`${PL[p].name} username saved as ${CONNECT[p].display(v)}. Not verified by ${PL[p].name}.`);
});
document.addEventListener("input", e=>{ const f = e.target.closest?.("form[data-connform]"); if (f) validateHandle(f, false); });

/* ---------- leaving and coming back ---------- */
let pending = null;
document.addEventListener("click", e=>{
  const a = e.target.closest?.("a[href]"); if (!a) return;
  if (a.dataset.signin){
    const p = a.dataset.signin, w = 520, ht = 700;
    const left = Math.max(0, Math.round((screen.availWidth - w)/2)), top = Math.max(0, Math.round((screen.availHeight - ht)/2));
    let win = null;
    try { win = window.open(a.href, "afd-signin", `popup=yes,width=${w},height=${ht},left=${left},top=${top}`); } catch {}
    if (win){ e.preventDefault(); try { win.opener = null; } catch {} toast(`${PL[p].name} sign-in opened in a small window. Close it when you're done.`); }
    pending = {kind:"signin", p, at:Date.now()};
  } else if (a.dataset.ret && !followed[a.dataset.ret]){
    pending = {kind:"follow", key:a.dataset.ret, at:Date.now()};
  }
}, true);
function onReturn(){
  if (!pending || Date.now() - pending.at < 1200) return;
  const pnd = pending; pending = null;
  if (pnd.kind==="signin"){
    if (conn[pnd.p]) return;
    state.welcome = pnd.p;
    const focusIt = ()=>{ const t = $(`[data-k="ci-${pnd.p}"]`); t?.focus({preventScroll:true}); t?.closest("section")?.scrollIntoView({block:"center", behavior: reduceMotion.matches ? "auto" : "smooth"}); };
    if (state.view!=="you"){ location.hash = "you"; setTimeout(focusIt, 380); } else { render(); focusIt(); }
    announce(`Welcome back. Enter your ${PL[pnd.p].name} username to finish linking.`);
  } else if (!followed[pnd.key]) showResume(pnd.key);
}
document.addEventListener("visibilitychange", ()=>{ if (document.visibilityState==="visible") onReturn(); });
addEventListener("focus", onReturn);
document.addEventListener("pointerdown", e=>{ if (!e.target.closest?.("#resume")) onReturn(); }, true);
let resumeKey = null;
function showResume(key){
  const [id,p] = key.split(":"); resumeKey = key;
  $("#resumeMsg").textContent = `Back from ${PL[p].name}. Did you follow ${BY[id].name}?`;
  const r = $("#resume"); if (!r.matches(":popover-open")) r.showPopover();
  $("#resumeYes").focus();
}
function closeResume(mark){
  const key = resumeKey; resumeKey = null; $("#resume").hidePopover(); if (!key) return;
  if (mark) setFollowed(key, true);
  const scope = document.querySelector("dialog[open]") || $("#view-"+state.view);
  const back = (state.view==="follow" && !document.querySelector("dialog[open]") && $('[data-k="sp-open"]')) || scope.querySelector(`[data-follow="${CSS.escape(key)}"]`) || scope.querySelector(`[data-ret="${CSS.escape(key)}"]`) || scope.querySelector("button,a");
  back?.focus();
}
$("#resumeYes").addEventListener("click", ()=>closeResume(true));
$("#resumeNo").addEventListener("click", ()=>closeResume(false));
$("#resume").addEventListener("keydown", e=>{ if (e.key==="Escape"){ e.preventDefault(); closeResume(false); } });

/* ---------- theme ---------- */
const hostTheme = document.documentElement.getAttribute("data-theme");
function applyTheme(pref){
  const v = pref==="light"||pref==="dark" ? pref : "system", root = document.documentElement;
  if (v!=="system") root.setAttribute("data-theme", v); else if (hostTheme) root.setAttribute("data-theme", hostTheme); else root.removeAttribute("data-theme");
  document.querySelectorAll('[data-theme-input]').forEach(i=>{ i.checked = i.value===v; });
  const dark = v==="dark" || (v==="system" && matchMedia("(prefers-color-scheme: dark)").matches);
  put($("#themeBtn"), icon(v==="system" ? "monitor" : dark ? "moon" : "sun", 22));
  $("#themeBtn").setAttribute("aria-label", `Theme: ${({system:"match system",light:"light",dark:"dark"})[v]}`);
}
addEventListener("storage", e=>{
  if (e.key==="afd:theme") applyTheme(store.get("theme","system"));
  if (e.key==="afd:followed"){ followed = store.get("followed",{}); renderAll(); }
  if (e.key==="afd:starred"){ starred = store.get("starred",[]); renderAll(); }
  if (e.key==="afd:conn"){ conn = store.get("conn",{}); renderAll(); }
});

/* ---------- boot ---------- */
$("#searchIcon").replaceWith(icon("search",20));
put(document.querySelector('[data-themegroup="menu"]'), ...themeSeg("menu"));
applyTheme(store.get("theme","system"));
state.view = VIEW_IDS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "today";
render();
loadAuth();
askExt();
