#!/bin/bash
# rebuild shots.ts, bundle the camera dump and print the estimated kit camera rows (+ fast segments with "x")
cd /home/claude/p13 && bash build_shots.sh >/dev/null 2>&1
cd /home/claude/p13/app && timeout 300 node_modules/.bin/esbuild /home/claude/p13/camdump/dump.ts --bundle --platform=node --format=esm --outfile=/home/claude/p13/camdump/dump.mjs --alias:remotion=/home/claude/p13/camdump/stub_remotion.ts --loader:.json=json --log-level=error || exit 1
cd /home/claude/p13/camdump && node dump.mjs 1890 cams.jsonl >/dev/null && python3 camrows2.py cams.jsonl $1
