# words.json (script tokens with punctuation, timed from whisper on the FINAL voice file) + words_kit.json (numbers spelled out)
import json, re, difflib
W = json.load(open('words_raw.json'))
T = [re.sub(r'["“”]', '', t) for t in open('/home/claude/p12/script.txt').read().split()]
NUM = {'40':'forty','50':'fifty','pigtail':'pig tail','pigtails':'pig tails','1000':'thousand','1,000':'a thousand'}
def subs(tok):
    k = tok.lower().strip('.,!?:;')
    if k in NUM: return NUM[k].split()
    return re.sub(r"[^a-z0-9' ]", " ", k.replace('-', ' ')).split()
A, ai = [], []
for i, t in enumerate(T):
    for s in subs(t): A.append(s); ai.append(i)
B, bi = [], []
for j, w in enumerate(W):
    for s in subs(w['w']): B.append(s); bi.append(j)
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False); tim = {}
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'equal':
        for k in range(a1 - a0): tim.setdefault(ai[a0 + k], []).append(W[bi[b0 + k]])
    else:
        print('DIFF', tag, A[a0:a1], B[b0:b1])
        for k in range(a0, a1):
            for j in range(b0, b1): tim.setdefault(ai[k], []).append(W[bi[j]])
out = []
for i, t in enumerate(T):
    if i not in tim: raise SystemExit(f'no timing for token {i} {t}')
    out.append({'w': t, 's': min(x['s'] for x in tim[i]), 'e': max(x['e'] for x in tim[i])})
for k in range(1, len(out)):
    if out[k]['s'] < out[k-1]['e']: out[k]['s'] = out[k-1]['e']
    if out[k]['e'] < out[k]['s']: out[k]['e'] = out[k]['s'] + 0.05
json.dump(out, open('words.json', 'w'), indent=0)
kit = []
for o in out:
    k = o['w'].lower().strip('.,!?:;'); sp = NUM[k] + re.sub(r'[^.,!?]', '', o['w'][-1:]) if k in NUM and re.search(r'\d', k) else o['w']
    kit.append({'word': sp, 'start': o['s'], 'end': o['e']})
json.dump(kit, open('words_kit.json', 'w'), indent=0)
print(len(out), 'tokens; span %.2f-%.2f' % (out[0]['s'], out[-1]['e']))
print([(o['w'], o['s']) for o in out if re.search(r'\d|Hugo|Memo|trick|Wait|first|Friday|Christmas|like|Saturdays|You', o['w'])])
