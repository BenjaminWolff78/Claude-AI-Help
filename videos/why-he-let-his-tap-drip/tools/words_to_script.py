import json, re, sys, difflib
# words.json for the final voice: whisper timings, the words spelled as in the script (20 -> twenty), kit format
heard = json.load(open(sys.argv[1])); script = open(sys.argv[2]).read().split()
n = lambda t: re.sub(r"[^a-z0-9']", '', t.lower())
hs = [n(w['w']) for w in heard]; ss = [n(t) for t in script]
out = []; sm = difflib.SequenceMatcher(None, ss, hs, autojunk=False); bad = []
for op, a1, a2, b1, b2 in sm.get_opcodes():
    if op == 'equal' or (op == 'replace' and a2 - a1 == b2 - b1):
        for k in range(a2 - a1):
            h = heard[b1 + k]; out.append({'word': script[a1 + k], 'start': h['s'], 'end': h['e']})
            if op == 'replace': bad.append((script[a1 + k], h['w']))
    else:
        bad.append((op, script[a1:a2], [h['w'] for h in heard[b1:b2]]))
json.dump(out, open(sys.argv[3], 'w'), indent=0)
print(len(out), 'words; mapped spellings / mismatches:', bad)
