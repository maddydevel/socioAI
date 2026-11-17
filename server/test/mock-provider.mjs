// Test-only OAuth provider that imitates X, LinkedIn, Reddit and Instagram closely enough to exercise the full flow:
// consent page -> code -> token exchange (checks client, redirect URI and PKCE) -> profile.
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.MOCK_PORT || 8790);
const codes = new Map(), tokens = new Map();
const PROFILES = {
  x: { data: { id: "1001", username: "ada_ai", name: "Ada Lovelace", profile_image_url: "https://example.com/ada.png" } },
  li: { sub: "li-2002", name: "Ada Lovelace", picture: "https://example.com/ada-li.png" },
  rd: { id: "t2_3003", name: "ada_ai", icon_img: "https://example.com/ada-rd.png?s=1" },
  ig: { user_id: "4004", username: "ada.ai", name: "Ada", profile_picture_url: "https://example.com/ada-ig.png" },
};
const body = req => new Promise(r => { let b = ""; req.on("data", c => b += c); req.on("end", () => r(b)); });

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const [, p, step] = u.pathname.split("/");
  if (step === "authorize") {
    const q = u.searchParams;
    if (u.searchParams.get("decision")) {
      const back = new URL(q.get("redirect_uri"));
      if (q.get("decision") === "deny") back.searchParams.set("error", "access_denied");
      else {
        const code = crypto.randomBytes(8).toString("hex");
        codes.set(code, { p, client_id: q.get("client_id"), redirect_uri: q.get("redirect_uri"), challenge: q.get("code_challenge"), nonce: q.get("nonce") });
        back.searchParams.set("code", code);
      }
      back.searchParams.set("state", q.get("state"));
      res.writeHead(302, { Location: back.href }); return res.end();
    }
    const allow = new URL(u); allow.searchParams.set("decision", "allow");
    const deny = new URL(u); deny.searchParams.set("decision", "deny");
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(`<!doctype html><title>Mock ${p} sign-in</title><h1>Mock ${p}: authorize AI Follow Desk?</h1><p>scope: ${q.get("scope")}</p><a id="allow" href="${allow.href}">Allow</a> <a id="deny" href="${deny.href}">Cancel</a>`);
  }
  if (step === "token" && req.method === "POST") {
    const f = new URLSearchParams(await body(req));
    const c = codes.get(f.get("code")); codes.delete(f.get("code"));
    const fail = (e) => { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: e })); };
    if (!c || c.p !== p) return fail("invalid_grant");
    if (f.get("redirect_uri") !== c.redirect_uri) return fail("redirect_uri_mismatch");
    const basic = (req.headers.authorization || "").replace(/^Basic /, "");
    const clientId = f.get("client_id") || decodeURIComponent(Buffer.from(basic, "base64").toString().split(":")[0]);
    if (clientId !== c.client_id) return fail("invalid_client");
    if (c.challenge && crypto.createHash("sha256").update(f.get("code_verifier") || "").digest("base64url") !== c.challenge) return fail("pkce_failed");
    const tok = crypto.randomBytes(12).toString("hex"); tokens.set(tok, p);
    const out = { access_token: tok, token_type: "bearer" };
    if (p === "li") out.id_token = ["e30", Buffer.from(JSON.stringify({ nonce: c.nonce, aud: c.client_id, exp: Math.floor(Date.now() / 1000) + 600, sub: "li-2002" })).toString("base64url"), "sig"].join(".");
    res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(out));
  }
  if (step === "me") {
    const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
    if (tokens.get(tok) !== p) { res.writeHead(401); return res.end(); }
    res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(PROFILES[p]));
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`[mock] provider on ${PORT}`));
