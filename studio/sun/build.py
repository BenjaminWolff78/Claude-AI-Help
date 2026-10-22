"""Inline timeline + scripts into one HTML page: python3 studio/sun/build.py [out.html]"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1] if len(sys.argv) > 1 else '/root/sun/sun.html'
tl = json.load(open(os.path.join(HERE, 'timeline.json')))
js = ''.join(open(os.path.join(HERE, f)).read() + '\n' for f in ['engine.js', 'shaders.js', 'render.js', 'captions.js', 'scenes.js'])
html = f'''<!doctype html><html><head><meta charset="utf-8"><title>The Long Way Out</title>
<style>html,body{{margin:0;background:#000;overflow:hidden}}canvas{{display:block}}</style></head><body>
<canvas id="gl" width="1920" height="1080"></canvas>
<script>const TL = {json.dumps(tl, ensure_ascii=False)};
{js}</script></body></html>'''
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w').write(html)
print(out, len(html))
