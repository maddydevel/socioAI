// AI Follow Desk server: serves the app and handles verified sign-in with X, LinkedIn, Reddit and Instagram.
// Only Node built-ins (Node 20+). Configure with environment variables; see README.md and .env.example.
//
// Flow per provider (OAuth 2.0 authorization code, PKCE where supported, OpenID Connect for LinkedIn):
//   GET  /auth/:p/start      -> sets a short-lived encrypted cookie with state/PKCE/nonce, redirects to the provider
//   GET  /auth/:p/callback   -> checks state, exchanges the code server-side, reads the profile from the provider's API,
//                               stores ONLY the verified profile (never tokens) in an encrypted session cookie,
//                               then tells the app (pop-up message + BroadcastChannel) and closes the pop-up
//   GET  /api/me             -> which providers are configured and which are verified for this browser
//   POST /auth/:p/disconnect -> removes that provider from the session (Origin-checked)
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;
const PORT = Number(env.PORT || 8787);
const BASE_URL = (env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const ORIGIN = new URL(BASE_URL).origin;
const SECURE = BASE_URL.startsWith("https://");
const APP_FILE = env.APP_FILE || path.join(here, "..", "index.html");
const MOCK = env.OAUTH_MOCK_URL || ""; // tests only

if (MOCK && env.NODE_ENV === "production") throw new Error("OAUTH_MOCK_URL must not be set in production");
let SECRET = env.SESSION_SECRET || "";
if (SECRET.length < 32) {
  if (env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be at least 32 characters");
  SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("[afd] SESSION_SECRET not set: using a random one, so sign-ins reset when the server restarts.");
}
const KEY = crypto.createHash("sha256").update(SECRET).digest();
const UA = "web:ai-follow-desk:1.0 (verified sign-in)";

/* ---------- providers ---------- */
const m = (p, rest) => `${MOCK}/${p}${rest}`;
const PROVIDERS = {
  x: {
    name: "X", envPrefix: "X",
    authUrl: MOCK ? m("x", "/authorize") : "https://x.com/i/oauth2/authorize",
    tokenUrl: MOCK ? m("x", "/token") : "https://api.x.com/2/oauth2/token",
    scope: "users.read tweet.read", pkce: true, tokenAuth: "basic",
    async profile(tok) {
      const r = await getJSON((MOCK ? m("x", "/me") : "https://api.x.com/2/users/me") + "?user.fields=profile_image_url,name,username", tok);
      const u = r.data || {};
      return { id: u.id, username: u.username, name: u.name, avatar: u.profile_image_url };
    },
  },
  li: {
    name: "LinkedIn", envPrefix: "LINKEDIN",
    authUrl: MOCK ? m("li", "/authorize") : "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: MOCK ? m("li", "/token") : "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "openid profile", oidc: true, tokenAuth: "body",
    async profile(tok) {
      const u = await getJSON(MOCK ? m("li", "/me") : "https://api.linkedin.com/v2/userinfo", tok);
      return { id: u.sub, username: null, name: u.name, avatar: u.picture };
    },
  },
  rd: {
    name: "Reddit", envPrefix: "REDDIT",
    authUrl: MOCK ? m("rd", "/authorize") : "https://www.reddit.com/api/v1/authorize",
    tokenUrl: MOCK ? m("rd", "/token") : "https://www.reddit.com/api/v1/access_token",
    scope: "identity", extra: { duration: "temporary" }, tokenAuth: "basic",
    async profile(tok) {
      const u = await getJSON(MOCK ? m("rd", "/me") : "https://oauth.reddit.com/api/v1/me", tok);
      return { id: u.id, username: u.name, name: u.name, avatar: String(u.icon_img || "").split("?")[0] || null };
    },
  },
  ig: {
    name: "Instagram", envPrefix: "INSTAGRAM",
    authUrl: MOCK ? m("ig", "/authorize") : "https://www.instagram.com/oauth/authorize",
    tokenUrl: MOCK ? m("ig", "/token") : "https://api.instagram.com/oauth/access_token",
    scope: "instagram_business_basic", tokenAuth: "body",
    async profile(tok) {
      const u = await getJSON((MOCK ? m("ig", "/me") : "https://graph.instagram.com/me") + "?fields=user_id,username,name,profile_picture_url", tok);
      return { id: u.user_id || u.id, username: u.username, name: u.name || u.username, avatar: u.profile_picture_url };
    },
  },
};
const creds = p => ({ id: env[`${PROVIDERS[p].envPrefix}_CLIENT_ID`] || "", secret: env[`${PROVIDERS[p].envPrefix}_CLIENT_SECRET`] || "" });
const configured = p => !!(creds(p).id && (creds(p).secret || PROVIDERS[p].pkce));
const redirectUri = p => `${BASE_URL}/auth/${p}/callback`;

async function getJSON(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`profile request failed (${r.status})`);
  return r.json();
}
async function exchangeCode(p, code, verifier) {
  const P = PROVIDERS[p], c = creds(p);
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(p) });
  const headers = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", "User-Agent": UA };
  if (P.pkce) body.set("code_verifier", verifier);
  if (P.tokenAuth === "basic" && c.secret) headers.Authorization = "Basic " + Buffer.from(`${encodeURIComponent(c.id)}:${encodeURIComponent(c.secret)}`).toString("base64");
  else { body.set("client_id", c.id); if (c.secret) body.set("client_secret", c.secret); }
  const r = await fetch(P.tokenUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`token exchange failed (${r.status}${j.error ? ": " + j.error : ""})`);
  return j;
}
// LinkedIn returns an OpenID Connect ID token; we check its nonce and audience (signature is covered by TLS from the token endpoint)
function checkIdToken(idToken, nonce, clientId) {
  if (!idToken) return;
  const payload = JSON.parse(Buffer.from(idToken.split(".")[1] || "", "base64url").toString() || "{}");
  if (payload.nonce && payload.nonce !== nonce) throw new Error("ID token nonce mismatch");
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.aud && !aud.includes(clientId)) throw new Error("ID token audience mismatch");
  if (payload.exp && payload.exp * 1000 < Date.now() - 60000) throw new Error("ID token expired");
}

