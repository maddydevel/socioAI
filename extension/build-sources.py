"""Writes extension/sources.js from fetch.py, so the extension's updater uses the same sources and filters.
Run: python3 -I extension/build-sources.py"""
import ast, json, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tree = ast.parse((root / "fetch.py").read_text())
want = {"BLOGS", "SUBS", "REDDIT_EXTRA", "NEWS", "MENTIONS"}
vals, overrides = {}, {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1:
        t = node.targets[0]
        if isinstance(t, ast.Name) and t.id in want:
            vals[t.id] = ast.literal_eval(node.value)
        elif isinstance(t, ast.Subscript) and isinstance(t.value, ast.Name) and t.value.id == "RELEV":
            overrides[ast.literal_eval(t.slice)] = ast.literal_eval(node.value)
missing = want - vals.keys()
if missing: sys.exit(f"missing in fetch.py: {missing}")
relev = {}
for aid, q in vals["NEWS"].items():
    terms = re.findall(r'"([^"]+)"', q) or [q.split()[0]]
    esc = "|".join(re.escape(t) for t in terms)
    relev[aid] = vals["MENTIONS"][aid] + "|" + esc if aid in vals["MENTIONS"] and aid != "moonshot" else esc
relev.update(overrides)
out = {"BLOGS": vals["BLOGS"], "SUBS": vals["SUBS"], "REDDIT_EXTRA": vals["REDDIT_EXTRA"], "NEWS": vals["NEWS"], "MENTIONS": vals["MENTIONS"], "RELEV": relev}
(root / "extension" / "sources.js").write_text("// Generated from fetch.py by build-sources.py. Do not edit by hand.\nwindow.AFD_SOURCES = " + json.dumps(out, indent=1) + ";\n")
# Keep the manifest's allowed sites in step with the feeds
import urllib.parse
mpath = root / "extension" / "manifest.json"
m = json.loads(mpath.read_text())
hosts = sorted({urllib.parse.urlparse(u).hostname for u in out["BLOGS"].values()} | {"news.google.com", "www.reddit.com"})
m["host_permissions"] = [f"https://{h}/*" for h in hosts]
mpath.write_text(json.dumps(m, indent=2) + "\n")
print(f"sources.js: {len(out['BLOGS'])} blogs, {len(out['SUBS'])+len(out['REDDIT_EXTRA'])} Reddit feeds, {len(out['NEWS'])} news searches")
