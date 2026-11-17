"""Inject a fetched feed.json into index.html.
Usage: python3 -I build.py <feed.json> <index.html>"""
import sys, json, re

feed = json.load(open(sys.argv[1]))
feed.pop("status", None)
blob = json.dumps(feed, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
path = sys.argv[2]
html = open(path).read()
html, n = re.subn(r"/\*FEED\*/.*?/\*END\*/", lambda m: "/*FEED*/" + blob + "/*END*/", html, count=1, flags=re.S)
assert n == 1, "marker not found"
open(path, "w").write(html)
print(f"injected {len(feed['items'])} items, {len(blob)//1024} KB")
