#!/bin/bash
# r94: all twelve stills with the latest code, then the AX chain
cd /home/claude/p3/app
REMOTION_TMP=/home/claude/rtmp node scripts/bridge-stills.mjs /home/claude/p3/stylelock/r94/f_ 40,520,803,945,1079,1125,1265,1305,1520,1766,1810,1840 0.5 > /tmp/st94.log 2>&1
{ REMOTION_TMP=/home/claude/rtmp node scripts/cast-sheet.mjs --spec /home/claude/p3/stylelock/ax/sheets.json && \
  REMOTION_TMP=/home/claude/rtmp node scripts/preview.mjs /home/claude/p3/stylelock/ax/lit1.json && \
  REMOTION_TMP=/home/claude/rtmp node scripts/cast-sheet.mjs --spec /home/claude/p3/stylelock/cast_spec.json; echo done; } > /tmp/lit.log 2>&1
