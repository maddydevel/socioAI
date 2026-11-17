#!/bin/sh
# Builds the AI Follow Desk extension and packs it into dist/AI-Follow-Desk.zip (ready to install or upload to the Chrome Web Store).
set -e
cd "$(dirname "$0")"
python3 -I extension/build-sources.py
node extension/build-accounts.mjs
node extension/build-app.mjs
mkdir -p dist && rm -f dist/AI-Follow-Desk.zip
python3 -I - <<'PY'
import zipfile, pathlib
src = pathlib.Path("extension"); skip = {"test", "build-app.mjs", "build-accounts.mjs", "build-sources.py"}
with zipfile.ZipFile("dist/AI-Follow-Desk.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(src.rglob("*")):
        rel = f.relative_to(src)
        if f.is_file() and rel.parts[0] not in skip:
            z.write(f, "AI-Follow-Desk/" + str(rel))
print("dist/AI-Follow-Desk.zip ready")
PY
