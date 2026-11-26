#!/bin/bash
# rebuild shots.ts, bundle the camera dump and print the estimated kit camera rows (+ fast segments with "x")
cd /home/claude/p10 && bash build_shots.sh >/dev/null 2>&1
cd /home/claude/p10/app && timeout 300 npx esbuild /home/claude/p12/camdump/dump.ts --bundle --platform=node --format=esm --outfile=/home/claude/p12/camdump/dump.mjs --alias:remotion=/home/claude/p12/camdump/stub_remotion.ts --loader:.json=json --log-level=error || exit 1
cd /home/claude/p12/camdump && node dump.mjs 1973 cams.jsonl >/dev/null && python3 camrows2.py cams.jsonl $1 2>/dev/null
