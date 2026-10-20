"""Build src/ep2/timeline.json from measured word timings (ElevenLabs alignment).
Scenes read any beat at runtime with WT(lineId, word, nth) so nothing is typed by hand.
Usage: python3 build_timeline.py words.json [voice.wav|-] out.json"""
import json, re, sys
import numpy as np

FPS = 30
words = json.load(open(sys.argv[1]))
lines = words['lines']
voice_end = words['duration']
close_end = lines[-1]['end']
end = {'action': round(close_end + 0.15, 3)}
end['hold'] = round(end['action'] + 2.2, 3)
end['wipe'] = round(end['hold'] + 2.0, 3)
duration = round(end['wipe'] + 0.8, 3)

ORDER = ['cold', 'linda', 'letter', 'rule', 'pivot', 'stairs', 'couple', 'fix', 'escape', 'note', 'close']
first = {}
for l in lines:
    first.setdefault(l['scene'], l['start'])
scenes = {}
for i, n in enumerate(ORDER):
    scenes[n] = {'start': 0.0 if i == 0 else round(first[n] - 0.35, 3)}
for i, n in enumerate(ORDER):
    scenes[n]['end'] = scenes[ORDER[i + 1]]['start'] if i + 1 < len(ORDER) else duration

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
captions = []
for l in lines:
    disp = l['text'].replace('"', '').split()
    toks = [(d, w['start'], w['end']) for d, w in zip(disp, l['words'])]
    assert len(disp) == len(l['words']), (l['id'], disp, [w['w'] for w in l['words']])
    chunk = []
    for idx, (d, s, e) in enumerate(toks):
        if re.search(r"\d", d) and len(chunk) >= 2:
            captions.append({'line': l['id'], 'start': chunk[0]['start'], 'words': chunk}); chunk = []
        chunk.append({'w': d, 'start': s, 'end': e})
        if d[-1] in '.,?!:' or len(chunk) == 4 or idx == len(toks) - 1:
            captions.append({'line': l['id'], 'start': chunk[0]['start'], 'words': chunk}); chunk = []
for i, c in enumerate(captions):
    nxt = captions[i + 1]['start'] if i + 1 < len(captions) else c['words'][-1]['end'] + 0.4
    c['end'] = round(min(nxt, c['words'][-1]['end'] + 0.6), 3)

n = int(duration * FPS) + 1
amp = [0.0] * n
if sys.argv[2] != '-':
    from scipy.io import wavfile
    sr, a = wavfile.read(sys.argv[2])
    a = a.astype(np.float32) / 32768
    if a.ndim > 1: a = a.mean(1)
    hop = sr // FPS
    v = np.array([np.sqrt(np.mean(a[f * hop:(f + 1) * hop] ** 2)) if len(a[f * hop:(f + 1) * hop]) else 0 for f in range(n)])
    v = np.clip(v / (np.percentile(v[v > 0.01], 95) + 1e-6), 0, 1)
    amp = [round(float(x), 2) for x in v]

tl = {'fps': FPS, 'width': 1920, 'height': 1080, 'duration': duration, 'voiceEnd': voice_end, 'scenes': scenes, 'end': end,
      'lines': [{'id': l['id'], 'scene': l['scene'], 'start': l['start'], 'end': l['end'], 'text': l['text'],
                 'words': [[w['w'], w['start'], w['end']] for w in l['words']]} for l in lines],
      'captions': captions, 'amp': amp}
json.dump(tl, open(sys.argv[3], 'w'), separators=(',', ':'))
print('duration', duration, 'captions', len(captions), 'frames', n)
