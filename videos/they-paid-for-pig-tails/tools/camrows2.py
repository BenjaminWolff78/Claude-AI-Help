#!/usr/bin/env python3
"""Analytic previz of the kit's camera rows (kit v3 method: 64 px tiles at 360x640, +-12 px search, similarity fit,
speed = 2*|pan| + |zoom|*734). Depths: ground plane y=0 for downward rays (the terrain is ~flat near the action), the look
distance otherwise, capped at 30 m. Tiles whose shift exceeds the search radius are dropped (the kit cannot see them);
a frame with < 3 usable tiles is n/a (as in the kit)."""
import json, sys, numpy as np
rows=[json.loads(l) for l in open(sys.argv[1])]
W,H,TS,R=360,640,64,12
def basis(c):
    p=np.array(c['pos'],float); f=np.array(c['look'],float)-p; f/=np.linalg.norm(f); r=np.cross(f,[0,1,0]); r/=np.linalg.norm(r); u=np.cross(r,f); return p,f,r,u
def proj(c,X):
    p,f,r,u=basis(c); tv=np.tan(np.radians(c['fov'])/2); th=tv*W/H; d=X-p; z=d@f
    return np.stack([(d@r)/(z*th)*W/2,(-(d@u)/(z*tv))*H/2],1), z
cx=np.arange(0,W-TS+1,TS//2)+TS/2-W/2; cy=np.arange(0,H-TS+1,TS//2)+TS/2-H/2
G=np.array([(x,y) for y in cy for x in cx],float)
def world(c,gy):
    p,f,r,u=basis(c); tv=np.tan(np.radians(c['fov'])/2); th=tv*W/H; dl=np.linalg.norm(np.array(c['look'])-p); P=[]
    for x,y in G:
        d=f+(x/(W/2))*th*r+(-y/(H/2))*tv*u; d/=np.linalg.norm(d); t=dl/max(1e-3,d@f)
        if d[1]<-1e-3:
            tg=(gy-p[1])/d[1]
            if tg>0: t=min(tg, 30)
        P.append(p+d*min(t,30))
    return np.array(P)
def top(r): return max(r['L'],key=lambda l:l['a'])
def fit(A,U):
    M=[];b=[]
    for (x,y),(u,v) in zip(A,U): M.append([1,0,x,-y]); b.append(u); M.append([0,1,y,x]); b.append(v)
    M=np.array(M); b=np.array(b); return np.linalg.lstsq(M,b,rcond=None)[0]
sp=[np.nan]; cut=[0]; ids=[top(rows[0])['id']]
for i in range(1,len(rows)):
    a,b=top(rows[i-1]),top(rows[i]); ids.append(b['id'])
    if a['id']!=b['id'] and np.linalg.norm(np.array(a['pos'])-np.array(b['pos']))>0.6 and len(rows[i]['L'])==1:
        sp.append(np.nan); cut.append(1); continue
    gy=0.0
    X=world(a,gy); A,za=proj(a,X); B,zb=proj(b,X); U=B-A
    ok=(za>0.1)&(zb>0.1)&(np.abs(U[:,0])<=R+1)&(np.abs(U[:,1])<=R+1)
    if ok.sum()<3: sp.append(np.nan); cut.append(0); continue
    p=fit(A[ok],U[ok]); sp.append(float(np.hypot(2*p[0],2*p[1])+abs(p[2])*734)); cut.append(0)
sp=np.array(sp); cut=np.array(cut); N=len(sp); t=np.arange(N)/30; valid=~np.isnan(sp)
cls=np.where(~valid,'na',np.where(sp<0.3,'hold',np.where(sp<2,'drift','move')))
move=100*np.mean(cls[valid]=='move'); p90=np.percentile(sp[valid],90); first3=np.nan_to_num(sp[:90]).mean()
flag=(np.nan_to_num(sp)>15)|(cut==1); evs=[]
for i in np.where(flag)[0]:
    if not evs or t[i]-evs[-1]>0.5: evs.append(t[i])
dur=t[-1]; gaps=np.diff([0]+evs+[dur])
print(f"moving {move:.1f}% (<=72)  fast p90 {p90:.1f} (<=25)  opening {first3:.2f} (3.7-7.8)  shot changes/10s {len(evs)/dur*10:.2f} (4.0-6.1)  calm p90 {np.percentile(gaps,90):.2f}s (>=3.5)  calm>=3s {int((gaps>=3).sum())}  cuts {int(cut.sum())}  na {int((~valid).sum())}")
if len(sys.argv)>2:
    print('events:',' '.join(f'{e:.1f}' for e in evs))
    import collections
    per=collections.defaultdict(lambda:[0,0,0.0])
    for i in range(N):
        s=per[ids[i]]; s[0]+=1
        if valid[i] and sp[i]>=2: s[1]+=1
        if valid[i]: s[2]=max(s[2],sp[i])
    print('per shot (frames, moving frames, max speed):',{k:(v[0],v[1],round(v[2],1)) for k,v in per.items()})
    np.save('/home/claude/p12/camdump/sp.npy',sp)