/* ---------- encrypted cookies (AES-256-GCM) ---------- */
function seal(obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj)), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64url");
}
function unseal(s) {
  try {
    const b = Buffer.from(s, "base64url"), d = crypto.createDecipheriv("aes-256-gcm", KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString());
  } catch { return null; }
}
const cookies = req => Object.fromEntries((req.headers.cookie || "").split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const cookie = (name, val, { maxAge, path: p = "/" } = {}) => `${name}=${encodeURIComponent(val)}; Path=${p}; HttpOnly; SameSite=Lax${SECURE ? "; Secure" : ""}${maxAge != null ? `; Max-Age=${maxAge}` : ""}`;
const getSession = req => { const s = unseal(cookies(req).afd_sess || ""); return s && typeof s === "object" ? s : { providers: {} }; };
const sessionCookie = s => cookie("afd_sess", seal(s), { maxAge: 60 * 60 * 24 * 30 });

/* ---------- pages ---------- */
const SEC_HEADERS = {
  "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups", "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
function appPage(nonce) {
  let body = fs.readFileSync(APP_FILE, "utf8");
  body = body.replace(/<script(?![^>]*type="application\/json")/g, `<script nonce="${nonce}"`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${body}</body></html>`;
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SEC_HEADERS, ...headers });
  res.end(body);
}
function json(res, status, obj, headers = {}) { send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }); }

// The pop-up's last page: hands the result to the app and closes itself
function resultPage(res, result, setCookies) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const data = JSON.stringify({ type: "afd-auth", ...result }).replace(/</g, "\\u003c");
  const name = PROVIDERS[result.provider]?.name || "the platform";
  const msg = result.ok ? `Signed in to ${name}. You can close this window.` : `${name} sign-in didn't finish. You can close this window and try again.`;
  send(res, 200, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${result.ok ? "Signed in" : "Sign-in not finished"}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;background:#FAF7F6;color:#1F1314;text-align:center}@media (prefers-color-scheme:dark){body{background:#121014;color:#F3EEEE}}</style></head>
<body><main><p>${msg}</p><p><a href="/#you">Back to AI Follow Desk</a></p></main>
<script nonce="${nonce}">
const r=${data};
try{new BroadcastChannel("afd-auth").postMessage(r)}catch(e){}
try{if(window.opener&&!window.opener.closed)window.opener.postMessage(r,${JSON.stringify(ORIGIN)})}catch(e){}
if(r.mode==="popup"){setTimeout(()=>window.close(),150)}else{location.replace("/#you")}
</script></body></html>`, {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
    "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'`,
    "Set-Cookie": setCookies,
  });
}

/* ---------- routes ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  const parts = url.pathname.split("/").filter(Boolean);
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const nonce = crypto.randomBytes(16).toString("base64");
      return send(res, 200, appPage(nonce), {
        "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache",
        "Content-Security-Policy": `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
      });
    }
    if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/api/me") {
      const s = getSession(req);
      return json(res, 200, { app: "afd", configured: Object.fromEntries(Object.keys(PROVIDERS).map(p => [p, configured(p)])), providers: s.providers || {} });
    }
    if (parts[0] === "auth" && PROVIDERS[parts[1]]) {
      const p = parts[1], P = PROVIDERS[p];
      if (req.method === "GET" && parts[2] === "start") {
        if (!configured(p)) return json(res, 404, { error: "not_configured" });
        const mode = url.searchParams.get("mode") === "popup" ? "popup" : "redirect";
        const state = crypto.randomBytes(24).toString("base64url");
        const verifier = crypto.randomBytes(48).toString("base64url");
        const nonce = crypto.randomBytes(16).toString("base64url");
        const q = new URLSearchParams({ response_type: "code", client_id: creds(p).id, redirect_uri: redirectUri(p), scope: P.scope, state, ...(P.extra || {}) });
        if (P.pkce) { q.set("code_challenge", crypto.createHash("sha256").update(verifier).digest("base64url")); q.set("code_challenge_method", "S256"); }
        if (P.oidc) q.set("nonce", nonce);
        const pending = seal({ p, state, verifier, nonce, mode, exp: Date.now() + 10 * 60 * 1000 });
        return send(res, 302, "", { Location: `${P.authUrl}?${q}`, "Set-Cookie": cookie(`afd_oauth_${p}`, pending, { maxAge: 600, path: `/auth/${p}` }), "Cache-Control": "no-store" });
      }
      if (req.method === "GET" && parts[2] === "callback") {
        const clear = cookie(`afd_oauth_${p}`, "", { maxAge: 0, path: `/auth/${p}` });
        const pend = unseal(cookies(req)[`afd_oauth_${p}`] || "");
        const mode = pend?.mode || "redirect";
        const fail = (error, detail) => { console.warn(`[afd] ${p} sign-in failed: ${error}${detail ? " - " + detail : ""}`); return resultPage(res, { provider: p, ok: false, error, mode }, [clear]); };
        if (url.searchParams.get("error")) return fail(url.searchParams.get("error") === "access_denied" ? "cancelled" : "provider_error", url.searchParams.get("error"));
        if (!pend || pend.p !== p || pend.exp < Date.now()) return fail("expired");
        const state = url.searchParams.get("state") || "";
        if (state.length !== pend.state.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(pend.state))) return fail("state_mismatch");
        const code = url.searchParams.get("code");
        if (!code) return fail("no_code");
        let tok, prof;
        try {
          tok = await exchangeCode(p, code, pend.verifier);
          if (P.oidc) checkIdToken(tok.id_token, pend.nonce, creds(p).id);
          prof = await P.profile(tok.access_token);
        } catch (e) { return fail("verify_failed", e.message); }
        if (!prof?.id) return fail("verify_failed", "no account id in profile");
        const clean = v => (typeof v === "string" ? v.slice(0, 300) : null);
        const profile = { id: String(prof.id), username: clean(prof.username), name: clean(prof.name), avatar: /^https:\/\//.test(prof.avatar || "") ? clean(prof.avatar) : null, verifiedAt: new Date().toISOString() };
        const s = getSession(req); s.providers = { ...(s.providers || {}), [p]: profile };
        return resultPage(res, { provider: p, ok: true, profile, mode }, [clear, sessionCookie(s)]);
      }
      if (req.method === "POST" && parts[2] === "disconnect") {
        if (req.headers.origin !== ORIGIN) return json(res, 403, { error: "bad_origin" });
        const s = getSession(req); if (s.providers) delete s.providers[p];
        return json(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(s) });
      }
    }
    json(res, 404, { error: "not_found" });
  } catch (e) {
    console.error("[afd]", e);
    json(res, 500, { error: "server_error" });
  }
});

server.listen(PORT, () => {
  console.log(`[afd] AI Follow Desk on ${BASE_URL}`);
  for (const p of Object.keys(PROVIDERS)) console.log(`[afd]   ${PROVIDERS[p].name.padEnd(9)} ${configured(p) ? "ready, callback " + redirectUri(p) : "not configured (set " + PROVIDERS[p].envPrefix + "_CLIENT_ID/_CLIENT_SECRET)"}`);
});
