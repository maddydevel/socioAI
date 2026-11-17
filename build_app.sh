#!/bin/sh
# Rebuild index.html from app.src.html + account list + fetched feed.
# Usage: ./build_app.sh <accounts.js> <feed.json>
set -e
cd "$(dirname "$0")"
cp app.src.html index.html
python3 -I - "$1" <<'PY'
import sys
s=open('index.html').read(); s=s.replace('/*ACCOUNTS*/', open(sys.argv[1]).read(), 1); open('index.html','w').write(s)
PY
python3 -I build.py "$2" index.html
