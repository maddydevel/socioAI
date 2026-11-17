// Builds the app inside the extension: app.html, app.js and data.js from app.src.html, accounts.js and feed.json.
// Extension pages can't run inline scripts, so the page's script and data become separate files.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, "..");
const src = fs.readFileSync(path.join(root, "app.src.html"), "utf8");
const headEnd = src.indexOf("</style>") + "</style>".length;
const bodyEnd = src.indexOf('<script type="application/json" id="feed-data">');
const jsStart = src.lastIndexOf("<script>") + "<script>".length, jsEnd = src.lastIndexOf("</script>");
if (headEnd < 8 || bodyEnd < 0 || jsStart < 8) throw new Error("app.src.html layout changed; update build-app.mjs");
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${src.slice(0, headEnd)}
</head>
<body>
${src.slice(headEnd, bodyEnd).trim()}
<script src="data.js"></script>
<script src="sources.js"></script>
<script src="refresh.js"></script>
<script src="app.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(here, "app.html"), html);
fs.writeFileSync(path.join(here, "app.js"), "// Built from app.src.html by build-app.mjs. Edit app.src.html, not this file.\n" + src.slice(jsStart, jsEnd).replace("/*ACCOUNTS*/", "").trim() + "\n");
const feed = JSON.parse(fs.readFileSync(path.join(root, "feed.json"), "utf8")); delete feed.status;
fs.writeFileSync(path.join(here, "data.js"), "// Built by build-app.mjs: the account list and the starting snapshot of updates.\n" + fs.readFileSync(path.join(root, "accounts.js"), "utf8") + "\nwindow.AFD_FEED = " + JSON.stringify(feed) + ";\n");
console.log("app.html, app.js, data.js written");
