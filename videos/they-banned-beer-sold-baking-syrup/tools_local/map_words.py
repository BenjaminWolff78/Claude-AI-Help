"""Map the script's own tokens (spelling, digits, punctuation) onto the heard word timings of the final voice.
Usage: python3 map_words.py script.txt heard.json out_words.json out_vc.json"""
import json, re, sys, difflib
script, heard, out, outvc = sys.argv[1:5]
txt = open(script).read().replace('’', "'")
S = re.findall(r"\S+", re.sub(r'\s+', ' ', txt))                       # display tokens with punctuation
key = lambda t: re.sub(r"[^a-z0-9']", '', t.lower())
NUM = {'3': ['three'], '30': ['thirty'], '45': ['forty', 'five']}
W0 = [w for w in json.load(open(heard)) if key(w['w'])]
W = []
for w in W0:
    for p in NUM.get(key(w['w']), [key(w['w'])]): W.append({'w': p, 's': w['s'], 'e': w['e']})
H = [w['w'] for w in W]
exp = []; owner = []                                                     # expand script tokens into heard-style words
for i, t in enumerate(S):
    k = key(t)
    for p in NUM.get(k, [k]): exp.append(p); owner.append(i)
sm = difflib.SequenceMatcher(None, exp, H, autojunk=False)
span = {}
for op, a1, a2, b1, b2 in sm.get_opcodes():
    if op == 'equal' or (op == 'replace' and a2 - a1 == b2 - b1):
        for d in range(a2 - a1):
            i = owner[a1 + d]; s, e = W[b1 + d]['s'], W[b1 + d]['e']
            span[i] = (min(span.get(i, (s, e))[0], s), max(span.get(i, (s, e))[1], e))
        if op == 'replace': print('replace (kept script spelling):', exp[a1:a2], H[b1:b2])
    else:
        print('UNMATCHED', op, exp[a1:a2], H[b1:b2])
miss = [S[i] for i in range(len(S)) if i not in span]
assert not miss, f'unmapped tokens: {miss}'
words = [{'w': S[i], 's': round(span[i][0], 3), 'e': round(span[i][1], 3)} for i in range(len(S))]
json.dump(words, open(out, 'w'), indent=0)
json.dump([{'word': w['w'], 'start': w['s'], 'end': w['e']} for w in words], open(outvc, 'w'), indent=0)
print(len(words), 'words, last end', words[-1]['e'])
