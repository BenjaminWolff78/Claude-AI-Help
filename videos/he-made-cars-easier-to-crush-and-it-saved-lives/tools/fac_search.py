from proj import *
import itertools, math
def th(fov): return math.tan(math.radians(fov)/2)*9/16
def box(C,p,fov,h0=0.0,h1=1.75,w=0.26):
    x,y,d=proj(*C,(p[0],1.0,p[2])); hw=w/d/th(fov); return x,hw,d
best=[]
LET=[(2.45,0.61,-0.25),(2.45,0.61,0.66)]
for cx in [-0.6,-0.2,0.2]:
  for cz in [4.0,4.6,5.2]:
    for lx,lz in [(2.0,-0.2),(2.2,0.2),(2.3,0.5)]:
      for fov in [58,62,66]:
        C=([cx,1.75,cz],[lx,1.0,lz],fov)
        l0=proj(*C,LET[0])[0]; l1=proj(*C,LET[1])[0]; lo,hi=min(l0,l1),max(l0,l1)
        if lo<-0.6 or hi>0.75: continue
        # painter candidates near the door ends
        cands=[]
        for x10 in range(-6,22,1):
          for z10 in range(-24,34,3):
            p=(x10/10,0,z10/10)
            if p[0]>2.1 and -2.0<p[2]<3.0: continue
            x,hw,d=box(C,p,fov)
            if d<2.6 or d>6.5 or abs(x)+hw>0.85: continue
            if x+hw>lo-0.02 and x-hw<hi+0.02: continue   # covers letters
            cands.append((p,x,hw,d))
        pts=[c for c in cands if c[0][0]>=1.8 and (abs(c[0][2]+0.45)<0.35 or abs(c[0][2]-0.85)<0.35)]
        for P in pts:
          for a,b in itertools.combinations(cands,2):
            grp=[P,a,b]; ok=True
            for u,v in itertools.combinations(grp,2):
              if math.hypot(u[0][0]-v[0][0],u[0][2]-v[0][2])<0.7 or abs(u[1]-v[1])<(u[2]+v[2])*0.85: ok=False;break
            if not ok: continue
            score=-max(g[3] for g in grp)
            best.append((round(score,2),C,[(g[0],round(g[1],2),round(g[3],1)) for g in grp],(round(lo,2),round(hi,2))))
best.sort(key=lambda b:-b[0])
for b in best[:10]: print(b)
print(len(best))
