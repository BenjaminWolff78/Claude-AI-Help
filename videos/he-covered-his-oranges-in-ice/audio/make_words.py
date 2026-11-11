# words.json for the app (script tokens with punctuation, timed from whisper on the FINAL voice file) + words_kit.json
# (same timings, numbers spelled out so the kit's syllable counter sees the spoken syllables)
import json, re, difflib
W = json.load(open('words_raw.json'))
T = [re.sub(r'["“”]', '', t) for t in open('/home/claude/proj/script/script.txt').read().split()]  # captions never show quote marks
NUM = {'24': 'twenty four', '28': 'twenty eight', '32': 'thirty two', '3am': 'three a m', 'am': 'a m'}
ALIAS = {'dwayne': 'duane', "dwayne's": "duane's", 'him': "'em"}
def subs(tok):
    t = re.sub(r"[^a-z0-9' ]", " ", tok.lower().replace('-', ' ').replace('.', '')).split()
    out = []
    for x in t:
        x = ALIAS.get(x, x); out += NUM.get(x, x).split()
    return [x.replace('farmhands', 'farm hands') for x in out for x in [x]] if False else sum((NUM.get(x, x).split() if x != 'farmhands' else ['farm', 'hands'] for x in out), [])
A, ai = [], []
for i, t in enumerate(T):
    for s in subs(t): A.append(s); ai.append(i)
B, bi = [], []
for j, w in enumerate(W):
    for s in subs(w['w']): B.append(s); bi.append(j)
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
tim = {}
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'equal' or (tag == 'replace' and a1 - a0 == b1 - b0):
        for k in range(a1 - a0):
            tim.setdefault(ai[a0 + k], []).append(W[bi[b0 + k]])
    elif tag != 'equal': print('MISMATCH', tag, A[a0:a1], B[b0:b1])
out = []
for i, t in enumerate(T):
    if i not in tim: raise SystemExit(f'no timing for token {i} {t}')
    out.append({'w': t, 's': min(x['s'] for x in tim[i]), 'e': max(x['e'] for x in tim[i])})
for k in range(1, len(out)):
    if out[k]['s'] < out[k-1]['e']: out[k]['s'] = out[k-1]['e']
json.dump([dict(o, w=re.sub(r'([!?]),$', r'\1', o['w'])) for o in out], open('words.json', 'w'), indent=0)
kit = []
for o in out:
    sp = ' '.join(NUM.get(re.sub(r'[^0-9a-z]', '', o['w'].lower()), o['w']).split()) if re.search(r'\d', o['w']) else o['w']
    if re.search(r'\d', o['w']): sp += re.sub(r'[^.,!?]', '', o['w'])
    kit.append({'word': sp, 'start': o['s'], 'end': o['e']})
json.dump(kit, open('words_kit.json', 'w'), indent=0)
print(len(out), 'tokens; span %.2f-%.2f' % (out[0]['s'], out[-1]['e']))
print([ (o['w'],o['s']) for o in out if re.search(r'\d|a\.m|farmhands|em|Duane', o['w'])])
