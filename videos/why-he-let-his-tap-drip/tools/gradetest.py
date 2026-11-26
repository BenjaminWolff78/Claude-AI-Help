import sys, glob, os, json, numpy as np
sys.path.insert(0, '/home/claude/p13/tools')
from gradesim import *
SH=[(0,72,'N'),(72,139,'T'),(139,482,'N'),(482,546,'M'),(546,850,'N'),(850,970,'N'),(970,1716,'T'),(1716,1890,'N')]
def light(f):
    for a,b,l in SH:
        if a<=f<b: return l
    return 'N'
frames=[]
for d in ['stills3','stills4']:
    for p in sorted(glob.glob(f'/home/claude/p13/{d}/f*/*.jpeg')):
        f=int(p.split('/')[-2][1:]); frames.append((f,p))
seen=set(); FR=[]
for f,p in sorted(frames):
    if f in seen: continue
    seen.add(f); FR.append((f,p))
cand=json.load(open(sys.argv[1])) if len(sys.argv)>1 else {}
src={}
rows=[]
for f,p in FR:
    out=np.asarray(Image.open(p).convert('RGB')).astype(float)/255
    out=out[::2,::2]
    L=light(f); P=OFFICE if L=='N' else DAWN
    s=inverse(out,P); src[f]=s
    rt=forward(s,P); err=np.abs(rt-out).mean()*255
    r=[f,L,*kit(out)]
    for k,C in cand.items():
        Q=C['N'] if L=='N' else C['T']
        r+= list(kit(forward(s,Q)))[:2]
        Image.fromarray((forward(s,Q)*255).round().astype(np.uint8)).save(f'/tmp/gt_{k}_{f:04d}.png')
    rows.append(r); print(f, L, 'rt_err %.1f'%err, ' '.join('%.2f'%x if isinstance(x,float) and x<1 else ('%.0f'%x if isinstance(x,float) else str(x)) for x in r[2:]))
A=np.array([[x for x in r[2:]] for r in rows],float)
print('MEAN', ' '.join('%.3f'%x for x in A.mean(0)))
for L in 'NT':
    sel=[i for i,r in enumerate(rows) if r[1]==L]; print(L, 'mean', ' '.join('%.3f'%x for x in A[sel].mean(0)))
np.save('/tmp/gt_src.npy', np.array([0]))
