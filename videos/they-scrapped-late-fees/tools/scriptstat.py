import re, sys
src = open('/home/claude/untrusted/kit/measure_like_rick.py').read()
i = src.index('def syl(w):'); j = src.index('\ndef ', i+5)
ns = {}; exec('import re\n' + src[i:j], ns); syl = ns['syl']
t = open(sys.argv[1]).read().strip()
sp = t.replace('1994', 'nineteen ninety four')
n = sum(syl(w) for w in sp.split())
S = [s for s in re.split(r'(?<=[.!?])["”]?\s+(?=[A-Z"“])', t) if s.strip()]
L = [len(s.split()) for s in S]
print('words', len(t.split()), 'syllables', n, 'est secs @4.7: %.1f @4.8: %.1f' % (n/4.7, n/4.8), '| sentences', len(S), 'avg %.1f' % (sum(L)/len(L)), 'frag<=4 %.0f%%' % (100*sum(l<=4 for l in L)/len(L)))
acc = 0
for s, l in zip(S, L):
    print('%5.1fs %2d  %s' % (sum(syl(w) for w in ' '.join(t.split()[:acc]).replace('1994','nineteen ninety four').split())/4.75, l, s[:100])); acc += l
